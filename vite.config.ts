import type { IncomingMessage } from 'node:http'
import react from '@vitejs/plugin-react'
import { defineConfig, type ProxyOptions } from 'vite'

const GREEN_API_HOST =
  /^(?:[a-z0-9-]+\.)*api\.green-api\.com$|^api\.greenapi\.com$|^(?:[a-z0-9-]+\.)*api\.greenapi\.com$/i

function proxyTargetFromRequest(req: IncomingMessage): string {
  const header = req.headers['x-green-api-target']
  if (typeof header === 'string') {
    try {
      const url = new URL(header)
      if (url.protocol === 'https:' && GREEN_API_HOST.test(url.hostname)) {
        return url.origin
      }
    } catch {
      // fall through to cluster host
    }
  }

  const match = req.url?.match(/waInstance(\d{4})/)
  if (match) {
    return `https://${match[1]}.api.green-api.com`
  }

  return 'https://api.green-api.com'
}

const greenApiProxy = {
  target: 'https://api.green-api.com',
  changeOrigin: true,
  timeout: 60_000,
  rewrite: (path: string) => path.replace(/^\/green-api/, ''),
  router(req: IncomingMessage) {
    return proxyTargetFromRequest(req)
  },
} as ProxyOptions

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/green-api': greenApiProxy,
    },
  },
})
