import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Local XAMPP: /site/  |  Railway Docker build: VITE_BASE=/
const base = process.env.VITE_BASE ?? '/site/'

export default defineConfig({
  base: base.endsWith('/') ? base : `${base}/`,
  plugins: [react(), tailwindcss()],
})
