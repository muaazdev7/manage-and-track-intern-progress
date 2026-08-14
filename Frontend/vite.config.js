import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Vite config runs in Node, where import.meta.env does not exist — loadEnv
// reads the same .env files so the dev proxy and the app agree on one value.
export default defineConfig(({ mode }) => {
  // import.meta.dirname (not cwd) so .env resolves next to this config file
  // regardless of where npm was invoked from.
  const env = loadEnv(mode, import.meta.dirname, '')
  const target = env.VITE_API_URL || 'http://localhost:5000'

  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        // Only used when VITE_API_URL is unset and the app calls relative
        // paths. With it set, requests go to the backend origin directly.
        '/api': { target, changeOrigin: true },
        // ws:true upgrades the Socket.IO connection.
        '/socket.io': { target, changeOrigin: true, ws: true }
      }
    }
  }
})
