export class PhoneError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PhoneError'
  }
}

export function normalizePhone(input: string): string {
  const digits = input.replace(/\D/g, '')
  if (!digits) {
    throw new PhoneError('Введите номер телефона')
  }

  let phone = digits
  if (phone.length === 11 && phone.startsWith('8')) {
    phone = `7${phone.slice(1)}`
  } else if (phone.length === 10) {
    phone = `7${phone}`
  }

  const isRu = phone.startsWith('7') && phone.length === 11
  const isBy = phone.startsWith('375') && phone.length === 12
  if (!isRu && !isBy) {
    throw new PhoneError('Поддерживаются номера РФ (7) и РБ (375)')
  }

  return phone
}

export function formatPhone(phone: string): string {
  return `+${phone}`
}
