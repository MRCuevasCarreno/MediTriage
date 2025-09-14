import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  css: {
    // PostCSS inline para evitar que Vite escanee package.json/.postcssrc
    postcss: {
      plugins: [tailwindcss(), autoprefixer()],
    },
  },
})
