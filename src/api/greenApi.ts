import type {
  CheckAccountResponse,
  Credentials,
  DeleteNotificationResponse,
  IncomingNotification,
  SendMessageResponse,
  SetSettingsRequest,
  SetSettingsResponse,
} from '../types'

const DEFAULT_API_HOSTS = new Set([
  'https://api.green-api.com',
  'https://api.greenapi.com',
])

export class GreenApiError extends Error {
  readonly status: number
  readonly body: string

  constructor(status: number, body: string) {
    super(`GREEN-API request failed (${status}): ${body}`)
    this.name = 'GreenApiError'
    this.status = status
    this.body = body
  }
}

export function greenApiTarget(credentials: Credentials): string {
  const apiUrl = credentials.apiUrl?.trim().replace(/\/$/, '')
  if (apiUrl && !DEFAULT_API_HOSTS.has(apiUrl)) {
    return apiUrl
  }

  const cluster = credentials.idInstance.replace(/\D/g, '').slice(0, 4)
  if (cluster.length === 4) {
    return `https://${cluster}.api.green-api.com`
  }

  return 'https://api.green-api.com'
}

function methodUrl(
  credentials: Credentials,
  method: string,
  extraPath = '',
): string {
  return `${greenApiTarget(credentials)}/waInstance${credentials.idInstance}/${method}/${credentials.apiTokenInstance}${extraPath}`
}

async function parseJson<T>(response: Response): Promise<T> {
  const text = await response.text()
  if (!response.ok) {
    throw new GreenApiError(response.status, text)
  }
  if (!text) {
    throw new GreenApiError(response.status, 'Empty response')
  }
  return JSON.parse(text) as T
}

export async function sendMessage(
  credentials: Credentials,
  payload: { chatId: string; message: string },
): Promise<SendMessageResponse> {
  const response = await fetch(methodUrl(credentials, 'sendMessage'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return parseJson<SendMessageResponse>(response)
}

export async function receiveNotification(
  credentials: Credentials,
  options?: { receiveTimeout?: number; signal?: AbortSignal },
): Promise<IncomingNotification | null> {
  const receiveTimeout = options?.receiveTimeout ?? 20
  const url = `${methodUrl(credentials, 'receiveNotification')}?receiveTimeout=${receiveTimeout}`
  const response = await fetch(url, {
    cache: 'no-store',
    signal: options?.signal,
  })
  const text = await response.text()
  if (!response.ok) {
    throw new GreenApiError(response.status, text)
  }
  const trimmed = text.trim()
  if (!trimmed || trimmed === 'null') {
    return null
  }
  return JSON.parse(trimmed) as IncomingNotification
}

export async function deleteNotification(
  credentials: Credentials,
  receiptId: number,
  options?: { signal?: AbortSignal },
): Promise<DeleteNotificationResponse> {
  const response = await fetch(
    methodUrl(credentials, 'deleteNotification', `/${receiptId}`),
    {
      method: 'DELETE',
      signal: options?.signal,
    },
  )
  return parseJson<DeleteNotificationResponse>(response)
}

export async function checkAccount(
  credentials: Credentials,
  phoneNumber: number,
  force?: boolean,
): Promise<CheckAccountResponse> {
  const body: { phoneNumber: number; force?: boolean } = { phoneNumber }
  if (force !== undefined) {
    body.force = force
  }
  const response = await fetch(methodUrl(credentials, 'checkAccount'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const text = await response.text()
  if (!text) {
    throw new GreenApiError(response.status, 'Empty response')
  }
  let parsed: CheckAccountResponse
  try {
    parsed = JSON.parse(text) as CheckAccountResponse
  } catch {
    throw new GreenApiError(response.status, text)
  }
  if ('status' in parsed && parsed.status === false) {
    return parsed
  }
  if (!response.ok) {
    throw new GreenApiError(response.status, text)
  }
  return parsed
}

export async function setSettings(
  credentials: Credentials,
  settings: SetSettingsRequest,
): Promise<SetSettingsResponse> {
  const response = await fetch(methodUrl(credentials, 'setSettings'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  })
  return parseJson<SetSettingsResponse>(response)
}
