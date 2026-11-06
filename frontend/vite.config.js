
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  preview: {
    allowedHosts: ['meticulous-empathy-production-5357.up.railway.app'],
  },
})
