import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import netlify from '@netlify/vite-plugin'

const isDesktopBuild = process.env.VITE_DESKTOP === '1'

export default defineConfig({
  plugins: [react(), tailwindcss(), ...(!isDesktopBuild ? [netlify()] : [])],
  clearScreen: false,
  server: {
    port: 5173,
    strictPort: true,
  },
  envPrefix: ['VITE_', 'TAURI_ENV_'],
})
