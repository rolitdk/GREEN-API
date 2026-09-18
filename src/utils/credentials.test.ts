import { afterEach, describe, expect, it, vi } from 'vitest'
import { credentialDefaultsFromEnv, toCredentials } from './credentials'

describe('toCredentials', () => {
  it('trims fields and omits empty apiUrl', () => {
    expect(toCredentials(' 1101 ', ' token ', '   ')).toEqual({
      idInstance: '1101',
      apiTokenInstance: 'token',
    })
  })

  it('keeps apiUrl without a trailing slash', () => {
    expect(
      toCredentials('1101', 'token', 'https://7107.api.green-api.com/'),
    ).toEqual({
      idInstance: '1101',
      apiTokenInstance: 'token',
      apiUrl: 'https://7107.api.green-api.com',
    })
  })
})

describe('credentialDefaultsFromEnv', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('reads VITE_ credentials', () => {
    vi.stubEnv('VITE_ID_INSTANCE', ' 11011234 ')
    vi.stubEnv('VITE_API_TOKEN_INSTANCE', ' secret ')
    vi.stubEnv('VITE_API_URL', 'https://api.green-api.com')

    expect(credentialDefaultsFromEnv()).toEqual({
      idInstance: '11011234',
      apiTokenInstance: 'secret',
      apiUrl: 'https://api.green-api.com',
    })
  })

  it('returns empty strings when env is missing', () => {
    vi.stubEnv('VITE_ID_INSTANCE', '')
    vi.stubEnv('VITE_API_TOKEN_INSTANCE', '')
    vi.stubEnv('VITE_API_URL', '')

    expect(credentialDefaultsFromEnv()).toEqual({
      idInstance: '',
      apiTokenInstance: '',
      apiUrl: '',
    })
  })
})
