import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/green-api': {
        target: 'https://api.green-api.com',
        changeOrigin: true,
        timeout: 60_000,
        rewrite: (path) => path.replace(/^\/green-api/, ''),
      },
    },
  },
})
