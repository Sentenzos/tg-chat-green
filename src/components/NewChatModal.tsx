import { useState, type FormEvent } from 'react'
import type { ContactInput } from '../types'

type Props = {
  onClose: () => void
  onSubmit: (contact: ContactInput) => Promise<void>
}

export function NewChatModal({ onClose, onSubmit }: Props) {
  const [phoneNumber, setPhoneNumber] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      await onSubmit({ phoneNumber, firstName, lastName })
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Не удалось добавить контакт')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <form
        aria-modal="true"
        className="new-chat-modal"
        onMouseDown={(event) => event.stopPropagation()}
        onSubmit={(event) => void handleSubmit(event)}
        role="dialog"
      >
        <h2>Новый чат</h2>
        <p>Введите данные пользователя Telegram.</p>
        <label className="contact-field">
          <span>Номер телефона</span>
          <input
            autoFocus
            disabled={isSubmitting}
            inputMode="tel"
            onChange={(event) => setPhoneNumber(event.target.value)}
            placeholder="+7 999 000-00-00"
            required
            value={phoneNumber}
          />
        </label>
        <label className="contact-field">
          <span>Имя</span>
          <input
            disabled={isSubmitting}
            maxLength={64}
            onChange={(event) => setFirstName(event.target.value)}
            placeholder="Иван"
            required
            value={firstName}
          />
        </label>
        <label className="contact-field">
          <span>Фамилия <small>необязательно</small></span>
          <input
            disabled={isSubmitting}
            maxLength={64}
            onChange={(event) => setLastName(event.target.value)}
            placeholder="Иванов"
            value={lastName}
          />
        </label>
        {error && <div className="new-chat-modal__error" role="alert">{error}</div>}
        <div className="new-chat-modal__actions">
          <button
            className="modal-button modal-button--secondary"
            disabled={isSubmitting}
            onClick={onClose}
            type="button"
          >
            Отмена
          </button>
          <button className="modal-button modal-button--primary" disabled={isSubmitting} type="submit">
            {isSubmitting ? 'Добавляем…' : 'OK'}
          </button>
        </div>
      </form>
    </div>
  )
}
