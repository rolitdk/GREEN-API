import { useState, type FormEvent } from 'react'
import { GreenApiError } from '../api/greenApi'
import { useApp } from '../context/AppContext'
import { credentialDefaultsFromEnv, toCredentials } from '../utils/credentials'

function loginErrorMessage(error: unknown): string {
  if (error instanceof GreenApiError) {
    if (error.status === 401) {
      return 'Неверные idInstance или apiTokenInstance'
    }
    if (error.status === 400) {
      return 'Некорректные данные инстанса'
    }
    return `Ошибка GREEN-API (${error.status})`
  }
  return 'Не удалось подключиться к GREEN-API'
}

export function LoginScreen() {
  const { login } = useApp()
  const envDefaults = credentialDefaultsFromEnv()
  const [idInstance, setIdInstance] = useState(envDefaults.idInstance)
  const [apiTokenInstance, setApiTokenInstance] = useState(
    envDefaults.apiTokenInstance,
  )
  const [apiUrl, setApiUrl] = useState(envDefaults.apiUrl)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setPending(true)
    try {
      await login(toCredentials(idInstance, apiTokenInstance, apiUrl))
    } catch (caught) {
      setError(loginErrorMessage(caught))
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <p className="logo">GREEN-API</p>
        <h1>Вход в инстанс</h1>
        <p className="login-hint">
          Укажите данные из кабинета console.green-api.com
        </p>

        <label htmlFor="idInstance">idInstance</label>
        <input
          id="idInstance"
          name="idInstance"
          type="text"
          autoComplete="username"
          required
          value={idInstance}
          onChange={(event) => setIdInstance(event.target.value)}
        />

        <label htmlFor="apiTokenInstance">apiTokenInstance</label>
        <input
          id="apiTokenInstance"
          name="apiTokenInstance"
          type="password"
          autoComplete="current-password"
          required
          value={apiTokenInstance}
          onChange={(event) => setApiTokenInstance(event.target.value)}
        />

        <label htmlFor="apiUrl">apiUrl (необязательно)</label>
        <input
          id="apiUrl"
          name="apiUrl"
          type="url"
          placeholder="https://7107.api.green-api.com"
          value={apiUrl}
          onChange={(event) => setApiUrl(event.target.value)}
        />

        {error ? (
          <p className="form-error" role="alert">
            {error}
          </p>
        ) : null}

        <button className="btn-primary" type="submit" disabled={pending}>
          {pending ? 'Проверка…' : 'Войти'}
        </button>
      </form>
    </div>
  )
}
