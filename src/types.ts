export type Credentials = {
  idInstance: string
  apiTokenInstance: string
  apiUrl?: string
}

export type Chat = {
  chatId: string
  phone: string
  title: string
}

export type SendMessageResponse = {
  idMessage: string
}

export type CheckAccountResponse =
  | {
      exist: boolean
      chatId: string
      fromCache: boolean
    }
  | {
      status: false
      reason: string
    }

export type SetSettingsRequest = {
  webhookUrl?: string
  incomingWebhook?: 'yes' | 'no'
}

export type SetSettingsResponse = {
  saveSettings: boolean
}

export type DeleteNotificationResponse = {
  result: boolean
  reason: string
}

export type SenderData = {
  chatId: string
  chatName?: string
  chatType?: string
  sender?: string
  senderName?: string
  senderType?: string
  senderContactName?: string
  senderPhoneNumber?: number
}

export type MessageData = {
  typeMessage: string
  textMessageData?: {
    textMessage: string
  }
}

export type NotificationBody = {
  typeWebhook: string
  timestamp: number
  idMessage?: string
  senderData?: SenderData
  messageData?: MessageData
}

export type IncomingNotification = {
  receiptId: number
  body: NotificationBody
}
