import { defineConfig } from 'vite'

export default defineConfig({
  base: '/glitcher-app/',
  build: {
    outDir: 'dist',
    target: 'esnext',
    assetsDir: 'assets',
    emptyOutDir: true,
    sourcemap: true
  }
}) 