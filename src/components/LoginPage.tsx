import { useState, type FormEvent } from 'react'
import type { Credentials } from '../types'

type Props = {
  error: string
  isSubmitting: boolean
  onSubmit: (credentials: Credentials) => Promise<void>
}

export function LoginPage({ error, isSubmitting, onSubmit }: Props) {
  const [idInstance, setIdInstance] = useState('')
  const [apiTokenInstance, setApiTokenInstance] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void onSubmit({ idInstance, apiTokenInstance })
  }

  return (
    <main className="login-page">
      <div className="login-page__background" />
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="login-card__logo" aria-hidden="true">T</div>
        <h1>Вход в Telegram Chat</h1>
        <p>Введите данные из личного кабинета GREEN-API.</p>
        <label className="login-field">
          <span>ID инстанса</span>
          <input
            autoComplete="username"
            inputMode="numeric"
            onChange={(event) => setIdInstance(event.target.value)}
            required
            value={idInstance}
          />
        </label>
        <label className="login-field">
          <span>API-токен инстанса</span>
          <input
            autoComplete="current-password"
            onChange={(event) => setApiTokenInstance(event.target.value)}
            required
            type="password"
            value={apiTokenInstance}
          />
        </label>
        {error && <div className="login-card__error" role="alert">{error}</div>}
        <button className="login-card__submit" disabled={isSubmitting} type="submit">
          {isSubmitting ? 'Проверяем…' : 'Войти'}
        </button>
      </form>
    </main>
  )
}
