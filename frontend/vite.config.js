import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

// GitHub Pages 서브경로 배포용 base (워크플로에서 BASE_PATH 주입)
const base = process.env.BASE_PATH || '/'

export default defineConfig({
  base,
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['pwa-icon.svg'],
      manifest: {
        name: '동구 TIME QUEST',
        short_name: 'TIME QUEST',
        description: '대전 동구를 탐험하며 시간 친구를 수집하는 위치 기반 게임',
        theme_color: '#08233F',
        background_color: '#08233F',
        display: 'standalone',
        orientation: 'portrait',
        start_url: base,
        scope: base,
        lang: 'ko',
        categories: ['games', 'travel', 'entertainment'],
        icons: [
          { src: 'pwa-icon.svg', sizes: '192x192', type: 'image/svg+xml', purpose: 'any' },
          { src: 'pwa-icon.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'any' },
          { src: 'pwa-icon.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/[a-c]\.tile\.openstreetmap\.org\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'osm-tiles',
              expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 14 },
            },
          },
        ],
      },
    }),
  ],
})
