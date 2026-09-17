import { useEffect } from 'react'
import { deleteNotification, receiveNotification } from '../api/greenApi'
import { useApp } from '../context/AppContext'

const RECEIVE_TIMEOUT = 20
const RETRY_DELAY_MS = 2000

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
            applyNotification(notification)
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
          try {
            await delay(RETRY_DELAY_MS, controller.signal)
          } catch {
            break
          }
        }
      }
    }

    void poll()

    return () => {
      controller.abort()
    }
  }, [credentials, applyNotification])
}
