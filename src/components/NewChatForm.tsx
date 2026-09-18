import { useState, type FormEvent } from 'react'
import { GreenApiError } from '../api/greenApi'
import { useApp } from '../context/AppContext'
import { PhoneError } from '../utils/phone'

function createChatErrorMessage(error: unknown): string {
  if (error instanceof PhoneError) {
    return error.message
  }
  if (error instanceof GreenApiError) {
    if (error.status === 404) {
      return 'CheckAccount недоступен на этом хосте. Укажите apiUrl из кабинета MAX-инстанса.'
    }
    return `Не удалось проверить номер (${error.status})`
  }
  if (error instanceof Error && error.message) {
    return error.message
  }
  return 'Не удалось создать чат'
}

export function NewChatForm() {
  const { createChat } = useApp()
  const [phone, setPhone] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setPending(true)
    try {
      await createChat(phone)
      setPhone('')
    } catch (caught) {
      setError(createChatErrorMessage(caught))
    } finally {
      setPending(false)
    }
  }

  return (
    <form className="new-chat-form" onSubmit={handleSubmit}>
      <label htmlFor="recipientPhone">Номер получателя</label>
      <div className="new-chat-row">
        <input
          id="recipientPhone"
          name="recipientPhone"
          type="tel"
          inputMode="tel"
          placeholder="79001234567"
          autoComplete="tel"
          required
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
        />
        <button className="btn-primary" type="submit" disabled={pending}>
          {pending ? '…' : 'Создать'}
        </button>
      </div>
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  )
}
