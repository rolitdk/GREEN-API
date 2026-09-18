import type { Credentials } from '../types'

export function toCredentials(
  idInstance: string,
  apiTokenInstance: string,
  apiUrl: string,
): Credentials {
  const credentials: Credentials = {
    idInstance: idInstance.trim(),
    apiTokenInstance: apiTokenInstance.trim(),
  }
  const trimmedUrl = apiUrl.trim().replace(/\/$/, '')
  if (trimmedUrl) {
    credentials.apiUrl = trimmedUrl
  }
  return credentials
}
