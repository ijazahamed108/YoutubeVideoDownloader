import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// BASE_PATH lets the same build serve from GitHub Pages ("/YoutubeVideoDownloader/")
// or from the Express server in Docker ("/").
export default defineConfig({
  plugins: [react()],
  base: process.env.BASE_PATH || '/YoutubeVideoDownloader/',
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  },
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          icons: ['lucide-react']
        }
      }
    }
  }
})
