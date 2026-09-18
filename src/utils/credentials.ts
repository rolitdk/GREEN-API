import type { Credentials } from '../types'

export type CredentialFields = {
  idInstance: string
  apiTokenInstance: string
  apiUrl: string
}

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

export function credentialDefaultsFromEnv(): CredentialFields {
  return {
    idInstance: import.meta.env.VITE_ID_INSTANCE?.trim() ?? '',
    apiTokenInstance: import.meta.env.VITE_API_TOKEN_INSTANCE?.trim() ?? '',
    apiUrl: import.meta.env.VITE_API_URL?.trim() ?? '',
  }
}
