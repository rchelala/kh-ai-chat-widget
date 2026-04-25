import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/widget.ts'),
      name: 'KHWidget',
      fileName: () => 'widget.js',
      formats: ['iife'],
    },
  },
})
