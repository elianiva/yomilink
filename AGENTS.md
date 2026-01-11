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

## Effect Best Practices

**Before implementing Effect features**, run `effect-solutions list` and read the relevant guide.

Topics include: services and layers, data modeling, error handling, configuration, testing, HTTP clients, CLIs, observability, and project structure.

**Effect Source Reference:** `~/.local/share/effect-solutions/effect`
Search here for real implementations when docs aren't enough.

## Issue Tracking

```bash
# Find ready work (no blockers)
bd ready --json

# Find ready work including future deferred issues
bd ready --include-deferred --json

# Create new issue
bd create "Issue title" -t bug|feature|task -p 0-4 -d "Description" --json

# Create issue with due date and defer (GH#820)
bd create "Task" --due=+6h              # Due in 6 hours
bd create "Task" --defer=tomorrow       # Hidden from bd ready until tomorrow
bd create "Task" --due="next monday" --defer=+1h  # Both

# Update issue status
bd update <id> --status in_progress --json

# Update issue with due/defer dates
bd update <id> --due=+2d                # Set due date
bd update <id> --defer=""               # Clear defer (show immediately)

# Link discovered work
bd dep add <discovered-id> <parent-id> --type discovered-from

# Complete work
bd close <id> --reason "Done" --json

# Show dependency tree
bd dep tree <id>

# Get issue details
bd show <id> --json

# Query issues by time-based scheduling (GH#820)
bd list --deferred              # Show issues with defer_until set
bd list --defer-before=tomorrow # Deferred before tomorrow
bd list --defer-after=+1w       # Deferred after one week from now
bd list --due-before=+2d        # Due within 2 days
bd list --due-after="next monday" # Due after next Monday
bd list --overdue               # Due date in past (not closed)
```
