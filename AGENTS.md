# Agent Guidelines for Yomilink

Yomilink is a personalized Japanese learning path platform built with **TanStack Start**, **Effect-TS**, and **Cloudflare**. Package manager: **bun**.

## Commands

```bash
# Development
bun run dev              # Start dev server
bun run typecheck        # Check TypeScript
bun run lint             # Lint with auto-fix (oxlint)
bun run format           # Format code (oxfmt)

# Testing
bun run test             # Run all tests (UI + service)
bun run test:ui          # UI tests only (.test.tsx)
bun run test:service     # Service tests only (.test.ts)
bun run test:watch       # Watch mode for UI tests

# Single test file
bun run test:ui -- src/components/Button.test.tsx
bun run test:service -- src/features/topic/lib/topic-service.test.ts

# Production
bun run build            # Build for production
bun run deploy           # Deploy to Cloudflare
```

## Code Style

| Category | Rule |
|----------|------|
| **Formatting** | oxfmt with tabs, width 4. Import sort handled automatically. |
| **React imports** | `import type * as React from "react"` |
| **Type imports** | Always use `import type` for type-only imports |
| **Path aliases** | Use `@/*` for imports from src |
| **Components** | PascalCase files, use `cn()` for Tailwind classes |
| **Hooks/Utils** | camelCase with descriptive names |
| **Effect errors** | PascalCase ending with `Error` (e.g., `UserNotFoundError`) |

## Effect-TS Patterns

**Before implementing Effect features**, run `effect-solutions list` and read the relevant guide.

**Service Implementation:**
```typescript
// Define errors
export class UserNotFoundError extends Data.TaggedError("UserNotFoundError")<{
  readonly userId: string;
}> {}

// Implement service
export const getUser = Effect.fn("getUser")((userId: string) =>
  Effect.gen(function* () {
    const db = yield* Database;
    // ... logic
    if (!user) return yield* new UserNotFoundError({ userId });
    return user;
  })
);
```

**Server RPC Handler:**
```typescript
export const getUserRpc = createServerFn()
  .middleware([authMiddleware])
  .inputValidator((raw) => Schema.decodeUnknownSync(UserIdInput)(raw))
  .handler(({ data }) =>
    Effect.gen(function* () {
      const result = yield* getUser(data.userId);
      return yield* Rpc.ok(result);
    }).pipe(
      Effect.withSpan("getUser"),
      Effect.tapError(logRpcError("getUserRpc")),
      Effect.catchTags({
        UserNotFoundError: () => Rpc.notFound("User"),
      }),
      Effect.catchAll(() => Rpc.err("Internal server error")),
      Effect.provide(AppLayer),
      Effect.runPromise,
    ),
  );
```

## React Query + RPC

**Define RPC objects with typed options:**
```typescript
export const UserRpc = {
  users: () => ["users"],
  getUser: (userId: string) =>
    queryOptions({
      queryKey: [...UserRpc.users(), userId],
      queryFn: () => getUserRpc({ data: { userId } }),
    }),
  updateUser: () =>
    mutationOptions({
      mutationKey: UserRpc.users(),
      mutationFn: (data: UpdateUserInput) => updateUserRpc({ data }),
    }),
};
```

**Use in components:**
```typescript
const { data, rpcError, isLoading } = useRpcQuery(UserRpc.getUser(id));
// data is T | undefined, rpcError is string | undefined
```

## Testing Patterns

**UI Tests** (`.test.tsx`) - React Testing Library:
```typescript
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";

describe("Button", () => {
  it("renders correctly", () => {
    render(<Button>Click</Button>);
    expect(screen.getByText("Click")).toBeInTheDocument();
  });
});
```

**Service Tests** (`.test.ts`) - Effect/Vitest:
```typescript
import { describe, it } from "@effect/vitest";
import { Effect } from "effect";

describe("service", () => {
  it.effect("should work", () =>
    Effect.gen(function* () {
      // test with real Effect context
    }).pipe(Effect.provide(AppLayerTest))
  );
});
```

## Architecture

```
src/
├── features/{feature}/     # Feature-based modules
│   ├── components/         # React components
│   ├── hooks/              # Feature hooks
│   └── lib/                # Effect services & schemas
├── server/
│   ├── rpc/                # createServerFn handlers
│   ├── db/                 # Database schema & client
│   └── app-layer.ts        # Effect Layer composition
├── hooks/                  # Global React hooks
├── lib/                    # Shared utilities
├── components/             # Shared UI components
└── routes/                 # TanStack Router routes
```

## Resources

- **Effect Source**: `~/.local/share/effect-solutions/effect` - Real implementations when docs aren't enough
- **Effect Solutions**: Run `effect-solutions list` for guides
- **Database**: LibSQL with Drizzle ORM
- **Styling**: Tailwind v4 + shadcn/ui components
