import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import viteTsConfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'
import { cloudflare } from '@cloudflare/vite-plugin'

export default defineConfig(({ mode }) => {
  const isTest = mode === 'test' || process.env.VITEST;
  return {
    plugins: [
      // Disable Cloudflare plugin during tests to avoid incompatible options
      !isTest && cloudflare({ viteEnvironment: { name: 'ssr' } }),
      viteTsConfigPaths({ projects: ['./tsconfig.json'] }),
      tailwindcss(),
      tanstackStart(),
      viteReact(),
    ].filter(Boolean) as any,
  }
})
