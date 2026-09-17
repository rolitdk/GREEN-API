import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { checkAccount, sendMessage, setSettings } from '../api/greenApi'
import { applyIncomingNotification } from '../chats'
import { formatPhone, normalizePhone } from '../phone'
import type {
  Chat,
  CheckAccountResponse,
  Credentials,
  IncomingNotification,
  Message,
} from '../types'

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
  sendChatMessage: (chatId: string, text: string) => Promise<void>
  applyNotification: (notification: IncomingNotification) => void
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

  const sendChatMessage = useCallback(
    async (chatId: string, text: string) => {
      if (!credentials) {
        throw new Error('Нет активной сессии')
      }

      const messageText = text.trim()
      if (!messageText) {
        throw new Error('Сообщение не может быть пустым')
      }

      const result = await sendMessage(credentials, {
        chatId,
        message: messageText,
      })

      const outgoing: Message = {
        id: result.idMessage,
        chatId,
        text: messageText,
        direction: 'outgoing',
        timestamp: Date.now(),
      }

      setChats((prev) =>
        prev.map((chat) =>
          chat.chatId === chatId
            ? { ...chat, messages: [...chat.messages, outgoing] }
            : chat,
        ),
      )
    },
    [credentials],
  )

  const applyNotification = useCallback((notification: IncomingNotification) => {
    setChats((prev) => applyIncomingNotification(prev, notification))
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
      createChat,
      sendChatMessage,
      applyNotification,
      login,
      logout,
    }),
    [
      credentials,
      chats,
      activeChatId,
      selectChat,
      createChat,
      sendChatMessage,
      applyNotification,
      login,
      logout,
    ],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

function checkAccountFailureMessage(reason: string | undefined): string {
  if (reason === 'instance is starting or not authorized') {
    return 'Инстанс запускается или не авторизован в MAX. Проверьте статус в кабинете GREEN-API и отсканируйте QR, затем повторите.'
  }
  if (reason === 'User get contact info limit reached') {
    return 'Слишком много проверок номера. Подождите и повторите позже.'
  }
  return reason || 'Не удалось проверить аккаунт MAX'
}

function chatFromCheckAccount(
  result: CheckAccountResponse,
  phone: string,
): Chat {
  if ('status' in result && result.status === false) {
    throw new Error(checkAccountFailureMessage(result.reason))
  }
  if (!('exist' in result) || !result.exist || !result.chatId) {
    throw new Error('Аккаунта MAX с этим номером нет')
  }
  return {
    chatId: result.chatId,
    phone,
    title: formatPhone(phone),
    messages: [],
  }
}

export function useApp(): AppContextValue {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within AppProvider')
  }
  return context
}
