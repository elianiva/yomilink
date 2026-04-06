# Yomilink

Japanese learning path platform. Stack: TanStack Start + Effect-TS + Cloudflare. Tooling: Vite+ (`vp` CLI).

## Commands

```bash
vp dev              # Dev server
vp check            # Format + lint + typecheck
vp test             # Run all tests
vp test --watch     # Watch mode
vp build            # Production build
vp run deploy       # Deploy to Cloudflare
```

## Code Style

- **Format**: oxfmt, tabs, width 4
- **Imports**: `import type * as React from "react"`, type-only imports use `import type`
- **Paths**: `@/*` aliases
- **Naming**: PascalCase components (use `cn()` for Tailwind), camelCase hooks/utils, PascalCase + `Error` for Effect errors

## Patterns

**Effect Service:**

```typescript
export class UserNotFoundError extends Data.TaggedError("UserNotFoundError")<{ userId: string }> {}

export const getUser = Effect.fn("getUser")((userId: string) =>
	Effect.gen(function* () {
		const db = yield* Database;
		if (!user) return yield* new UserNotFoundError({ userId });
		return user;
	}),
);
```

**RPC Handler:**

```typescript
export const getUserRpc = createServerFn()
	.middleware([authMiddleware])
	.inputValidator((raw) => Schema.decodeUnknownSync(UserIdInput)(raw))
	.handler(({ data }) =>
		Effect.gen(function* () {
			const result = yield* getUser(data.userId);
			return yield* Rpc.ok(result);
		}).pipe(
			Effect.catchTags({ UserNotFoundError: () => Rpc.notFound("User") }),
			Effect.provide(AppLayer),
			Effect.runPromise,
		),
	);
```

**React Query:**

```typescript
export const UserRpc = {
	getUser: (userId: string) =>
		queryOptions({
			queryKey: ["users", userId],
			queryFn: () => getUserRpc({ data: { userId } }),
		}),
};

// Usage: const { data, rpcError } = useRpcQuery(UserRpc.getUser(id));
```

**Tests:**

```typescript
// UI (.test.tsx): import { render, screen } from "@testing-library/react";
// Service (.test.ts): import { describe, it } from "@effect/vitest";
```

## Architecture

```
src/
├── features/{feature}/     # Feature modules: components/, hooks/, lib/
├── server/
│   ├── rpc/                # createServerFn handlers
│   ├── db/                 # Drizzle schema
│   └── app-layer.ts        # Effect Layer composition
├── hooks/                  # Global React hooks
├── lib/                    # Shared utilities
├── components/             # Shared UI (shadcn)
└── routes/                 # TanStack Router
```

## Stack

- **Effect**: See `effect-solutions list` for guides, `~/.local/share/effect-solutions/effect` for source
- **DB**: LibSQL + Drizzle
- **UI**: Tailwind v4 + shadcn/ui
- **Vite+**: See `vp help` for all commands. Never use pnpm/npm directly, never install Vitest/Oxlint directly, always import from `vite-plus`
