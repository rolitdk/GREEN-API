import { useApp } from '../context/AppContext'
import { MessageInput } from './MessageInput'
import { MessageList } from './MessageList'
import { Sidebar } from './Sidebar'

export function ChatLayout() {
  const { credentials, chats, activeChatId, logout } = useApp()
  const activeChat = chats.find((chat) => chat.chatId === activeChatId)

  return (
    <div className="app-shell">
      <header className="app-header">
        <span className="logo">GREEN-API</span>
        <span className="instance">Инстанс {credentials?.idInstance}</span>
        <button className="btn-ghost" type="button" onClick={logout}>
          Выйти
        </button>
      </header>
      <div className="chat-layout">
        <Sidebar />
        <section className="chat-pane" aria-label="Переписка">
          {activeChat ? (
            <>
              <div className="chat-pane-header">
                <span className="chat-pane-title">{activeChat.title}</span>
                <span className="chat-pane-subtitle">{activeChat.phone}</span>
              </div>
              <MessageList messages={activeChat.messages} />
              <MessageInput key={activeChat.chatId} chatId={activeChat.chatId} />
            </>
          ) : (
            <div className="chat-pane-empty">
              <p>Выберите чат</p>
              <p className="chat-pane-hint">
                Создайте чат по номеру слева или выберите его в списке.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
