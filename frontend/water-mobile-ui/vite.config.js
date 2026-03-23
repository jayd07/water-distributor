import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Water App',
        short_name: 'WaterApp',
        theme_color: '#2196f3'
      }
    })
  ],
  server: {
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8099',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})
