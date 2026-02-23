import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { cloudflare } from '@cloudflare/vite-plugin'
import { sentryTanstackStart } from "@sentry/tanstackstart-react";

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
    sentryTanstackStart({
      org: "elianiva",
      project: "yomilink",
      authToken: process.env.SENTRY_AUTH_TOKEN,
    }),
  ],
})
