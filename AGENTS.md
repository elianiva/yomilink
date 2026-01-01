# Agent Guidelines for Yomilink

## Commands
- `bun run dev` - Start development server
- `bun run build` - Build for production
- `bun run test` - Run all tests with vitest
- `bun run test <filename>` - Run single test file (e.g., `npm run test saveDialog.test.tsx`)
- `bun run test:watch` - Run tests in watch mode
- `bun run test:ui` - Run tests with vitest UI
- `bun run coverage` - Run tests and generate coverage report
- `bun run coverage:ui` - Run tests and open coverage UI
- `bun run lint` - Run biome linter with auto-fix
- `bun run format` - Format code with biome
- `bun run check` - Run all biome checks (lint + format)
- `bun run typecheck` - Run TypeScript type checking
- `bun ui add` - Add component from shadcn ui, can only do one at a time

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

<!-- effect-solutions:start -->
## Effect Best Practices

**Before implementing Effect features**, run `effect-solutions list` and read the relevant guide.

Topics include: services and layers, data modeling, error handling, configuration, testing, HTTP clients, CLIs, observability, and project structure.

**Effect Source Reference:** `~/.local/share/effect-solutions/effect`
Search here for real implementations when docs aren't enough.
<!-- effect-solutions:end -->
