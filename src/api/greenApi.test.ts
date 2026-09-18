import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  GreenApiError,
  checkAccount,
  greenApiTarget,
  receiveNotification,
  sendMessage,
} from './greenApi'
import type { Credentials } from '../types'

const credentials: Credentials = {
  idInstance: '1101123456',
  apiTokenInstance: 'token',
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('greenApiTarget', () => {
  it('uses a custom apiUrl when it is not a default host', () => {
    expect(
      greenApiTarget({
        ...credentials,
        apiUrl: 'https://7107.api.green-api.com/',
      }),
    ).toBe('https://7107.api.green-api.com')
  })

  it('derives the cluster host from idInstance', () => {
    expect(greenApiTarget(credentials)).toBe('https://1101.api.green-api.com')
  })

  it('falls back to the public host', () => {
    expect(
      greenApiTarget({ idInstance: 'abc', apiTokenInstance: 'token' }),
    ).toBe('https://api.green-api.com')
  })
})

describe('sendMessage', () => {
  it('posts JSON and returns idMessage', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ idMessage: 'out-1' }), { status: 200 }),
    )
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      sendMessage(credentials, { chatId: '7900@c.us', message: 'hi' }),
    ).resolves.toEqual({ idMessage: 'out-1' })

    expect(fetchMock).toHaveBeenCalledWith(
      '/green-api/waInstance1101123456/sendMessage/token',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ chatId: '7900@c.us', message: 'hi' }),
      }),
    )
  })

  it('throws GreenApiError on HTTP failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('denied', { status: 401 })),
    )

    await expect(
      sendMessage(credentials, { chatId: 'x', message: 'hi' }),
    ).rejects.toMatchObject({ name: 'GreenApiError', status: 401 })
  })
})

describe('receiveNotification', () => {
  it('returns null for an empty body', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('null', { status: 200 })),
    )
    await expect(receiveNotification(credentials)).resolves.toBeNull()
  })
})

describe('checkAccount', () => {
  it('returns a status:false payload without throwing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            status: false,
            reason: 'instance is starting or not authorized',
          }),
          { status: 400 },
        ),
      ),
    )

    await expect(checkAccount(credentials, 79001234567)).resolves.toEqual({
      status: false,
      reason: 'instance is starting or not authorized',
    })
  })

  it('throws GreenApiError for a non-json body', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('oops', { status: 500 })),
    )

    await expect(checkAccount(credentials, 79001234567)).rejects.toBeInstanceOf(
      GreenApiError,
    )
  })
})
