import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// Vite 설정 - Global Earth 날씨 PWA 앱
export default defineConfig({
  // Cloudflare Pages는 루트 배포이므로 base: '/'
  base: '/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/*.png'],
      manifest: {
        name: 'Global Earth - 전지구 날씨',
        short_name: 'Global Earth',
        description: '전지구 3D 날씨 시각화 앱 - 위성 이미지, 레이더, 실시간 날씨 예보',
        start_url: '/',
        display: 'standalone',
        background_color: '#0f172a',
        theme_color: '#3b82f6',
        orientation: 'any',
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        // 정적 에셋은 캐시 우선
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // 런타임 캐싱 규칙
        runtimeCaching: [
          // 날씨 API: 네트워크 우선, 오프라인 시 캐시
          {
            urlPattern: /^https:\/\/api\.open-meteo\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'weather-api-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 10 }, // 10분
            },
          },
          // 지오코딩 API: 캐시 우선 (자주 변경 없음)
          {
            urlPattern: /^https:\/\/geocoding-api\.open-meteo\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'geocoding-cache',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 }, // 24시간
            },
          },
          // 지도 타일: Stale-While-Revalidate
          {
            urlPattern: /^https:\/\/.*basemaps\.cartocdn\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'map-tiles-cache',
              expiration: { maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 7 }, // 7일
            },
          },
          // NASA 위성 타일: 캐시 우선 (하루에 한번 업데이트)
          {
            urlPattern: /^https:\/\/gibs\.earthdata\.nasa\.gov\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'satellite-tiles-cache',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 }, // 24시간
            },
          },
          // 레이더 타일: 네트워크 우선 (자주 갱신)
          {
            urlPattern: /^https:\/\/tilecache\.rainviewer\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'radar-tiles-cache',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 10 }, // 10분
            },
          },
        ],
      },
    }),
  ],
})
