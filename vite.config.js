import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// M-18 (2026-07-23): the proxy injects the Bid API shared secret server-side.
// loadEnv('') reads BID_API_KEY from .env in the Vite (Node) process only — it is
// NOT prefixed VITE_, so it never reaches the browser bundle. The React app keeps
// making relative /api calls; the secret is added here, on the proxy hop.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const bidApiKey = env.BID_API_KEY || ''
  return {
    plugins: [
      react(),
      tailwindcss(),
    ],
    server: {
      host: '0.0.0.0',
      port: 5173,
      strictPort: true,
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:5050',
          changeOrigin: true,
          headers: bidApiKey ? { 'X-Bid-Api-Key': bidApiKey } : {},
        },
      },
    },
  }
})
