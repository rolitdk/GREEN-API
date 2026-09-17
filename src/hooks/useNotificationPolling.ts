import { useEffect, useRef } from 'react'
import { GreenApiError, deleteNotification, receiveNotification } from '../api/greenApi'
import { useApp } from '../context/AppContext'

const RECEIVE_TIMEOUT = 20
const RETRY_DELAY_MS = 2000
const RATE_LIMIT_DELAY_MS = 10_000

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException
    ? error.name === 'AbortError'
    : error instanceof Error && error.name === 'AbortError'
}

async function waitRemaining(
  startedAt: number,
  minIntervalMs: number,
  signal: AbortSignal,
): Promise<void> {
  const remaining = minIntervalMs - (Date.now() - startedAt)
  if (remaining > 0) {
    await delay(remaining, signal)
  }
}

function delay(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(signal.reason ?? new DOMException('Aborted', 'AbortError'))
      return
    }

    const timer = window.setTimeout(resolve, ms)
    const onAbort = () => {
      window.clearTimeout(timer)
      reject(signal.reason ?? new DOMException('Aborted', 'AbortError'))
    }
    signal.addEventListener('abort', onAbort, { once: true })
  })
}

export function useNotificationPolling(): void {
  const { credentials, applyNotification } = useApp()
  const applyNotificationRef = useRef(applyNotification)

  useEffect(() => {
    applyNotificationRef.current = applyNotification
  }, [applyNotification])

  useEffect(() => {
    if (!credentials) {
      return
    }

    const controller = new AbortController()

    const poll = async () => {
      while (!controller.signal.aborted) {
        const startedAt = Date.now()
        try {
          const notification = await receiveNotification(credentials, {
            receiveTimeout: RECEIVE_TIMEOUT,
            signal: controller.signal,
          })
          if (controller.signal.aborted) {
            break
          }
          if (notification) {
            try {
              applyNotificationRef.current(notification)
            } catch {
              // Malformed payloads still must be deleted, or the queue retries forever.
            }
            await deleteNotification(credentials, notification.receiptId, {
              signal: controller.signal,
            })
            continue
          }
          await waitRemaining(startedAt, RECEIVE_TIMEOUT * 1000, controller.signal)
        } catch (error) {
          if (controller.signal.aborted || isAbortError(error)) {
            break
          }
          if (
            error instanceof GreenApiError &&
            (error.status === 401 || error.status === 403)
          ) {
            break
          }
          const retryAfter =
            error instanceof GreenApiError && error.status === 429
              ? RATE_LIMIT_DELAY_MS
              : RETRY_DELAY_MS
          try {
            await delay(retryAfter, controller.signal)
          } catch {
            break
          }
        }
      }
    }

    // Skip the StrictMode first-mount fetch so the Network tab is not filled with aborted polls.
    const startTimer = window.setTimeout(() => {
      void poll()
    }, 0)

    return () => {
      window.clearTimeout(startTimer)
      controller.abort()
    }
  }, [credentials])
}
