import { defineConfig } from 'vite'
import { compression } from 'vite-plugin-compression2'

export default defineConfig({
  publicDir: '../../static',
  server: {
    // @jon49/web is linked from a sibling checkout (file:../../../jon49-web).
    fs: { allow: ['../..', '../../../jon49-web'] },
  },
  plugins: [
    compression()
  ]
})
