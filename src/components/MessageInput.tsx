import { useState, type FormEvent } from 'react'
import { GreenApiError } from '../api/greenApi'
import { useApp } from '../context/AppContext'

function sendErrorMessage(error: unknown): string {
  if (error instanceof GreenApiError) {
    return `Не удалось отправить сообщение (${error.status})`
  }
  if (error instanceof Error && error.message) {
    return error.message
  }
  return 'Не удалось отправить сообщение'
}

export function MessageInput({ chatId }: { chatId: string }) {
  const { sendChatMessage } = useApp()
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const canSend = text.trim().length > 0 && !pending

  async function submit() {
    if (!canSend) {
      return
    }

    const outgoing = text
    setError(null)
    setPending(true)
    try {
      await sendChatMessage(chatId, outgoing)
      setText('')
    } catch (caught) {
      setError(sendErrorMessage(caught))
    } finally {
      setPending(false)
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void submit()
  }

  return (
    <form className="message-input" onSubmit={handleSubmit}>
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
      <div className="message-input-row">
        <input
          name="message"
          type="text"
          placeholder="Сообщение"
          autoComplete="off"
          value={text}
          disabled={pending}
          onChange={(event) => setText(event.target.value)}
        />
        <button className="btn-primary" type="submit" disabled={!canSend}>
          {pending ? '…' : 'Отправить'}
        </button>
      </div>
    </form>
  )
}
