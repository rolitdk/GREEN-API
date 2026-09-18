import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { LoginScreen } from './LoginScreen'
import { MessageInput } from './MessageInput'
import { MessageList } from './MessageList'
import { NewChatForm } from './NewChatForm'
import { GreenApiError } from '../api/greenApi'
import { PhoneError } from '../utils/phone'

const { login, createChat, sendChatMessage } = vi.hoisted(() => ({
  login: vi.fn(),
  createChat: vi.fn(),
  sendChatMessage: vi.fn(),
}))

vi.mock('../context/AppContext', () => ({
  useApp: () => ({
    login,
    createChat,
    sendChatMessage,
  }),
}))

beforeEach(() => {
  login.mockReset()
  createChat.mockReset()
  sendChatMessage.mockReset()
})

describe('MessageList', () => {
  it('renders an empty state', () => {
    render(<MessageList messages={[]} />)
    expect(screen.getByText('Нет сообщений')).toBeInTheDocument()
  })

  it('renders incoming and outgoing bubbles', () => {
    render(
      <MessageList
        messages={[
          {
            id: '1',
            chatId: 'a',
            text: 'Входящее',
            direction: 'incoming',
            timestamp: Date.UTC(2024, 0, 1, 12, 0, 0),
          },
          {
            id: '2',
            chatId: 'a',
            text: 'Исходящее',
            direction: 'outgoing',
            timestamp: Date.UTC(2024, 0, 1, 12, 1, 0),
          },
        ]}
      />,
    )

    expect(screen.getByText('Входящее').closest('article')).toHaveClass(
      'bubble-incoming',
    )
    expect(screen.getByText('Исходящее').closest('article')).toHaveClass(
      'bubble-outgoing',
    )
  })
})

describe('LoginScreen', () => {
  it('submits trimmed credentials', async () => {
    const user = userEvent.setup()
    login.mockResolvedValue(undefined)
    render(<LoginScreen />)

    await user.type(screen.getByLabelText('idInstance'), ' 1101 ')
    await user.type(screen.getByLabelText('apiTokenInstance'), ' token ')
    await user.click(screen.getByRole('button', { name: 'Войти' }))

    expect(login).toHaveBeenCalledWith({
      idInstance: '1101',
      apiTokenInstance: 'token',
    })
  })

  it('shows an auth error from GREEN-API', async () => {
    const user = userEvent.setup()
    login.mockRejectedValue(new GreenApiError(401, 'nope'))
    render(<LoginScreen />)

    await user.type(screen.getByLabelText('idInstance'), '1101')
    await user.type(screen.getByLabelText('apiTokenInstance'), 'bad')
    await user.click(screen.getByRole('button', { name: 'Войти' }))

    expect(
      await screen.findByRole('alert'),
    ).toHaveTextContent('Неверные idInstance или apiTokenInstance')
  })
})

describe('NewChatForm', () => {
  it('creates a chat and clears the field', async () => {
    const user = userEvent.setup()
    createChat.mockResolvedValue(undefined)
    render(<NewChatForm />)

    await user.type(screen.getByLabelText('Номер получателя'), '79001234567')
    await user.click(screen.getByRole('button', { name: 'Создать' }))

    expect(createChat).toHaveBeenCalledWith('79001234567')
    expect(screen.getByLabelText('Номер получателя')).toHaveValue('')
  })

  it('shows a phone validation error', async () => {
    const user = userEvent.setup()
    createChat.mockRejectedValue(new PhoneError('Введите номер телефона'))
    render(<NewChatForm />)

    await user.type(screen.getByLabelText('Номер получателя'), '000')
    await user.click(screen.getByRole('button', { name: 'Создать' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Введите номер телефона',
    )
  })
})

describe('MessageInput', () => {
  it('sends a trimmed message', async () => {
    const user = userEvent.setup()
    sendChatMessage.mockResolvedValue(undefined)
    render(<MessageInput chatId="chat-1" />)

    const input = screen.getByPlaceholderText('Сообщение')
    expect(screen.getByRole('button', { name: 'Отправить' })).toBeDisabled()

    await user.type(input, 'Привет')
    await user.click(screen.getByRole('button', { name: 'Отправить' }))

    expect(sendChatMessage).toHaveBeenCalledWith('chat-1', 'Привет')
    expect(input).toHaveValue('')
  })
})
