import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  publicDir: '../../static',
  build: {
    rollupOptions: {
      input: ['index.html', 'src/main.ts'],
    },
  },
})
