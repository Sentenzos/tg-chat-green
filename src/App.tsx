import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import { createGreenApi, notificationToMessage } from './api/greenApi'
import { ChatList } from './components/ChatList'
import { ChatWorkspace } from './components/ChatWorkspace'
import { LoginPage } from './components/LoginPage'
import { NewChatModal } from './components/NewChatModal'
import { PrimaryNavigation } from './components/PrimaryNavigation'
import { loadContacts, saveContacts } from './storage/contacts'
import type { Chat, ContactInput, Credentials, Message } from './types'

function formatPreviewTime(timestamp: number) {
  return new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' }).format(new Date(timestamp * 1000))
}

function App() {
  const [credentials, setCredentials] = useState<Credentials | null>(null)
  const [loginError, setLoginError] = useState('')
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [chats, setChats] = useState<Chat[]>([])
  const [messages, setMessages] = useState<Record<string, Message[]>>({})
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null)
  const [isNewChatOpen, setIsNewChatOpen] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [sendError, setSendError] = useState('')
  const [receiveError, setReceiveError] = useState('')
  const contactIdsRef = useRef(new Set<string>())
  const api = useMemo(() => credentials ? createGreenApi(credentials) : null, [credentials])
  const selectedChat = chats.find((chat) => chat.id === selectedChatId) ?? null

  async function login(nextCredentials: Credentials) {
    setIsLoggingIn(true)
    setLoginError('')
    try {
      await createGreenApi(nextCredentials).checkCredentials()
      const storedContacts = loadContacts(nextCredentials.idInstance)
      contactIdsRef.current = new Set(storedContacts.map((contact) => contact.id))
      setChats(storedContacts)
      setCredentials(nextCredentials)
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : 'Не удалось войти')
    } finally {
      setIsLoggingIn(false)
    }
  }

  async function addContact(contact: ContactInput) {
    if (!api || !credentials) return
    const chat = await api.addContact(contact)
    contactIdsRef.current.add(chat.id)
    setChats((current) => {
      const nextChats = [chat, ...current.filter((item) => item.id !== chat.id)]
      saveContacts(credentials.idInstance, nextChats)
      return nextChats
    })
    setSelectedChatId(chat.id)
    setIsNewChatOpen(false)
  }

  async function sendMessage(text: string) {
    if (!api || !selectedChatId) return false
    setIsSending(true)
    setSendError('')
    try {
      const id = await api.sendMessage(selectedChatId, text)
      const message: Message = {
        id,
        chatId: selectedChatId,
        text,
        timestamp: Math.floor(Date.now() / 1000),
        type: 'outgoing',
      }
      setMessages((current) => ({
        ...current,
        [selectedChatId]: [...(current[selectedChatId] || []), message],
      }))
      setChats((current) => current.map((chat) => (
        chat.id === selectedChatId
          ? {
              ...chat,
              message: text,
              date: formatPreviewTime(message.timestamp),
              outgoing: true,
            }
          : chat
      )))
      return true
    } catch (error) {
      setSendError(error instanceof Error ? error.message : 'Не удалось отправить сообщение')
      return false
    } finally {
      setIsSending(false)
    }
  }

  function logout() {
    setCredentials(null)
    setChats([])
    setMessages({})
    setSelectedChatId(null)
    setReceiveError('')
    contactIdsRef.current.clear()
  }

  useEffect(() => {
    if (!api) return
    const activeApi = api
    const controller = new AbortController()

    async function receiveMessages() {
      while (!controller.signal.aborted) {
        try {
          const notification = await activeApi.receiveNotification(controller.signal)
          setReceiveError('')
          if (!notification || controller.signal.aborted) continue

          const incoming = notificationToMessage(notification)
          if (incoming && contactIdsRef.current.has(incoming.chatId)) {
            setMessages((current) => {
              const chatMessages = current[incoming.chatId] || []
              if (chatMessages.some((message) => message.id === incoming.message.id)) return current
              return { ...current, [incoming.chatId]: [...chatMessages, incoming.message] }
            })
            setChats((current) => {
              const chat = current.find((item) => item.id === incoming.chatId)
              if (!chat) return current
              const updated = {
                ...chat,
                message: incoming.message.text,
                date: formatPreviewTime(incoming.message.timestamp),
                outgoing: false,
              }
              return [updated, ...current.filter((item) => item.id !== incoming.chatId)]
            })
          }

          await activeApi.deleteNotification(notification.receiptId, controller.signal)
        } catch (error) {
          if (controller.signal.aborted) return
          console.warn('Не удалось получить уведомление', error)
          setReceiveError(
            error instanceof Error
              ? `Не приходят сообщения: ${error.message}`
              : 'Не удалось выполнить ReceiveNotification',
          )
          await new Promise((resolve) => window.setTimeout(resolve, 2_000))
        }
      }
    }

    void receiveMessages()
    return () => controller.abort()
  }, [api])

  if (!credentials) return <LoginPage error={loginError} isSubmitting={isLoggingIn} onSubmit={login} />

  return (
    <main className={`messenger-shell${selectedChat ? ' messenger-shell--chat-open' : ''}`}>
      <PrimaryNavigation idInstance={credentials.idInstance} onLogout={logout} />
      <ChatList
        chats={chats}
        onAddChat={() => setIsNewChatOpen(true)}
        onSelectChat={setSelectedChatId}
        receiveError={receiveError}
        selectedChatId={selectedChatId}
      />
      <ChatWorkspace
        chat={selectedChat}
        isSending={isSending}
        messages={selectedChatId ? messages[selectedChatId] || [] : []}
        onBack={() => setSelectedChatId(null)}
        onSend={sendMessage}
        sendError={sendError}
      />
      {isNewChatOpen && <NewChatModal onClose={() => setIsNewChatOpen(false)} onSubmit={addContact} />}
    </main>
  )
}

export default App
