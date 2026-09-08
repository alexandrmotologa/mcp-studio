import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src')
      }
    },
    plugins: [
      react(),
      {
        name: 'html-transform-csp',
        transformIndexHtml(html, ctx) {
          if (ctx.bundle) {
            // Production build: enforce strict script-src without unsafe-inline
            return html.replace("script-src 'self' 'unsafe-inline'", "script-src 'self'")
          }
          return html
        }
      }
    ]
  }
})
