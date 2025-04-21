import { defineConfig } from 'vite'
import pkg from './package.json'

export default defineConfig({
  base: '/glitcher-app/',
  build: {
    outDir: 'dist',
    target: 'esnext',
    assetsDir: 'assets',
    emptyOutDir: true,
    sourcemap: true
  },
  define: {
    'import.meta.env.VERSION': JSON.stringify(pkg.version)
  }
}) 