/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type Plugin } from 'vite'

/**
 * WhatsApp y las redes piden `og:image` con URL absoluta. Si el build tiene `VITE_SITE_URL`
 * (en Cloudflare, solo en Production), se le antepone; si no, queda relativa (D-41).
 */
function ogImagenAbsoluta(sitio: string | undefined): Plugin {
  return {
    name: 'og-imagen-absoluta',
    transformIndexHtml(html) {
      const base = sitio?.trim().replace(/\/+$/, '')
      return base ? html.replace('content="/og.jpg"', `content="${base}/og.jpg"`) : html
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss(), ogImagenAbsoluta(loadEnv(mode, process.cwd()).VITE_SITE_URL)],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: false,
  },
}))
