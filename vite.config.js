/// <reference types="vitest" />
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
    testTimeout: 15000,
    env: {
      VITE_DEMO_MODE: '',
      VITE_SUPABASE_URL: '',
      VITE_SUPABASE_ANON_KEY: ''
    }
  }
})
