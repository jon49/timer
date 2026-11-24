import { defineConfig } from 'vite'
import solid from '@solidjs/vite-plugin'
import { compression } from 'vite-plugin-compression2'

export default defineConfig({
  publicDir: '../../static',
  plugins: [
    solid(),
    compression()
  ]
})
