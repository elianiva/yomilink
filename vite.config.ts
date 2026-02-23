import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { cloudflare } from '@cloudflare/vite-plugin'

export default defineConfig({
  resolve: {
    conditions: ['development', 'module', 'browser', 'default'],
    alias: {
      "@": new URL("./src/", import.meta.url).pathname,
    },
  },
  plugins: [
    // Disable Cloudflare plugin during tests to avoid incompatible options
    cloudflare({ viteEnvironment: { name: 'ssr' } }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ],
})
