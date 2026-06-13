import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import netlify from '@netlify/vite-plugin'
import { VitePWA } from 'vite-plugin-pwa'

const isDesktopBuild = process.env.VITE_DESKTOP === '1'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    ...(!isDesktopBuild ? [netlify()] : []),
    ...(!isDesktopBuild
      ? [
          VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['favicon.svg', 'icon-128.png', 'icon-256.png', 'icon-512.png'],
            manifest: {
              name: 'WorkVault',
              short_name: 'WorkVault',
              description: 'All-in-one platform for contract workers',
              theme_color: '#4f46e5',
              background_color: '#0f172a',
              display: 'standalone',
              orientation: 'any',
              start_url: '/',
              icons: [
                {
                  src: '/icon-128.png',
                  sizes: '128x128',
                  type: 'image/png',
                },
                {
                  src: '/icon-256.png',
                  sizes: '256x256',
                  type: 'image/png',
                },
                {
                  src: '/icon-512.png',
                  sizes: '512x512',
                  type: 'image/png',
                  purpose: 'any maskable',
                },
              ],
            },
            workbox: {
              globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
              navigateFallback: '/index.html',
              runtimeCaching: [
                {
                  urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
                  handler: 'CacheFirst',
                  options: {
                    cacheName: 'google-fonts-cache',
                    expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
                  },
                },
                {
                  urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
                  handler: 'CacheFirst',
                  options: {
                    cacheName: 'gstatic-fonts-cache',
                    expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
                  },
                },
              ],
            },
          }),
        ]
      : []),
  ],
  clearScreen: false,
  server: {
    port: 5173,
    strictPort: true,
  },
  envPrefix: ['VITE_', 'TAURI_ENV_'],
})
