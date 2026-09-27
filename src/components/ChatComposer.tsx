import { useState, type FormEvent, type KeyboardEvent } from 'react'
import microphoneIcon from '../assets/icons/microphone.svg'
import plusIcon from '../assets/icons/plus.svg'
import sendIcon from '../assets/icons/send.svg'
import stickerIcon from '../assets/icons/sticker.svg'
import videoMessageIcon from '../assets/icons/video-message.svg'

type Props = {
  error: string
  isSending: boolean
  onSend: (message: string) => Promise<boolean>
}

export function ChatComposer({ error, isSending, onSend }: Props) {
  const [message, setMessage] = useState('')
  const hasText = message.trim().length > 0

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!hasText || isSending) return
    const sent = await onSend(message.trim())
    if (sent) setMessage('')
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      event.currentTarget.form?.requestSubmit()
    }
  }

  return (
    <div className="chat-composer-wrap">
      {error && <div className="chat-composer__error" role="alert">{error}</div>}
      <form className="chat-composer" onSubmit={(event) => void handleSubmit(event)}>
        <button aria-label="Прикрепить файл" className="chat-composer__button" type="button">
          <img alt="" className="icon" height="24" src={plusIcon} width="24" />
        </button>
        <textarea
          className="chat-composer__input"
          disabled={isSending}
          maxLength={4096}
          onChange={(event) => setMessage(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message"
          rows={1}
          value={message}
        />
        <div className="chat-composer__actions">
          <button aria-label="Стикеры" className="chat-composer__button" type="button">
            <img alt="" className="icon" height="24" src={stickerIcon} width="24" />
          </button>
          {hasText ? (
            <button
              aria-label="Отправить"
              className="chat-composer__button chat-composer__send"
              disabled={isSending}
              type="submit"
            >
              <img alt="" className="icon" height="22" src={sendIcon} width="22" />
            </button>
          ) : (
            <>
              <button aria-label="Видеосообщение" className="chat-composer__button" type="button">
                <img alt="" className="icon" height="24" src={videoMessageIcon} width="24" />
              </button>
              <button aria-label="Голосовое сообщение" className="chat-composer__button" type="button">
                <img alt="" className="icon" height="24" src={microphoneIcon} width="24" />
              </button>
            </>
          )}
        </div>
      </form>
    </div>
  )
}
