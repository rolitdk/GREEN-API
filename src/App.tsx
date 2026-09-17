import { LoginScreen } from './components/LoginScreen'
import { AppProvider, useApp } from './context/AppContext'

function AuthenticatedShell() {
  const { credentials, logout } = useApp()

  return (
    <div className="app-shell">
      <header className="app-header">
        <span className="logo">GREEN-API</span>
        <span className="instance">Инстанс {credentials?.idInstance}</span>
        <button className="btn-ghost" type="button" onClick={logout}>
          Выйти
        </button>
      </header>
      <main className="session-placeholder">
        <p>Инстанс подключён. Выберите чат, чтобы начать переписку.</p>
      </main>
    </div>
  )
}

function AppContent() {
  const { credentials } = useApp()
  return credentials ? <AuthenticatedShell /> : <LoginScreen />
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  )
}

export default App
