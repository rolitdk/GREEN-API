import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { setSettings } from '../api/greenApi'
import type { Chat, Credentials } from '../types'

const STORAGE_KEY = 'green-api-credentials'

function readStoredCredentials(): Credentials | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return null
    }
    const parsed = JSON.parse(raw) as Credentials
    if (!parsed.idInstance || !parsed.apiTokenInstance) {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

function persistCredentials(credentials: Credentials): void {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(credentials))
}

type AppContextValue = {
  credentials: Credentials | null
  chats: Chat[]
  activeChatId: string | null
  selectChat: (chatId: string) => void
  login: (credentials: Credentials) => Promise<void>
  logout: () => void
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [credentials, setCredentials] = useState<Credentials | null>(
    readStoredCredentials,
  )
  const [chats, setChats] = useState<Chat[]>([])
  const [activeChatId, setActiveChatId] = useState<string | null>(null)

  const selectChat = useCallback((chatId: string) => {
    setActiveChatId(chatId)
  }, [])

  const login = useCallback(async (next: Credentials) => {
    await setSettings(next, { webhookUrl: '', incomingWebhook: 'yes' })
    persistCredentials(next)
    setCredentials(next)
  }, [])

  const logout = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY)
    setCredentials(null)
    setChats([])
    setActiveChatId(null)
  }, [])

  const value = useMemo(
    () => ({
      credentials,
      chats,
      activeChatId,
      selectChat,
      login,
      logout,
    }),
    [credentials, chats, activeChatId, selectChat, login, logout],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp(): AppContextValue {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within AppProvider')
  }
  return context
}
