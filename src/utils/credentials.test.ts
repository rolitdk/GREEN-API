import { describe, expect, it } from 'vitest'
import { toCredentials } from './credentials'

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
