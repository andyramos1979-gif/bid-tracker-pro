import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { exec } from 'child_process'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'open-folder',
      configureServer(server) {
        server.middlewares.use('/open-estimating', (_req, res) => {
          exec('open "/Users/andyramos/OneDrive/2_Bid & Estimating"')
          res.end('ok')
        })
      }
    }
  ],
})