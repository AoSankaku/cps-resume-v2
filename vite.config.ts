import { createReadStream, existsSync, readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { parse } from 'yaml'

const yamlData = (): Plugin => ({
  name: 'yaml-data',
  enforce: 'pre',
  transform(source, id) {
    const fileName = id.split('?', 1)[0]
    if (!fileName || !/\.ya?ml$/i.test(fileName)) return null
    const data = parse(source)
    return { code: `export default ${JSON.stringify(data)};`, map: null }
  },
})

const twemojiDirectory = resolve('node_modules/twemoji-assets/assets/svg')
const twemojiFilePattern = /^[0-9a-f-]+\.svg$/

const twemojiAssets = (): Plugin => ({
  name: 'twemoji-assets',
  configureServer(server) {
    server.middlewares.use('/twemoji', (request, response, next) => {
      const fileName = request.url?.split('?', 1)[0]?.replace(/^\//, '')
      if (!fileName || !twemojiFilePattern.test(fileName)) {
        next()
        return
      }
      const filePath = resolve(twemojiDirectory, fileName)
      if (!existsSync(filePath)) {
        next()
        return
      }
      response.setHeader('Content-Type', 'image/svg+xml')
      response.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
      createReadStream(filePath).pipe(response)
    })
  },
  generateBundle() {
    readdirSync(twemojiDirectory).forEach((fileName) => {
      if (!twemojiFilePattern.test(fileName)) return
      this.emitFile({
        type: 'asset',
        fileName: `twemoji/${fileName}`,
        source: readFileSync(resolve(twemojiDirectory, fileName)),
      })
    })
  },
})

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [
    yamlData(),
    twemojiAssets(),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: false,
      includeAssets: [
        'apple-touch-icon.png',
        'favicon.svg',
        'pwa-192x192.png',
        'pwa-512x512.png',
        'pwa-maskable-512x512.png',
        'site.webmanifest',
      ],
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,wasm,webmanifest}'],
        globIgnores: ['twemoji/**/*.svg'],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            urlPattern: /\/twemoji\/[0-9a-f-]+\.svg$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'twemoji-graphics',
              cacheableResponse: {
                statuses: [0, 200],
              },
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\//,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-stylesheets',
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              cacheableResponse: {
                statuses: [0, 200],
              },
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
            },
          },
        ],
      },
    }),
  ],
  server: {
    port: 35173,
    strictPort: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})
