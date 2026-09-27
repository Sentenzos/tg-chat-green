import type { ContactInput, Credentials, IncomingMessage } from '../types'

const API_URL = 'https://api.green-api.com'

type Fetch = typeof fetch

type QuotaStatus = {
  method?: string
  status?: string
  description?: string
}

type ErrorResponse = {
  message?: string
  reason?: string
  invokeStatus?: QuotaStatus
  correspondentsStatus?: QuotaStatus
  quotaData?: QuotaStatus
}

type Notification = {
  receiptId: number
  body: {
    typeWebhook?: string
    idMessage?: string
    timestamp?: number
    senderData?: {
      chatId?: string
    }
    messageData?: {
      typeMessage?: string
      textMessageData?: { textMessage?: string }
      extendedTextMessageData?: { text?: string }
    }
  }
}

export class GreenApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'GreenApiError'
    this.status = status
  }
}

function getErrorMessage(body: ErrorResponse | null, status: number) {
  if (status === 466) {
    const quota = body?.correspondentsStatus || body?.quotaData || body?.invokeStatus
    const isChatLimit = quota?.method === 'correspondents'
      || quota?.status?.includes('CORRESPONDENTS')

    if (isChatLimit) {
      return 'Достигнут лимит чатов тарифа Telegram Developer'
    }

    if (quota?.method) {
      return `Исчерпан месячный лимит метода ${quota.method}`
    }

    return quota?.description || 'Превышен лимит тарифа Telegram Developer'
  }

  return body?.message || body?.reason || 'GREEN-API вернул ошибку'
}

function getInitials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
}

function getTone(chatId: string) {
  const tones = ['blue', 'green', 'orange', 'purple', 'pink'] as const
  const hash = [...chatId].reduce((sum, character) => sum + character.charCodeAt(0), 0)
  return tones[hash % tones.length]
}

export function normalizePhoneNumber(value: string) {
  const phoneNumber = value.replace(/\D/g, '')
  if (phoneNumber.length < 10 || phoneNumber.length > 15) {
    throw new Error('Введите номер телефона в международном формате')
  }
  return phoneNumber
}

export function notificationToMessage(notification: Notification): IncomingMessage | null {
  const body = notification.body
  const chatId = body.senderData?.chatId

  if (body.typeWebhook !== 'incomingMessageReceived' || !body.idMessage || !chatId) {
    return null
  }

  let text: string | undefined
  if (body.messageData?.typeMessage === 'textMessage') {
    text = body.messageData.textMessageData?.textMessage
  } else if (body.messageData?.typeMessage === 'extendedTextMessage') {
    text = body.messageData.extendedTextMessageData?.text
  }

  if (!text) return null

  return {
    chatId,
    message: {
      id: body.idMessage,
      chatId,
      text,
      timestamp: body.timestamp || Math.floor(Date.now() / 1000),
      type: 'incoming',
    },
  }
}

export function createGreenApi(credentials: Credentials, fetchImpl: Fetch = fetch) {
  const idInstance = credentials.idInstance.trim()
  const apiToken = credentials.apiTokenInstance.trim()

  function url(method: string, suffix = '') {
    return `${API_URL}/waInstance${idInstance}/${method}/${apiToken}${suffix}`
  }

  async function request<T>(method: string, init?: RequestInit, suffix = ''): Promise<T> {
    const response = await fetchImpl(url(method, suffix), {
      ...init,
      headers: {
        Accept: 'application/json',
        ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
        ...init?.headers,
      },
    })
    const body = await response.json().catch(() => null) as (T & ErrorResponse) | null

    if (!response.ok) {
      throw new GreenApiError(getErrorMessage(body, response.status), response.status)
    }
    return body as T
  }

  return {
    async checkCredentials() {
      const settings = await request<{
        typeInstance?: string
        incomingWebhook?: string
        webhookUrl?: string
      }>('getSettings')
      if (settings.typeInstance !== 'telegram') {
        throw new Error('Укажите данные Telegram-инстанса')
      }
      if (settings.incomingWebhook !== 'yes') {
        throw new Error('Включите в GREEN-API получение уведомлений о входящих сообщениях')
      }
      if (settings.webhookUrl) {
        throw new Error('Очистите Webhook URL в настройках GREEN-API для работы ReceiveNotification')
      }
      const state = await request<{ stateInstance?: string }>('getStateInstance')
      if (state.stateInstance !== 'authorized') {
        throw new Error('Инстанс Telegram не авторизован')
      }
    },

    async addContact(contact: ContactInput) {
      const phoneNumber = normalizePhoneNumber(contact.phoneNumber)
      const account = await request<{
        exist: boolean
        chatId: string
        status?: boolean
        reason?: string
      }>('checkAccount', {
        method: 'POST',
        body: JSON.stringify({ phoneNumber: Number(phoneNumber) }),
      })

      if (account.status === false) throw new Error(account.reason || 'Не удалось проверить номер')
      if (!account.exist || !account.chatId) throw new Error('На этот номер не зарегистрирован Telegram')

      try {
        await request<{ addContact: boolean }>('addContact', {
          method: 'POST',
          body: JSON.stringify({
            chatId: account.chatId,
            firstName: contact.firstName.trim(),
            ...(contact.lastName.trim() ? { lastName: contact.lastName.trim() } : {}),
          }),
        })
      } catch (error) {
        if (!(error instanceof GreenApiError) || error.status !== 400 || !/already exists/i.test(error.message)) {
          throw error
        }
      }

      const title = [contact.firstName.trim(), contact.lastName.trim()].filter(Boolean).join(' ')
      return {
        id: account.chatId,
        title,
        phoneNumber,
        avatar: getInitials(title) || '?',
        avatarTone: getTone(account.chatId),
        message: 'Нет сообщений',
        date: '',
      }
    },

    async sendMessage(chatId: string, message: string) {
      const result = await request<{ idMessage: string }>('sendMessage', {
        method: 'POST',
        body: JSON.stringify({ chatId, message }),
      })
      return result.idMessage
    },

    receiveNotification(signal: AbortSignal) {
      return request<Notification | null>('receiveNotification', { signal }, '?receiveTimeout=5')
    },

    async deleteNotification(receiptId: number, signal: AbortSignal) {
      await request<{ result: boolean }>('deleteNotification', {
        method: 'DELETE',
        signal,
      }, `/${receiptId}`)
    },
  }
}
