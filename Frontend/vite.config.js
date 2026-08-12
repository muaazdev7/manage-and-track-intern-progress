import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': { target: 'http://localhost:5000', changeOrigin: true },
      // ws:true upgrades the Socket.IO connection. Proxying it keeps the
      // client same-origin, so the httpOnly JWT cookie is sent automatically.
      '/socket.io': { target: 'http://localhost:5000', changeOrigin: true, ws: true }
    }
  }
})