import { ChatLayout } from './components/ChatLayout'
import { LoginScreen } from './components/LoginScreen'
import { AppProvider, useApp } from './context/AppContext'
import { useNotificationPolling } from './hooks/useNotificationPolling'

function AppContent() {
  const { credentials } = useApp()
  useNotificationPolling()
  return credentials ? <ChatLayout /> : <LoginScreen />
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  )
}

export default App
