import type { IncomingMessage, ServerResponse } from 'node:http'
import https from 'node:https'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

const GREEN_API_HOST =
  /^(?:[a-z0-9-]+\.)*api\.green-api\.com$|^api\.greenapi\.com$|^(?:[a-z0-9-]+\.)*api\.greenapi\.com$/i

const HOP_BY_HOP = new Set([
  'connection',
  'content-length',
  'host',
  'keep-alive',
  'proxy-connection',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
  'x-green-api-target',
])

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

function outgoingHeaders(
  req: IncomingMessage,
  host: string,
): Record<string, string | string[] | number | undefined> {
  const headers: Record<string, string | string[] | number | undefined> = {}
  for (const [key, value] of Object.entries(req.headers)) {
    if (!value || HOP_BY_HOP.has(key.toLowerCase())) {
      continue
    }
    headers[key] = value
  }
  headers.host = host
  return headers
}

function incomingHeaders(
  headers: IncomingMessage['headers'],
): Record<string, string | string[] | number | undefined> {
  const result: Record<string, string | string[] | number | undefined> = {}
  for (const [key, value] of Object.entries(headers)) {
    if (!value || HOP_BY_HOP.has(key.toLowerCase())) {
      continue
    }
    result[key] = value
  }
  return result
}

function proxyGreenApi(req: IncomingMessage, res: ServerResponse): void {
  const path = (req.url ?? '').replace(/^\/green-api/, '')
  const target = new URL(`${proxyTargetFromRequest(req)}${path}`)

  const proxyReq = https.request(
    {
      hostname: target.hostname,
      port: 443,
      path: `${target.pathname}${target.search}`,
      method: req.method,
      headers: outgoingHeaders(req, target.host),
      timeout: 60_000,
    },
    (proxyRes) => {
      try {
        res.writeHead(proxyRes.statusCode ?? 502, incomingHeaders(proxyRes.headers))
      } catch {
        res.writeHead(proxyRes.statusCode ?? 502)
      }
      proxyRes.pipe(res)
    },
  )

  proxyReq.on('timeout', () => {
    proxyReq.destroy()
  })

  proxyReq.on('error', () => {
    if (!res.headersSent) {
      res.statusCode = 502
      res.setHeader('Content-Type', 'text/plain; charset=utf-8')
      res.end('GREEN-API proxy error')
    } else if (!res.writableEnded) {
      res.end()
    }
  })

  req.pipe(proxyReq)
}

function greenApiProxyPlugin(): Plugin {
  const middleware = (
    req: IncomingMessage,
    res: ServerResponse,
    next: () => void,
  ) => {
    const url = req.url ?? ''
    if (!url.startsWith('/green-api/') && !url.startsWith('/green-api?')) {
      next()
      return
    }
    proxyGreenApi(req, res)
  }

  return {
    name: 'green-api-proxy',
    configureServer(server) {
      server.middlewares.use(middleware)
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware)
    },
  }
}

export default defineConfig({
  plugins: [react(), greenApiProxyPlugin()],
})
