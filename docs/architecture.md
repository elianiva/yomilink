# Architecture

## Stack

| Layer            | Technology                                                        |
| ---------------- | ----------------------------------------------------------------- |
| **Framework**    | TanStack Start (React + SSR + RPC)                                |
| **Routing**      | TanStack Router (file-based, SPA)                                 |
| **State**        | TanStack React Query + React Form                                 |
| **Backend**      | Effect-TS (functional effects, schema validation, error handling) |
| **Database**     | LibSQL (Turso) via Drizzle ORM                                    |
| **Auth**         | Better Auth (email/password)                                      |
| **Concept Maps** | React Flow (interactive node-edge graph)                          |
| **Styling**      | Tailwind CSS v4 + shadcn/ui                                       |
| **Deployment**   | Cloudflare Workers                                                |

## Project Structure

```
src/
├── components/          # Shared UI components (shadcn + custom)
│   └── ui/             # Inputs, buttons, cards, dialogs, etc.
├── features/            # Feature modules
│   ├── auth/           # Login, signup, guards, form steps
│   ├── analyzer/       # Analytics canvas, controls, sidebar
│   ├── assignment/     # Assignment CRUD, details, lists
│   ├── form/           # Form builder, taker, results, question editor
│   ├── form-builder/   # Form creation/editing page
│   ├── goal-map/       # Goal map editor, hooks
│   ├── kit/            # Concept map canvas, nodes, edges
│   ├── learner-map/    # Learner map builder, diagnosis, result
│   ├── user/           # User table, detail sheet
│   └── whitelist/      # Whitelist CRUD
├── hooks/               # Global React hooks
│   └── use-rpc-query.ts # useRpcQuery / useRpcMutation wrappers
├── lib/                  # Shared utilities
│   ├── auth-client.ts   # Better Auth client
│   ├── utils.ts         # parseJson, safeParseJson, cn, randomString
│   └── validation-schemas.ts  # Password, NonEmpty, etc.
├── middlewares/          # Auth middlewares
│   └── auth.ts          # requireRoleMiddleware, authMiddleware
├── routes/               # TanStack Router file-based routes
│   ├── __root.tsx       # Root layout, meta, styles
│   ├── index.tsx        # Home redirect → /login
│   ├── login.tsx        # Login page
│   └── signup.index.tsx # Multi-step signup
│   ├── dashboard.tsx    # Dashboard layout (sidebar + outlet)
│   ├── dashboard.*.tsx  # Dashboard child routes
│   └── api/             # API routes (health, auth, images)
├── server/               # Server-only code
│   ├── db/              # Drizzle schema, client
│   ├── rpc-helper.ts    # Rpc.ok, Rpc.err, logAndReturnError
│   └── rpc/             # Server functions
│       ├── auth.ts      # signUpRpc, listCohortsRpc
│       ├── form.ts      # createFormRpc, getStudentFormByIdRpc, etc.
│       ├── assignment.ts # createAssignmentRpc, etc.
│       ├── analytics.ts # getAssignmentAnalyticsRpc, etc.
│       └── ...
└── routeTree.gen.ts      # Auto-generated router tree
```

## Key Patterns

### Effect Service

```typescript
export class UserNotFoundError extends Data.TaggedError("UserNotFoundError")<{
	userId: string;
}> {}

export const getUser = Effect.fn("getUser")((userId: string) =>
	Effect.gen(function* () {
		const db = yield* Database;
		if (!user) return yield* new UserNotFoundError({ userId });
		return user;
	}),
);
```

### RPC Handler

```typescript
export const getUserRpc = createServerFn()
	.middleware([authMiddleware])
	.inputValidator((raw) => Schema.decodeUnknownSync(UserIdInput)(raw))
	.handler(({ data }) =>
		AppRuntime.runPromise(
			getUser(data.userId).pipe(
				Effect.map(Rpc.ok),
				Effect.withSpan("getUser"),
				Effect.tapError(logRpcError("getUser")),
				Effect.catchTags({ UserNotFoundError: () => Rpc.notFound("User") }),
				Effect.catchAll(logAndReturnError("getUser")),
				Effect.catchAllDefect(logAndReturnDefect("getUser")),
			),
		),
	);
```

### React Query Wrapper

```typescript
const { data, isLoading, rpcError, refetch } = useRpcQuery(FormRpc.getStudentFormById(formId));
```

## Route Structure

### Public Routes

| Route     | Title              | Auth | Description             |
| --------- | ------------------ | ---- | ----------------------- |
| `/`       | —                  | No   | Redirects to `/login`   |
| `/login`  | Sign In - KitBuild | No   | Login form              |
| `/signup` | Sign Up - KitBuild | No   | Multi-step registration |

### Dashboard Routes (Authenticated)

| Route                                | Title                | Role          | Description          |
| ------------------------------------ | -------------------- | ------------- | -------------------- |
| `/dashboard`                         | Dashboard - KitBuild | teacher/admin | Topics & goal maps   |
| `/dashboard/assignments`             | Dashboard - KitBuild | student       | My Assignments       |
| `/dashboard/profile`                 | Dashboard - KitBuild | any           | Edit profile         |
| `/dashboard/forms/student`           | Dashboard - KitBuild | student       | My Forms             |
| `/dashboard/forms/take`              | Dashboard - KitBuild | student       | Take/view form       |
| `/dashboard/learner-map/{id}`        | Dashboard - KitBuild | student       | Kit-Build editor     |
| `/dashboard/learner-map/{id}/result` | Dashboard - KitBuild | student       | Diagnosis result     |
| `/dashboard/assignments/manage`      | Dashboard - KitBuild | teacher/admin | Assignment CRUD      |
| `/dashboard/forms`                   | Dashboard - KitBuild | teacher/admin | Form management      |
| `/dashboard/forms/builder`           | Dashboard - KitBuild | teacher/admin | Form editor          |
| `/dashboard/forms/{id}/results`      | Dashboard - KitBuild | teacher/admin | Response aggregation |
| `/dashboard/users`                   | Dashboard - KitBuild | teacher/admin | User management      |
| `/dashboard/analytics`               | Dashboard - KitBuild | teacher/admin | Static Analyzer      |
| `/dashboard/goal-map`                | Dashboard - KitBuild | teacher/admin | Goal map list        |
| `/dashboard/goal-map/{id}`           | Dashboard - KitBuild | teacher/admin | Goal map editor      |
