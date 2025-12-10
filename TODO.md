# Turso + Drizzle Migration Plan (Clean Cutover)

This plan replaces Convex with Turso (libSQL) using Drizzle ORM everywhere, keeps Better Auth via its SQL/SQLite adapter on Turso, and removes all Convex code/dependencies. Phases include concrete tasks, file targets, and acceptance criteria.

## Scope & Goals
- [x] Use Drizzle ORM for all DB access and migrations
- [x] Use Turso (`@libsql/client`) as the database (Cloudflare Workers-compatible)
- [x] Keep Better Auth using its SQL/SQLite adapter against Turso
- [x] Remove all Convex code, APIs, and dependencies (clean cutover)

## Prerequisites
- Turso database and auth token
  - [x] Obtain `TURSO_DATABASE_URL`
  - [x] Generate `TURSO_AUTH_TOKEN` (scoped appropriately)
- Cloudflare Workers environment
  - [x] Add `TURSO_DATABASE_URL` (vars) and `TURSO_AUTH_TOKEN` (secret) via Wrangler

## Phase 0 — Inventory (what to replace)
- Convex schema & functions
  - [x] `convex/schema.ts`
  - [x] `convex/*.ts` (auth.ts, http.ts, rbac.ts, goalMaps.ts, users.ts, diagnosis.ts, seed.ts, etc.)
- Client usage
  - [x] Providers & clients in `src/router.tsx`
  - [x] Hooks in `src/hooks/use-auth.ts`
  - [x] Views using `@convex-dev/react-query` in `src/routes/dashboard/**/*.tsx`
  - [x] Sidebar: `src/components/app-sidebar.tsx`
- Seed & tests
  - [x] `scripts/seed.ts`
  - [ ] `tests/**/*.test.ts(x)` (remove Convex mocks, update to RPC)

## Phase 1 — Dependencies & Environment
- Add Drizzle + libSQL
  - [x] `bun add drizzle-orm @libsql/client`
  - [x] `bun add -D drizzle-kit`
- Environment
  - [x] `.env.local`: `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`
  - [x] Cloudflare: `wrangler secret put TURSO_AUTH_TOKEN`
  - [x] Cloudflare: add `TURSO_DATABASE_URL` to `wrangler.json` `vars` or as a secret

## Phase 2 — Drizzle Schema (map from Convex)
Represent JSON blobs as TEXT (serialize/parse in repos). Use TEXT IDs (ULID/UUID). Create indexes to mirror Convex indexes.

- Tables & indexes
  - goal_maps
    - cols: id PK, goal_map_id UNIQUE, teacher_id, title, description, nodes TEXT, edges TEXT, updated_at INTEGER
    - idx: goal_map_id, teacher_id
  - kits
    - cols: id PK, goal_map_id, created_by, nodes TEXT, edges TEXT, constraints TEXT, version INTEGER, created_at INTEGER
    - idx: goal_map_id
  - learner_maps
    - cols: id PK, goal_map_id, kit_id, user_id, nodes TEXT, edges TEXT, status, attempt INTEGER, started_at INTEGER, submitted_at INTEGER, diagnosis_id TEXT
    - idx: (user_id, kit_id), goal_map_id, kit_id
  - diagnoses
    - cols: id PK, goal_map_id, learner_map_id, summary TEXT, per_link TEXT, score REAL, rubric_version TEXT, created_at INTEGER
    - idx: goal_map_id, learner_map_id
  - group_maps
    - cols: id PK, goal_map_id, aggregation TEXT, cohort_id, created_at INTEGER
    - idx: goal_map_id
  - feedback
    - cols: id PK, learner_map_id, goal_map_id, items TEXT, visibility, created_at INTEGER
    - idx: learner_map_id
  - assignments
    - cols: id PK, goal_map_id, kit_id, title, due_at INTEGER, cohort_id, created_by, created_at INTEGER
    - idx: goal_map_id, kit_id
  - events
    - cols: id PK, user_id, event, payload TEXT, created_at INTEGER
    - idx: user_id

- [x] Create `src/server/db/schema.ts` with Drizzle sqlite schema
- [x] Generate initial migration: `drizzle-kit generate`
- [x] Apply migration to Turso: `drizzle-kit migrate`

## Phase 3 — DB Client & Config
- Files
  - [x] `drizzle.config.ts` (dialect sqlite, outDir `drizzle/`, schema file path)
  - [x] `src/server/db/client.ts`: create libSQL client and Drizzle instance
    - Cloudflare Workers: `createClient({ url: env.TURSO_DATABASE_URL, authToken: env.TURSO_AUTH_TOKEN })`

## Phase 4 — Better Auth on Turso (SQL/SQLite adapter)
- Adapter
  - [x] Use Better Auth SQL/SQLite adapter via Drizzle
  - [x] Configure Better Auth to use Drizzle/sqlite adapter on the Turso connection
  - [x] Ensure tables for users, sessions, verification/keys, roles/permissions are created/migrated
- Server wiring
  - [x] Move auth setup from `convex/auth.ts` to `src/server/auth/config.ts`
  - [x] Update `src/routes/api/auth/$.ts` to expose Better Auth HTTP handlers
  - [x] Keep current roles: `student`, `teacher`, `admin` and map RBAC

## Phase 5 — RPC Layer (replace Convex functions)
Use TanStack Start `createServerFn` with Zod `.inputValidator()`.

- Goal/Kit
  - [x] `getGoalMap`, `saveGoalMap` → `src/server/rpc/goalMaps.ts`
  - [x] `listStudentKits`, `getKit`, `generateKit` → `src/server/rpc/kits.ts`
- Auth
  - [x] `getMe` → `src/server/rpc/auth.ts`

## Phase 6 — UI Refactor (TanStack Query + RPC)
- Remove Convex providers/clients
  - [x] `src/router.tsx`: remove `ConvexReactClient`, `ConvexQueryClient`, `ConvexBetterAuthProvider`
- Replace hooks & imports
  - [x] `src/hooks/use-auth.ts`: use RPC `getMe`; no `convexQuery`
  - [x] `src/routes/dashboard/index.tsx`: use `listStudentKits()`
  - [x] `src/routes/dashboard/kit.$kitId.tsx`: use `getKit({ data })`
  - [x] `src/routes/dashboard/goal.$goalMapId.tsx`: use `saveGoalMap({ data })` + `generateKit({ data })`
  - [x] `src/routes/dashboard/profile.tsx`: use `getMe()`
  - [x] `src/components/app-sidebar.tsx`: use `useAuth()`
- Remove dynamic imports
  - [x] Replace all `await import(...)` with static imports

## Phase 7 — Seed & Utilities
- [x] Rewrite `scripts/seed.ts` to use Drizzle + libSQL
- [x] Seed demo goal map and kit (users optional/TBD)

## Phase 8 — Tests & Mocks
- [ ] Remove Convex mocks (e.g., `tests/dashboard.test.tsx`)
- [ ] Update tests to mock RPCs (no REST/Convex)

## Phase 9 — Remove Convex (code & deps)
- [x] Delete `convex/**`
- [x] Remove deps from `package.json`: `@convex-dev/*`, `convex`
- [x] Clean all imports referencing `convex/_generated/api` and `@convex-dev/*`

## Phase 10 — Docs & Deployment
- [x] Update README: local dev, migrations, seed, env vars
- [x] Wrangler: ensure secrets/vars present; no migrations run from Worker
- [ ] CI: run `bun run test` and `bun run check`; run migrations via CI/CD step or manual pre-deploy

## Commands Cheat Sheet
- Deps: `bun add drizzle-orm @libsql/client && bun add -D drizzle-kit`
- Generate: `bunx drizzle-kit generate`
- Migrate: `bunx drizzle-kit migrate`
- Turso secrets (Cloudflare): `wrangler secret put TURSO_AUTH_TOKEN`

## Acceptance Criteria
- [x] App runs without any Convex code or dependencies
- [x] All data ops use Drizzle ORM on Turso
- [x] Better Auth functions with SQL/SQLite adapter on Turso; roles intact
- [x] All affected screens function: authoring, kit, submit, results, analytics, profile, sidebar
- [ ] Tests pass and no Convex mocks remain

## Notes & Risks
- Better Auth adapter
  - Using Drizzle adapter on Turso; custom roles supported
- JSON columns
  - Store as TEXT; ensure consistent serialization/parsing at repository boundary
- Migrations
  - Run outside Workers (CI/CD or local); do not attempt in-request migrations
- Clean cutover
  - No dual-db period; complete all phases on a branch, then deploy
