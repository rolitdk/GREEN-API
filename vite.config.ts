/// <reference types="vitest/config" />
import type { IncomingMessage, ServerResponse } from 'node:http'
import https from 'node:https'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

const GREEN_API_HOST =
  /^(?:[a-z0-9-]+\.)*api\.green-api\.com$|^api\.greenapi\.com$|^(?:[a-z0-9-]+\.)*api\.greenapi\.com$/i

const HOP_BY_HOP = new Set([
  'connection',
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

function copyHeaders(
  headers: IncomingMessage['headers'],
  extra: Record<string, string | number> = {},
): Record<string, string | string[] | number> {
  const result: Record<string, string | string[] | number> = { ...extra }
  for (const [key, value] of Object.entries(headers)) {
    if (value === undefined || HOP_BY_HOP.has(key.toLowerCase())) {
      continue
    }
    result[key] = value
  }
  return result
}

function readRequestBody(req: IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    if (req.readableEnded) {
      resolve(Buffer.alloc(0))
      return
    }
    const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer | string) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
    })
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

async function proxyGreenApi(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  const path = (req.url ?? '').replace(/^\/green-api/, '')
  const target = new URL(`${proxyTargetFromRequest(req)}${path}`)
  const body = await readRequestBody(req)
  const headers = copyHeaders(req.headers, { host: target.host })
  if (body.length > 0) {
    headers['content-length'] = body.length
  }

  const proxyReq = https.request(
    {
      hostname: target.hostname,
      port: 443,
      path: `${target.pathname}${target.search}`,
      method: req.method,
      headers,
      timeout: 60_000,
    },
    (proxyRes) => {
      try {
        res.writeHead(
          proxyRes.statusCode ?? 502,
          copyHeaders(proxyRes.headers),
        )
      } catch {
        res.writeHead(proxyRes.statusCode ?? 502)
      }
      proxyRes.pipe(res)
    },
  )

  const abortUpstream = () => {
    proxyReq.destroy()
  }

  req.on('aborted', abortUpstream)
  res.on('close', () => {
    if (!res.writableEnded) {
      abortUpstream()
    }
  })

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

  proxyReq.end(body.length ? body : undefined)
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
    void proxyGreenApi(req, res).catch(() => {
      if (!res.headersSent) {
        res.statusCode = 502
        res.setHeader('Content-Type', 'text/plain; charset=utf-8')
        res.end('GREEN-API proxy error')
      } else if (!res.writableEnded) {
        res.end()
      }
    })
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
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
})
