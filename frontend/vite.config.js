import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

// GitHub Pages 서브경로 배포용 base (워크플로에서 BASE_PATH 주입)
const base = process.env.BASE_PATH || '/'

// 폰에서 HTTPS 로 열어 보기 위한 임시 터널 주소 허용 (cloudflared · pinggy · localtunnel)
const tunnelHosts = ['.trycloudflare.com', '.pinggy.link', '.loca.lt']

export default defineConfig({
  base,
  server: { allowedHosts: tunnelHosts },
  preview: { allowedHosts: tunnelHosts },
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['pwa-icon.svg', 'icons/*.png'],
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
        // PNG 아이콘: 안드로이드 설치 · iOS 홈 화면에서 SVG 가 안 보이는 경우 대비
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: 'pwa-icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
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
