import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/weatherai': {
        target: 'https://api.weather-ai.co',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/weatherai/, ''),
      },
    },
  },
})
