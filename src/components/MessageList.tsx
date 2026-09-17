import { useEffect, useRef } from 'react'
import type { Message } from '../types'

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function MessageList({ messages }: { messages: Message[] }) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView()
  }, [messages])

  if (messages.length === 0) {
    return (
      <div className="message-list message-list-empty">
        <p>Нет сообщений</p>
        <p className="chat-pane-hint">Напишите первое сообщение ниже.</p>
      </div>
    )
  }

  return (
    <div className="message-list">
      {messages.map((message) => (
        <article
          key={message.id}
          className={`bubble bubble-${message.direction}`}
        >
          <p className="bubble-text">{message.text}</p>
          <time
            className="bubble-time"
            dateTime={new Date(message.timestamp).toISOString()}
          >
            {formatTime(message.timestamp)}
          </time>
        </article>
      ))}
      <div ref={bottomRef} />
    </div>
  )
}
