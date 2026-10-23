import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: [
        'assets/aistudio/WhatsApp_Image_2026-10-23_at_6.42.57_PM_4871f69a.jpeg',
        'icon.svg',
        'pwa-192x192.png',
        'pwa-512x512.png',
        'pwa-maskable-512x512.png',
        'apple-touch-icon.png',
        'crisiscore_icon.jpg',
        'crisiscore_hero_banner.jpg',
        'sql-wasm.wasm'
      ],
      manifest: {
        id: '/',
        name: 'CrisisCore AI - Emergency Response System',
        short_name: 'CrisisCore',
        description: 'AI-Powered Emergency Resource Allocation & Disaster Response System with Offline Navigation',
        theme_color: '#070E18',
        background_color: '#070E18',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        orientation: 'portrait-primary',
        categories: ['government', 'utilities', 'medical', 'navigation'],
        icons: [
          {
            src: '/assets/aistudio/WhatsApp_Image_2026-10-23_at_6.42.57_PM_4871f69a.jpeg',
            sizes: '512x512',
            type: 'image/jpeg',
            purpose: 'any'
          },
          {
            src: '/assets/aistudio/WhatsApp_Image_2026-10-23_at_6.42.57_PM_4871f69a.jpeg',
            sizes: '512x512',
            type: 'image/jpeg',
            purpose: 'maskable'
          },
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          }
        ]
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg,webp,woff,woff2,wasm}'],
        navigateFallbackDenylist: [/^\/sql-wasm\.wasm$/, /\.wasm$/],
        runtimeCaching: [
          {
            // Emergency resources and critical route data caching
            urlPattern: /\/api\/(resources|routes|incidents|emergency-data).*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'emergency-resource-data-cache-v1',
              networkTimeoutSeconds: 3,
              cacheableResponse: {
                statuses: [0, 200]
              },
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
              }
            }
          },
          {
            // Google Maps Platform JavaScript SDK & modules
            urlPattern: /^https:\/\/maps\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-maps-api-cache-v1',
              cacheableResponse: {
                statuses: [0, 200]
              },
              expiration: {
                maxEntries: 80,
                maxAgeSeconds: 60 * 60 * 24 * 14 // 14 days
              }
            }
          },
          {
            // Google Maps static tiles and geometry
            urlPattern: /^https:\/\/maps\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-maps-static-cache-v1',
              cacheableResponse: {
                statuses: [0, 200]
              },
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          },
          {
            // Web Fonts & Google Fonts
            urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'web-fonts-cache-v1',
              cacheableResponse: {
                statuses: [0, 200]
              },
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: true,
        type: 'module'
      }
    })
  ],
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true,
    allowedHosts: true
  },
  preview: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true,
    allowedHosts: true
  }
});
