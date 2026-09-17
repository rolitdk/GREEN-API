import { formatPhone } from './phone'
import type { Chat, IncomingNotification, Message, SenderData } from './types'

export function applyIncomingNotification(
  chats: Chat[],
  notification: IncomingNotification,
): Chat[] {
  const body = notification?.body
  if (!body || body.typeWebhook !== 'incomingMessageReceived') {
    return chats
  }
  if (body.messageData?.typeMessage !== 'textMessage') {
    return chats
  }

  const text = body.messageData.textMessageData?.textMessage?.trim()
  const chatId = body.senderData?.chatId
  if (!text || !chatId) {
    return chats
  }

  const incoming: Message = {
    id: body.idMessage || `in-${notification.receiptId}`,
    chatId,
    text,
    direction: 'incoming',
    timestamp: timestampToMs(body.timestamp),
  }

  return upsertIncomingChat(chats, body.senderData, incoming)
}

function timestampToMs(timestamp: number | undefined): number {
  if (typeof timestamp !== 'number' || Number.isNaN(timestamp)) {
    return Date.now()
  }
  return timestamp < 1e12 ? timestamp * 1000 : timestamp
}

function phoneFromSender(sender: SenderData): string {
  if (sender.senderPhoneNumber) {
    return String(sender.senderPhoneNumber)
  }
  if (sender.sender && /^\d+$/.test(sender.sender)) {
    return sender.sender
  }
  return sender.chatId
}

function titleFromSender(sender: SenderData, phone: string): string {
  const name = sender.chatName?.trim() || sender.senderName?.trim()
  if (name) {
    return name
  }
  return /^\d+$/.test(phone) ? formatPhone(phone) : phone
}

function upsertIncomingChat(
  chats: Chat[],
  sender: SenderData | undefined,
  incoming: Message,
): Chat[] {
  const existing = chats.find((chat) => chat.chatId === incoming.chatId)
  if (existing) {
    if (existing.messages.some((message) => message.id === incoming.id)) {
      return chats
    }
    const updated: Chat = {
      ...existing,
      messages: [...existing.messages, incoming],
    }
    return [updated, ...chats.filter((chat) => chat.chatId !== incoming.chatId)]
  }

  const phone = sender ? phoneFromSender(sender) : incoming.chatId
  const created: Chat = {
    chatId: incoming.chatId,
    phone,
    title: sender ? titleFromSender(sender, phone) : incoming.chatId,
    messages: [incoming],
  }
  return [created, ...chats]
}
