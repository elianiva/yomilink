here’s the **migration plan rewritten as a developer-friendly TODO list**, ready for handoff to GPT-5 or Cursor.

---

# ✅ TODO — migrate from `convex-auth` → `better-auth` (with Convex)

---

## 🔹 Phase 0 — prep & audit

* [x] Freeze current convex functions (`convex/functions/**`) and schema.
* [x] Identify every `convex-auth` usage:

  * [x] Auth hooks (`useAuth`, `ensureAuthData`, etc.)
  * [x] Convex queries using `ctx.auth`
  * [x] Route guards / loaders
  * [x] Session handling or cookies
* [x] Export sample `users` docs to map old → new fields. (skipped: legacy data removed)
* [x] Note what’s stored: `email`, `name`, `image`, `provider_id`, `roles`.

---

## 🔹 Phase 1 — install dependencies

* [x] `pnpm remove convex-auth`
* [x] `pnpm add better-auth @convex-dev/better-auth`
* [ ] (optional) install providers you need (e.g. `better-auth-google`)

---

## 🔹 Phase 2 — set up Better Auth (server)

* [x] Create `/auth/server.ts` (or `/server/auth.ts`). (implemented as convex/auth.ts)
* [x] Initialise Better Auth instance with Convex adapter:

  ```ts
  import { createBetterAuth } from "better-auth";
  import { convex } from "@convex-dev/better-auth";

  export const api = createBetterAuth({
    database: convex(),
    baseUrl: import.meta.env.VITE_APP_URL,
  });
  ```
* [x] Export `api` for server-side session reads. (implemented via getServerSession() using Convex query)
* [x] Ensure `.env` has:

  ```
  VITE_APP_URL=https://yourdomain.com
  VITE_BETTER_AUTH_SECRET=...
  ```
* [ ] (optional) add providers config (GitHub, Google, etc.)

---

## 🔹 Phase 3 — integrate Convex backend

* [x] Install Better Auth Convex component:

  ```bash
  npx convex components add @convex-dev/better-auth
  ```
* [x] Add `getSession()` helper in Convex:

  ```ts
  import { getSession } from "@convex-dev/better-auth/convex";

  export const protectedQuery = query({
    args: {},
    handler: async (ctx) => {
      const session = await getSession(ctx);
      if (!session?.user) throw new Error("Unauthorized");
      return session.user;
    },
  });
  ```
* [x] Update Convex schema to include `users` if not generated.
* [ ] Manually verify session resolution via /debug/session (see convex/session.ts).

---

## 🔹 Phase 4 — migrate user data

* [x] Create a one-off Convex migration script: (skipped: legacy data removed)

  * [x] Read users from old `convex-auth` table. (skipped)
  * [x] Upsert into Better Auth’s user table. (skipped)
  * [x] Copy safe fields (`email`, `name`, `image`). (skipped)
* [x] If password hashes differ → flag users for reset. (skipped)
* [x] Keep old table read-only for rollback. (skipped)

---

## 🔹 Phase 5 — integrate with TanStack Start (frontend)

* [x] Remove old `convex-auth` hooks/imports.
* [x] Create new helpers:

  **`src/auth/session.ts`**

  ```ts
  import { api } from "@/auth/server";

  export async function getServerSession(request: Request) {
    return api.sessions.get({ request });
  }
  ```

  **`src/hooks/useAuth.ts`**

  ```ts
  import { useQuery } from "@tanstack/react-query";

  export function useAuth() {
    const { data } = useQuery({ queryKey: ["session"] });
    return { user: data?.user ?? null, isAuthenticated: Boolean(data?.user) };
  }
  ```

  **route loader example**

  ```ts
  export const Route = createFileRoute("/dashboard")({
    loader: async (ctx) => {
      const session = await getServerSession(ctx.request);
      if (!session) throw redirect({ to: "/login" });
      await ctx.context.queryClient.ensureQueryData(["session"], () => session);
      return null;
    },
    component: DashboardPage,
  });
  ```

---

## 🔹 Phase 6 — replace convex-auth references

* [x] Replace all `ctx.auth.userId` with:

  ```ts
  const session = await getSession(ctx);
  const userId = session?.user.id;
  ```
* [x] Replace client calls:

  * [x] `signIn`, `signOut`, `signUp` → Better Auth endpoints.
  * [x] Update login page to use new API routes.
* [x] Remove `convex-auth` middleware or wrappers.

---

## 🔹 Phase 7 — validate session flow

* [ ] Confirm browser cookie (`better-auth.session`) is set.
* [ ] Verify server loaders detect session on first load (SSR).
* [ ] Check Convex queries see the same user ID.
* [ ] Test both email/password and OAuth.

---

## 🔹 Phase 8 — route protection & loaders

* [x] Add route guards:

  * [x] `/login` redirects to `/dashboard` if already authed.
  * [x] Private routes redirect to `/login` if not authed.
* [x] Ensure `ensureAuthData` replaced with loader prefetch using Better Auth.

---

## 🔹 Phase 9 — test + deploy

* [ ] Test user creation → session persistence → logout → re-login.
* [ ] Test social providers (if used).
* [ ] Test Convex query access control.
* [x] Stage rollout: (skipped per instruction)

  * [x] Enable Better Auth for new users only.
  * [x] Keep old auth as backup flag for 48h.
* [ ] Once stable, delete all `convex-auth` code.

---

## 🔹 Phase 10 — observability & cleanup

* [ ] Add Sentry instrumentation:

  * [ ] Catch auth errors, upload issues.
* [ ] Remove legacy `auth/convex-auth.ts` files.
* [x] Update README and `.env.example`.
* [x] Commit migration script for reproducibility. (skipped)

---

## 🔹 Optional — feature parity checks

* [ ] Re-enable providers (Google, GitHub, etc.)
* [ ] Add roles/claims logic if needed.
* [ ] Add email verification or passkey plugin later.

---

## ⚠️ Common pitfalls

* [ ] Missing `VITE_APP_URL` → “baseURL undefined” error.
* [ ] SSR not passing cookies → session always null.
* [ ] Forgot to update Convex function imports.
* [ ] Mixed session states after hot reload → clear cookies before test.

---

## 📁 File structure guide (scaffold reference)

- convex/convex.config.ts — Registers Better Auth component
- convex/auth.ts — Better Auth server integration (createAuth, authComponent)
- convex/http.ts — Mounts Better Auth HTTP routes
- convex/users.ts — Session-resolved me query
- convex/authzInternal.ts — currentPrincipal internal query
- convex/roles.ts — requireRoleFrom helper and upsertRole internal mutation
- convex/schema.ts — user_roles and goal_maps tables (userId/teacherId as string)
- src/auth/session.ts — getServerSession helper for SSR
- src/auth/fetch-client.ts — SSR-safe fetch wrappers for Convex better-auth
- src/lib/auth-client.ts — Better Auth client (convexClient plugin)
- src/router.tsx — ConvexBetterAuthProvider + React Query integration
- src/routes/login.tsx — Email/password sign in/up
- src/routes/dashboard.tsx — Guarded dashboard route, seeds session
- src/routes/index.tsx — Root redirect based on session
- src/hooks/use-auth.ts — Client auth hook consuming session
- convex/session.ts — Simple session query to validate auth
- src/routes/debug.session.tsx — Route to visualize session and useAuth state
