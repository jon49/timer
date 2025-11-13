import { defineConfig } from 'vite'
import { compression } from 'vite-plugin-compression2'

// https://vite.dev/config/
export default defineConfig({
  publicDir: '../../static',
  build: {
    rollupOptions: {
      input: ['index.html', 'src/main.ts'],
    },
  },
  plugins: [
    compression()
  ]
})
