import { describe, expect, it } from 'vitest'
import {
  applyIncomingNotification,
  chatFromCheckAccount,
  checkAccountFailureMessage,
} from './chats'
import type { IncomingNotification } from './types'

const incomingText: IncomingNotification = {
  receiptId: 42,
  body: {
    typeWebhook: 'incomingMessageReceived',
    timestamp: 1_700_000_000,
    idMessage: 'msg-1',
    senderData: {
      chatId: '79001234567@c.us',
      senderPhoneNumber: 79001234567,
      chatName: 'Анна',
    },
    messageData: {
      typeMessage: 'textMessage',
      textMessageData: { textMessage: 'Привет' },
    },
  },
}

describe('applyIncomingNotification', () => {
  it('creates a chat from a text notification', () => {
    const chats = applyIncomingNotification([], incomingText)
    expect(chats).toHaveLength(1)
    expect(chats[0]).toMatchObject({
      chatId: '79001234567@c.us',
      phone: '79001234567',
      title: 'Анна',
    })
    expect(chats[0].messages[0]).toMatchObject({
      id: 'msg-1',
      text: 'Привет',
      direction: 'incoming',
      timestamp: 1_700_000_000_000,
    })
  })

  it('ignores non-text webhooks', () => {
    const chats = applyIncomingNotification([], {
      receiptId: 1,
      body: {
        typeWebhook: 'outgoingMessageReceived',
        timestamp: 1,
        senderData: { chatId: 'x' },
        messageData: { typeMessage: 'textMessage' },
      },
    })
    expect(chats).toEqual([])
  })

  it('does not duplicate the same message id', () => {
    const once = applyIncomingNotification([], incomingText)
    const twice = applyIncomingNotification(once, incomingText)
    expect(twice[0].messages).toHaveLength(1)
  })
})

describe('chatFromCheckAccount', () => {
  it('builds a chat for an existing account', () => {
    expect(
      chatFromCheckAccount(
        { exist: true, chatId: '79001234567@c.us', fromCache: false },
        '79001234567',
      ),
    ).toEqual({
      chatId: '79001234567@c.us',
      phone: '79001234567',
      title: '+79001234567',
      messages: [],
    })
  })

  it('throws when the account does not exist', () => {
    expect(() =>
      chatFromCheckAccount(
        { exist: false, chatId: '', fromCache: false },
        '79001234567',
      ),
    ).toThrow('Аккаунта MAX с этим номером нет')
  })

  it('maps known failure reasons', () => {
    expect(
      checkAccountFailureMessage('instance is starting or not authorized'),
    ).toContain('не авторизован')
    expect(
      checkAccountFailureMessage('User get contact info limit reached'),
    ).toContain('Слишком много проверок')
    expect(checkAccountFailureMessage(undefined)).toBe(
      'Не удалось проверить аккаунт MAX',
    )
  })
})
