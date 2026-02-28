# Agent Guidelines for Yomilink

Yomilink is a personalized Japanese learning path platform built with TanStack Start, Effect-TS, and Cloudflare.

## Commands

- `bun run dev` - Start development server
- `bun run build` - Build for production
- `bun run test` - Run all tests (UI + service)
- `bun run test:ui` - Run UI tests only (React components)
- `bun run test:service` - Run service tests only (Effect/utility functions)
- `bun run test:watch` - Run UI tests in watch mode
- `bun run coverage` - Run tests with coverage
- `bun run coverage:ui` - Run tests with interactive coverage UI
- `bun run lint` - Run linter with auto-fix
- `bun run format` - Format code
- `bun run typecheck` - Run TypeScript type checking
- `bun ui add` - Add component from shadcn ui (one at a time)

## Code Style

### Formatting
- Auto-format using oxfmt
- Import organization handled by oxfmt

### Imports
- Import React types: `import type * as React from "react"`
- Use `@/*` path aliases for imports from src
- Use `import type` for type-only imports

### React Components
- Use `cn()` utility for conditional Tailwind classes
- Follow shadcn/ui patterns with cva for variants
- Prefer Radix UI primitives for accessibility
- Use `Slot` from Radix for polymorphic components

### TypeScript
- Strict mode enabled - ensure proper typing
- No unused locals or parameters
- Use `Effect.gen` for Effect-based functions
- Define schemas with `Schema.Struct` for validation

### Naming Conventions
- Components: PascalCase (e.g., `Button.tsx`)
- Utilities/hooks: camelCase (e.g., `useRpcQuery.ts`)
- Effect services: camelCase with descriptive names (e.g., `updateProfile`)
- Errors: PascalCase ending with `Error` (e.g., `UserNotFoundError`)

## Effect Best Practices

**Before implementing Effect features**, run `effect-solutions list` and read the relevant guide.

**Effect Source Reference:** `~/.local/share/effect-solutions/effect`
Search here for real implementations when docs aren't enough.

### Service Implementation
- Use `Effect.fn("name")` for named functions
- Access services via `yield* ServiceName` pattern
- Define errors as `Data.TaggedError("ErrorName")`
- Use `Schema.Struct` for input validation

### Server RPC Functions
- Wrap server functions with `Effect.withSpan` for tracing
- Use `Effect.tapError(logRpcError("functionName"))` for error logging
- Catch specific errors with `Effect.catchTags`
- Provide `AppLayer` at the end of the pipeline
- Always end with `Effect.runPromise`

```typescript
export const myFunction = createServerFn()
  .middleware([authMiddleware])
  .inputValidator((raw) => Schema.decodeUnknownSync(InputSchema)(raw))
  .handler(({ data, context }) =>
    serviceFunction(context.user.id, data).pipe(
      Effect.withSpan("serviceFunction"),
      Effect.tapError(logRpcError("myFunction")),
      Effect.catchTags({
        SpecificError: (e) => errorResponse(e.message),
      }),
      Effect.catchAll(() => errorResponse("Internal server error")),
      Effect.provide(AppLayer),
      Effect.runPromise,
    ),
  );
```

### Layers
- Use `AppLayer` from `@/server/app-layer` for production
- Use `AppLayerTest` for tests (in-memory database)
- Never manually merge layers with `Layer.mergeAll`

## Architecture

### Feature Structure
Features are organized under `src/features/{feature-name}/`:
- `components/` - Feature-specific React components
- `hooks/` - Feature-specific React hooks
- `lib/` - Effect services, schemas, and utilities

### Server Structure
- `server/rpc/` - Server functions using `createServerFn`
- `server/db/` - Database client and schema
- `server/app-layer.ts` - Centralized Effect layer

### React Query Patterns
- Define RPC objects with query/mutation options:
```typescript
export const FeatureRpc = {
  queryKey: () => ["key"],
  query: () => queryOptions({ queryKey: FeatureRpc.queryKey(), queryFn: () => fn() }),
  mutation: () => mutationOptions({ mutationKey: FeatureRpc.queryKey(), mutationFn: fn }),
};
```

## Testing

### Test Configuration
- UI tests: `vitest.ui.config.ts` - jsdom environment, React components
- Service tests: `vitest.service.config.ts` - jsdom environment, Effect functions
- Setup files: `src/__tests__/setup/ui.ts` and `src/__tests__/setup/index.ts`

### Writing Tests
- UI tests: Use React Testing Library, place alongside components as `.test.tsx`
- Service tests: Use `@effect/vitest`, place alongside services as `.test.ts`
- Mock Cloudflare workers via `cloudflare:workers` alias
