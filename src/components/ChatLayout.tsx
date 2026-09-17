import { useApp } from '../context/AppContext'
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
            <div className="chat-pane-header">
              <span className="chat-pane-title">{activeChat.title}</span>
              <span className="chat-pane-subtitle">{activeChat.phone}</span>
            </div>
          ) : (
            <div className="chat-pane-empty">
              <p>Выберите чат</p>
              <p className="chat-pane-hint">
                Переписка появится справа, когда вы откроете чат из списка.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
