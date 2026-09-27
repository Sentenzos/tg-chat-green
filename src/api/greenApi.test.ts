import { describe, expect, it, vi } from 'vitest'
import { createGreenApi, notificationToMessage, normalizePhoneNumber } from './greenApi'

const credentials = {
  idInstance: '4100123456',
  apiTokenInstance: 'test-token',
}

function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('greenApi', () => {
  it('проверяет авторизацию инстанса', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(response({
        typeInstance: 'telegram',
        incomingWebhook: 'yes',
        webhookUrl: '',
      }))
      .mockResolvedValueOnce(response({ stateInstance: 'authorized' }))
    const api = createGreenApi(credentials, fetchMock)

    await api.checkCredentials()

    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('/getStateInstance/test-token'),
      expect.any(Object),
    )
  })

  it('нормализует номер телефона', () => {
    expect(normalizePhoneNumber('+7 (999) 123-45-67')).toBe('79991234567')
    expect(() => normalizePhoneNumber('123')).toThrow('международном формате')
  })

  it('не запускает чат без входящих уведомлений в настройках', async () => {
    const api = createGreenApi(credentials, vi.fn().mockResolvedValue(response({
      typeInstance: 'telegram',
      incomingWebhook: 'no',
      webhookUrl: '',
    })))

    await expect(api.checkCredentials()).rejects.toThrow('Включите')
  })

  it('проверяет аккаунт и добавляет контакт по chatId', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(response({ exist: true, chatId: '10000001' }))
      .mockResolvedValueOnce(response({ addContact: true }))
    const api = createGreenApi(credentials, fetchMock)

    const chat = await api.addContact({
      phoneNumber: '+7 999 123-45-67',
      firstName: 'Иван',
      lastName: 'Иванов',
    })

    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ phoneNumber: 79991234567 })
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({
      chatId: '10000001',
      firstName: 'Иван',
      lastName: 'Иванов',
    })
    expect(chat.id).toBe('10000001')
  })

  it('сообщает, если номер не найден в Telegram', async () => {
    const api = createGreenApi(credentials, vi.fn().mockResolvedValue(response({ exist: false, chatId: '' })))

    await expect(api.addContact({
      phoneNumber: '79991234567',
      firstName: 'Иван',
      lastName: '',
    })).rejects.toThrow('не зарегистрирован')
  })

  it('понятно сообщает о превышении лимита тарифа', async () => {
    const api = createGreenApi(credentials, vi.fn().mockResolvedValue(response({
      correspondentsStatus: {
        method: 'correspondents',
        status: 'CORRESPONDENTS_QUOTA_EXCEEDED',
      },
    }, 466)))

    await expect(api.addContact({
      phoneNumber: '79991234567',
      firstName: 'Иван',
      lastName: '',
    })).rejects.toThrow('лимит чатов тарифа Telegram Developer')
  })

  it('отправляет текстовое сообщение', async () => {
    const fetchMock = vi.fn().mockResolvedValue(response({ idMessage: 'message-1' }))
    const api = createGreenApi(credentials, fetchMock)

    const idMessage = await api.sendMessage('10000001', 'Привет!')

    expect(idMessage).toBe('message-1')
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      chatId: '10000001',
      message: 'Привет!',
    })
  })

  it('преобразует входящее текстовое уведомление', () => {
    const incoming = notificationToMessage({
      receiptId: 1,
      body: {
        typeWebhook: 'incomingMessageReceived',
        idMessage: 'message-2',
        timestamp: 1763115112,
        senderData: { chatId: '10000001' },
        messageData: {
          typeMessage: 'textMessage',
          textMessageData: { textMessage: 'Ответ' },
        },
      },
    })

    expect(incoming).toMatchObject({
      chatId: '10000001',
      message: { text: 'Ответ', type: 'incoming' },
    })
  })

  it('запрашивает следующее уведомление методом ReceiveNotification', async () => {
    const fetchMock = vi.fn().mockResolvedValue(response(null))
    const api = createGreenApi(credentials, fetchMock)
    const controller = new AbortController()

    await api.receiveNotification(controller.signal)

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.green-api.com/waInstance4100123456/receiveNotification/test-token?receiveTimeout=5',
      expect.objectContaining({ signal: controller.signal }),
    )
  })

  it('принимает расширенное текстовое сообщение со ссылкой', () => {
    const incoming = notificationToMessage({
      receiptId: 2,
      body: {
        typeWebhook: 'incomingMessageReceived',
        idMessage: 'message-3',
        timestamp: 1763115112,
        senderData: { chatId: '10000001' },
        messageData: {
          typeMessage: 'extendedTextMessage',
          extendedTextMessageData: { text: 'https://example.com' },
        },
      },
    })

    expect(incoming?.message.text).toBe('https://example.com')
  })
})
