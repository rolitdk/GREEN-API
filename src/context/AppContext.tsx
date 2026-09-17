import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { checkAccount, setSettings } from '../api/greenApi'
import { formatPhone, normalizePhone } from '../phone'
import type { Chat, CheckAccountResponse, Credentials } from '../types'

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
  createChat: (phoneInput: string) => Promise<void>
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

  const createChat = useCallback(
    async (phoneInput: string) => {
      if (!credentials) {
        throw new Error('Нет активной сессии')
      }

      const phone = normalizePhone(phoneInput)
      const existingByPhone = chats.find((chat) => chat.phone === phone)
      if (existingByPhone) {
        setActiveChatId(existingByPhone.chatId)
        return
      }

      const result = await checkAccount(credentials, Number(phone))
      const chat = chatFromCheckAccount(result, phone)

      setChats((prev) => {
        if (prev.some((item) => item.chatId === chat.chatId)) {
          return prev
        }
        return [chat, ...prev]
      })
      setActiveChatId(chat.chatId)
    },
    [credentials, chats],
  )

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
      createChat,
      login,
      logout,
    }),
    [credentials, chats, activeChatId, selectChat, createChat, login, logout],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

function chatFromCheckAccount(
  result: CheckAccountResponse,
  phone: string,
): Chat {
  if ('status' in result && result.status === false) {
    throw new Error(result.reason || 'Не удалось проверить аккаунт MAX')
  }
  if (!('exist' in result) || !result.exist || !result.chatId) {
    throw new Error('Аккаунта MAX с этим номером нет')
  }
  return {
    chatId: result.chatId,
    phone,
    title: formatPhone(phone),
  }
}

export function useApp(): AppContextValue {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within AppProvider')
  }
  return context
}
