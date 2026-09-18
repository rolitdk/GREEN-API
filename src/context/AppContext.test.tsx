import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AppProvider, useApp } from './AppContext'
import * as greenApi from '../api/greenApi'

vi.mock('../api/greenApi', () => ({
  checkAccount: vi.fn(),
  sendMessage: vi.fn(),
  setSettings: vi.fn(),
}))

const credentials = {
  idInstance: '1101123456',
  apiTokenInstance: 'token',
}

function Probe() {
  const {
    credentials: current,
    chats,
    activeChatId,
    createChat,
    sendChatMessage,
    login,
    logout,
    applyNotification,
  } = useApp()

  return (
    <div>
      <p data-testid="session">{current ? current.idInstance : 'none'}</p>
      <p data-testid="active">{activeChatId ?? 'none'}</p>
      <p data-testid="chats">{chats.length}</p>
      <p data-testid="last-message">
        {chats[0]?.messages.at(-1)?.text ?? ''}
      </p>
      <button type="button" onClick={() => void login(credentials)}>
        login
      </button>
      <button type="button" onClick={() => void createChat('89001234567')}>
        create
      </button>
      <button
        type="button"
        onClick={() => void sendChatMessage(chats[0]?.chatId ?? '', 'hello')}
      >
        send
      </button>
      <button type="button" onClick={logout}>
        logout
      </button>
      <button
        type="button"
        onClick={() =>
          applyNotification({
            receiptId: 9,
            body: {
              typeWebhook: 'incomingMessageReceived',
              timestamp: 1_700_000_000,
              idMessage: 'in-1',
              senderData: {
                chatId: '79001234567@c.us',
                senderPhoneNumber: 79001234567,
              },
              messageData: {
                typeMessage: 'textMessage',
                textMessageData: { textMessage: 'Ответ' },
              },
            },
          })
        }
      >
        notify
      </button>
    </div>
  )
}

describe('AppProvider', () => {
  beforeEach(() => {
    sessionStorage.clear()
    vi.mocked(greenApi.setSettings).mockResolvedValue({ saveSettings: true })
    vi.mocked(greenApi.checkAccount).mockResolvedValue({
      exist: true,
      chatId: '79001234567@c.us',
      fromCache: false,
    })
    vi.mocked(greenApi.sendMessage).mockResolvedValue({ idMessage: 'out-1' })
  })

  afterEach(() => {
    sessionStorage.clear()
  })

  it('logs in, creates a chat, sends a message and applies a notification', async () => {
    const user = userEvent.setup()
    render(
      <AppProvider>
        <Probe />
      </AppProvider>,
    )

    await user.click(screen.getByRole('button', { name: 'login' }))
    await waitFor(() => {
      expect(screen.getByTestId('session')).toHaveTextContent('1101123456')
    })
    expect(greenApi.setSettings).toHaveBeenCalledWith(credentials, {
      webhookUrl: '',
      incomingWebhook: 'yes',
    })
    expect(sessionStorage.getItem('green-api-credentials')).toContain(
      '1101123456',
    )

    await user.click(screen.getByRole('button', { name: 'create' }))
    await waitFor(() => {
      expect(screen.getByTestId('active')).toHaveTextContent(
        '79001234567@c.us',
      )
    })
    expect(greenApi.checkAccount).toHaveBeenCalledWith(credentials, 79001234567)
    expect(screen.getByTestId('chats')).toHaveTextContent('1')

    await user.click(screen.getByRole('button', { name: 'send' }))
    await waitFor(() => {
      expect(screen.getByTestId('last-message')).toHaveTextContent('hello')
    })

    await user.click(screen.getByRole('button', { name: 'notify' }))
    expect(screen.getByTestId('last-message')).toHaveTextContent('Ответ')

    await user.click(screen.getByRole('button', { name: 'logout' }))
    expect(screen.getByTestId('session')).toHaveTextContent('none')
    expect(screen.getByTestId('chats')).toHaveTextContent('0')
    expect(sessionStorage.getItem('green-api-credentials')).toBeNull()
  })
})
