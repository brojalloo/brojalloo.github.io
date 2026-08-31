import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': new URL('./src', import.meta.url).pathname,
    },
  },
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        // Split by rate of change, not by size. three and its helpers are the
        // bulk of the payload and effectively never move; the site's own code
        // changes every deploy. Separating them means a content edit no longer
        // invalidates 350kB of engine in every returning visitor's cache.
        manualChunks(id: string) {
          if (!id.includes('node_modules')) return
          // Deliberately narrow. A broad `@react-three` match would swallow
          // `@react-three/postprocessing`, which is lazily imported precisely so
          // that lite-tier visitors never download it.
          if (id.includes('postprocessing')) return
          if (/node_modules[\/]three[\/]/.test(id)) return 'three'
          if (id.includes('three-stdlib') || id.includes('troika')) return 'three-helpers'
          if (id.includes('@react-three/fiber') || id.includes('@react-three/drei')) {
            return 'three-helpers'
          }
          if (id.includes('framer-motion') || id.includes('motion-dom')) return 'motion'
        },
      },
    },
  },
})
