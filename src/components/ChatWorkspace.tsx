import { Fragment, useEffect, useMemo, useRef } from 'react'
import arrowLeftIcon from '../assets/icons/arrow-left.svg'
import type { Chat, Message } from '../types'
import { ChatAvatar } from './ChatAvatar'
import { ChatComposer } from './ChatComposer'

type Props = {
  chat: Chat | null
  messages: Message[]
  isSending: boolean
  sendError: string
  onBack: () => void
  onSend: (message: string) => Promise<boolean>
}

function formatTime(timestamp: number) {
  return new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' }).format(new Date(timestamp * 1000))
}

function formatDate(timestamp: number) {
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(timestamp * 1000))
}

export function ChatWorkspace({ chat, messages, isSending, sendError, onBack, onSend }: Props) {
  const listRef = useRef<HTMLDivElement>(null)
  const datedMessages = useMemo(
    () => messages.map((message) => ({ date: formatDate(message.timestamp), message })),
    [messages],
  )

  useEffect(() => {
    const list = listRef.current
    if (list) list.scrollTop = list.scrollHeight
  }, [chat?.id, messages])

  return (
    <section className="chat-workspace" aria-label="Область диалога">
      <div className="chat-background chat-background--base" />
      <div className="chat-background chat-background--pattern" />
      {chat && (
        <>
          <header className="chat-workspace__header">
            <button aria-label="Назад" className="chat-workspace__back" onClick={onBack} type="button">
              <img alt="" className="icon" height="28" src={arrowLeftIcon} width="28" />
            </button>
            <ChatAvatar chat={chat} />
            <div className="chat-workspace__contact">
              <h2>{chat.title}</h2>
            </div>
          </header>
          <div className="message-list" ref={listRef}>
            {messages.length === 0 && <div className="message-list__state">Напишите первое сообщение</div>}
            {datedMessages.map(({ date, message }, index) => (
              <Fragment key={message.id}>
                {(index === 0 || datedMessages[index - 1].date !== date) && (
                  <div className="message-date-separator">
                    <span className="message-date">{date}</span>
                  </div>
                )}
                <article className={`message-bubble message-bubble--${message.type}`}>
                  {message.type === 'incoming' && <strong>{chat.title}</strong>}
                  <p>{message.text}</p>
                  <footer>
                    <time>{formatTime(message.timestamp)}</time>
                    {message.type === 'outgoing' && <span aria-label="Отправлено">✓</span>}
                  </footer>
                </article>
              </Fragment>
            ))}
          </div>
          <ChatComposer error={sendError} isSending={isSending} onSend={onSend} />
        </>
      )}
    </section>
  )
}
