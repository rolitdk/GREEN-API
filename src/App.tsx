import { ChatLayout } from './components/ChatLayout'
import { LoginScreen } from './components/LoginScreen'
import { AppProvider, useApp } from './context/AppContext'

function AppContent() {
  const { credentials } = useApp()
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
