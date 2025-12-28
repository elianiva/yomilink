import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import viteTsConfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'
import { cloudflare } from '@cloudflare/vite-plugin'

export default defineConfig(({ mode }) => {
  return {
    plugins: [
      // Disable Cloudflare plugin during tests to avoid incompatible options
      cloudflare({ viteEnvironment: { name: 'ssr' } }),
      viteTsConfigPaths(),
      tailwindcss(),
      tanstackStart(),
      viteReact(),
    ]
  }
})
