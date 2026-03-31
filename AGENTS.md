# Agent Guidelines for Yomilink

Yomilink is a personalized Japanese learning path platform built with **TanStack Start**, **Effect-TS**, and **Cloudflare**. Uses **Vite+** toolchain (`vp` CLI).

## Commands

```bash
# Development
vp dev                    # Start dev server
vp check                  # Format + lint + typecheck (combines all 3)
vp check --type-aware     # Above with type-aware linting (slower, more accurate)

# Testing
vp test                   # Run all tests (UI + service)
vp test -c vitest.ui.config.ts      # UI tests only (.test.tsx)
vp test --watch           # Watch mode for UI tests

# Single test file
vp test -- src/components/Button.test.tsx
vp test -- src/features/topic/lib/topic-service.test.ts

# Production
vp build                  # Build for production
vp run deploy             # Deploy to Cloudflare
```

## Code Style

| Category          | Rule                                                         |
| ----------------- | ------------------------------------------------------------ |
| **Formatting**    | oxfmt with tabs, width 4. Import sort handled automatically. |
| **React imports** | `import type * as React from "react"`                        |
| **Type imports**  | Always use `import type` for type-only imports               |
| **Path aliases**  | Use `@/*` for imports from src                               |
| **Components**    | PascalCase files, use `cn()` for Tailwind classes            |
| **Hooks/Utils**   | camelCase with descriptive names                             |
| **Effect errors** | PascalCase ending with `Error` (e.g., `UserNotFoundError`)   |

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
	}),
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
import { describe, it, expect } from "vite-plus/test";

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
		}).pipe(Effect.provide(AppLayerTest)),
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

<!--VITE PLUS START-->

# Using Vite+, the Unified Toolchain for the Web

This project is using Vite+, a unified toolchain built on top of Vite, Rolldown, Vitest, tsdown, Oxlint, Oxfmt, and Vite Task. Vite+ wraps runtime management, package management, and frontend tooling in a single global CLI called `vp`. Vite+ is distinct from Vite, but it invokes Vite through `vp dev` and `vp build`.

## Vite+ Workflow

`vp` is a global binary that handles the full development lifecycle. Run `vp help` to print a list of commands and `vp <command> --help` for information about a specific command.

### Start

- create - Create a new project from a template
- migrate - Migrate an existing project to Vite+
- config - Configure hooks and agent integration
- staged - Run linters on staged files
- install (`i`) - Install dependencies
- env - Manage Node.js versions

### Develop

- dev - Run the development server
- check - Run format, lint, and TypeScript type checks
- lint - Lint code
- fmt - Format code
- test - Run tests

### Execute

- run - Run monorepo tasks
- exec - Execute a command from local `node_modules/.bin`
- dlx - Execute a package binary without installing it as a dependency
- cache - Manage the task cache

### Build

- build - Build for production
- pack - Build libraries
- preview - Preview production build

### Manage Dependencies

Vite+ automatically detects and wraps the underlying package manager such as pnpm, npm, or Yarn through the `packageManager` field in `package.json` or package manager-specific lockfiles.

- add - Add packages to dependencies
- remove (`rm`, `un`, `uninstall`) - Remove packages from dependencies
- update (`up`) - Update packages to latest versions
- dedupe - Deduplicate dependencies
- outdated - Check for outdated packages
- list (`ls`) - List installed packages
- why (`explain`) - Show why a package is installed
- info (`view`, `show`) - View package information from the registry
- link (`ln`) / unlink - Manage local package links
- pm - Forward a command to the package manager

### Maintain

- upgrade - Update `vp` itself to the latest version

These commands map to their corresponding tools. For example, `vp dev --port 3000` runs Vite's dev server and works the same as Vite. `vp test` runs JavaScript tests through the bundled Vitest. The version of all tools can be checked using `vp --version`. This is useful when researching documentation, features, and bugs.

## Common Pitfalls

- **Using the package manager directly:** Do not use pnpm, npm, or Yarn directly. Vite+ can handle all package manager operations.
- **Always use Vite commands to run tools:** Don't attempt to run `vp vitest` or `vp oxlint`. They do not exist. Use `vp test` and `vp lint` instead.
- **Running scripts:** Vite+ built-in commands (`vp dev`, `vp build`, `vp test`, etc.) always run the Vite+ built-in tool, not any `package.json` script of the same name. To run a custom script that shares a name with a built-in command, use `vp run <script>`. For example, if you have a custom `dev` script that runs multiple services concurrently, run it with `vp run dev`, not `vp dev` (which always starts Vite's dev server).
- **Do not install Vitest, Oxlint, Oxfmt, or tsdown directly:** Vite+ wraps these tools. They must not be installed directly. You cannot upgrade these tools by installing their latest versions. Always use Vite+ commands.
- **Use Vite+ wrappers for one-off binaries:** Use `vp dlx` instead of package-manager-specific `dlx`/`npx` commands.
- **Import JavaScript modules from `vite-plus`:** Instead of importing from `vite` or `vitest`, all modules should be imported from the project's `vite-plus` dependency. For example, `import { defineConfig } from 'vite-plus';` or `import { expect, test, vi } from 'vite-plus/test';`. You must not install `vitest` to import test utilities.
- **Type-Aware Linting:** There is no need to install `oxlint-tsgolint`, `vp lint --type-aware` works out of the box.

## CI Integration

For GitHub Actions, consider using [`voidzero-dev/setup-vp`](https://github.com/voidzero-dev/setup-vp) to replace separate `actions/setup-node`, package-manager setup, cache, and install steps with a single action.

```yaml
- uses: voidzero-dev/setup-vp@v1
  with:
      cache: true
- run: vp check
- run: vp test
```

## Review Checklist for Agents

- [ ] Run `vp install` after pulling remote changes and before getting started.
- [ ] Run `vp check` and `vp test` to validate changes.
  <!--VITE PLUS END-->
