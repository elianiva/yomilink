import { defineConfig, type PluginOption } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { cloudflare } from '@cloudflare/vite-plugin'
import { nitro } from 'nitro/vite'
import { sentryTanstackStart } from "@sentry/tanstackstart-react";

// Determine build target from environment
const buildTarget = process.env.BUILD_TARGET || 'cloudflare'
const isBun = buildTarget === 'bun'

export default defineConfig({
  resolve: {
    conditions: ['development', 'module', 'browser', 'default'],
    alias: {
      "@": new URL("./src/", import.meta.url).pathname,
    },
  },
  plugins: [
    // Use Nitro for Bun container, Cloudflare for edge deployment
    // Note: using 'node-server' preset as 'bun' preset has issues with static assets
    // See: https://github.com/TanStack/router/issues/3475
    isBun 
      ? nitro({ preset: 'node-server' })
      : cloudflare({ viteEnvironment: { name: 'ssr' } }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
    // Disable Sentry in Bun container builds or when no auth token
    ...(process.env.SENTRY_AUTH_TOKEN ? [sentryTanstackStart({
      org: "elianiva",
      project: "yomilink",
      authToken: process.env.SENTRY_AUTH_TOKEN,
    })] : []),
  ] as PluginOption[],
})
