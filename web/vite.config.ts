import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const mdsDir = path.join(__dirname, '..', 'mds')

// Custom plugin to serve mds directory in dev and copy to dist in build
const mdsPlugin = () => ({
  name: 'mds-assets',
  configureServer(server) {
    // Add middleware at the beginning to intercept /mds requests
    server.middlewares.use('/mds', (req, res, next) => {
      try {
        // Decode URL to handle Chinese characters
        const decodedUrl = decodeURIComponent(req.url || '')
        const filePath = path.join(mdsDir, decodedUrl)
        console.log('[MDS Middleware] Request:', req.url, '->', filePath)
        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
          const ext = path.extname(filePath)
          const contentType: Record<string, string> = {
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.gif': 'image/gif',
            '.svg': 'image/svg+xml'
          }
          res.setHeader('Content-Type', contentType[ext] || 'application/octet-stream')
          fs.createReadStream(filePath).pipe(res)
        } else {
          console.log('[MDS Middleware] File not found:', filePath)
          next()
        }
      } catch (e) {
        console.error('[MDS Middleware] Error:', e)
        next()
      }
    })
  },
  closeBundle() {
    // Copy mds images to dist folder after build
    const distDir = path.join(__dirname, 'dist', 'mds')
    if (!fs.existsSync(distDir)) {
      fs.mkdirSync(distDir, { recursive: true })
    }

    // Copy only img directories from mds
    const categories = fs.readdirSync(mdsDir)
    for (const cat of categories) {
      const catPath = path.join(mdsDir, cat)
      if (fs.statSync(catPath).isDirectory()) {
        const imgPath = path.join(catPath, 'img')
        if (fs.existsSync(imgPath)) {
          const destPath = path.join(distDir, cat, 'img')
          fs.mkdirSync(destPath, { recursive: true })
          copyDir(imgPath, destPath)
        }
      }
    }
    console.log('Copied mds images to dist/mds')
  }
})

function copyDir(src: string, dest: string) {
  const entries = fs.readdirSync(src, { withFileTypes: true })
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)
    if (entry.isDirectory()) {
      fs.mkdirSync(destPath, { recursive: true })
      copyDir(srcPath, destPath)
    } else {
      fs.copyFileSync(srcPath, destPath)
    }
  }
}

export default defineConfig({
  plugins: [
    react(),
    mdsPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'generateSW',
      manifest: false, // 使用 public/manifest.json
      workbox: {
        globPatterns: ['**/*.{js,css,html,json,woff2,svg,ico,png,jpg,jpeg}'],
        // 缓存策略
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 }
            }
          },
          {
            // 静态资源 - 缓存优先
            urlPattern: /\.(?:png|jpg|jpeg|gif|svg|ico|webp)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 }
            }
          },
          {
            // 页面导航 - 网络优先，离线回退
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'pages-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 7 },
              networkTimeoutSeconds: 3
            }
          }
        ],
        // 离线回退页面
        navigateFallback: '/offline.html',
        navigateFallbackDenylist: [/^\/.{3}/], // 排除 API 路径等
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true
      },
      devOptions: {
        enabled: false // 开发环境不启用
      }
    })
  ],
  resolve: { alias: { '@': '/src' } },
  server: {
    fs: {
      allow: [__dirname, mdsDir]
    }
  },
  publicDir: 'public'
})
