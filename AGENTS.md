# Agent Guidelines for Yomilink

## Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production  
- `npm run test` - Run all tests with vitest
- `npm run test <filename>` - Run single test file (e.g., `npm run test saveDialog.test.tsx`)
- `npm run lint` - Run biome linter with auto-fix
- `npm run format` - Format code with biome
- `npm run check` - Run all biome checks (lint + format)

## Code Style
- Use Biome for formatting/linting (tab indentation, double quotes)
- Import React types: `import type * as React from "react"`
- Use `@/*` path aliases for imports from src
- Use `cn()` utility for conditional Tailwind classes
- Follow shadcn/ui component patterns with cva for variants
- Server functions: wrap with Sentry.startSpan for instrumentation
- TypeScript strict mode enabled - ensure proper typing
- Use class-variance-authority for component variants
- Prefer Radix UI primitives for accessible components