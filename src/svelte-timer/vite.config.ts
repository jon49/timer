import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { compression } from 'vite-plugin-compression2'

export default defineConfig({
  publicDir: '../../static',
  plugins: [
    svelte(),
    compression()
  ]
})
