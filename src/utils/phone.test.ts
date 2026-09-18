import { describe, expect, it } from 'vitest'
import { PhoneError, formatPhone, normalizePhone } from './phone'

describe('normalizePhone', () => {
  it('keeps a valid Russian number', () => {
    expect(normalizePhone('+7 (900) 123-45-67')).toBe('79001234567')
  })

  it('converts 8xxxxxxxxxx to 7xxxxxxxxxx', () => {
    expect(normalizePhone('89001234567')).toBe('79001234567')
  })

  it('adds 7 to a 10-digit local number', () => {
    expect(normalizePhone('9001234567')).toBe('79001234567')
  })

  it('keeps a valid Belarus number', () => {
    expect(normalizePhone('+375 29 123-45-67')).toBe('375291234567')
  })

  it('rejects an empty value', () => {
    expect(() => normalizePhone('   ')).toThrow(PhoneError)
    expect(() => normalizePhone('abc')).toThrow('Введите номер телефона')
  })

  it('rejects unsupported countries', () => {
    expect(() => normalizePhone('380501234567')).toThrow(
      'Поддерживаются номера РФ (7) и РБ (375)',
    )
  })
})

describe('formatPhone', () => {
  it('adds a plus prefix', () => {
    expect(formatPhone('79001234567')).toBe('+79001234567')
  })
})
