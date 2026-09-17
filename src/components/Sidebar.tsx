import { useApp } from '../context/AppContext'
import { NewChatForm } from './NewChatForm'

export function Sidebar() {
  const { chats, activeChatId, selectChat } = useApp()

  return (
    <aside className="sidebar">
      <div className="sidebar-header">Чаты</div>
      <NewChatForm />
      {chats.length === 0 ? (
        <p className="sidebar-empty">Нет чатов. Создайте чат по номеру телефона.</p>
      ) : (
        <ul className="chat-list">
          {chats.map((chat) => {
            const isActive = chat.chatId === activeChatId
            return (
              <li key={chat.chatId}>
                <button
                  className={isActive ? 'chat-item chat-item-active' : 'chat-item'}
                  type="button"
                  onClick={() => selectChat(chat.chatId)}
                >
                  <span className="chat-item-avatar" aria-hidden>
                    {chat.title.slice(0, 1)}
                  </span>
                  <span className="chat-item-body">
                    <span className="chat-item-title">{chat.title}</span>
                    <span className="chat-item-subtitle">{chat.phone}</span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </aside>
  )
}
