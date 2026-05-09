# Code Context

## 1. src/ Directory Structure

```
src/
├── __tests__/                    # Global test setup/helpers
├── components/                   # Shared UI components
│   ├── layout/                   #   Layout wrappers (centered-container)
│   ├── progress/                 #   Progress bar components
│   ├── skeletons/                #   Loading skeletons
│   ├── toolbar/                  #   Toolbar components
│   ├── ui/                       #   shadcn/ui primitives (button, card, dialog, etc.)
│   ├── app-sidebar.tsx           #   Main sidebar navigation
│   ├── nav-main.tsx              #   Main nav items
│   ├── nav-user.tsx              #   User dropdown menu
│   ├── page-header.tsx           #   Page header with title/breadcrumbs
│   ├── error-page.tsx            #   Error display page
│   ├── not-found.tsx / not-found-card.tsx
│   ├── empty-state.tsx           #   Empty state placeholder
│   ├── query-error-boundary.tsx  #   React Query error boundary
│   ├── reading-material-renderer.tsx  # Richer text renderer
│   └── devtools.tsx              #   Dev tools panel
├── config.ts                     # Effect Config for env vars (SENTRY_DSN, SITE_URL, TURSO_DATABASE_URL, etc.)
├── features/                     # Feature modules (domain-driven)
│   ├── analyzer/                 #   Analytics & metrics for assignments
│   │   ├── components/           #     Canvas, controls, sidebar, charts, learner list
│   │   └── lib/                  #     analytics-service (queries/mutations/shared), topic-service, material-image-service
│   ├── assignment/               #   Assignment CRUD and phases
│   │   ├── components/           #     Detail page, create dialog, list, phase badges
│   │   └── lib/                  #     assignment-service (queries/mutations/shared), assignment-phases
│   ├── auth/                     #   Authentication UI (multi-step signup)
│   │   ├── components/           #     Steps: academic, account, consent, personal; Guard, signup-form.context
│   │   └── types.ts              #     Auth-related types
│   ├── form/                     #   Form system (tests, questionnaires)
│   │   ├── components/           #     Form renderer, form taker, question editors, response table, control editor, countdown timer
│   │   └── lib/                  #     form-service (queries/mutations/shared), form-scoring
│   ├── form-builder/             #   Form builder UI (teacher side)
│   │   ├── components/           #     Builder page, dialogs, tabs, question editor
│   │   └── types.ts              #     Form builder types
│   ├── goal-map/                 #   Goal maps (concept maps)
│   │   ├── components/           #     Editor, dialogs, toolbar, card
│   │   └── lib/                  #     goal-map-service, atoms, validator
│   ├── kit/                      #   Kits (goal-map subsets for assignments)
│   │   ├── components/           #     Canvas, nodes, edges, color picker, context menu
│   │   └── lib/                  #     kit-service, floating-edge-utils, layout
│   ├── learner-map/              #   Student submissions (learner-built maps)
│   │   ├── components/           #     Editor, result view, toolbar, material dialog, diagnosis
│   │   └── lib/                  #     learner-map-service, comparator, grid-layout, atoms
│   ├── profile/                  #   User profile
│   │   └── lib/                  #     profile-service
│   ├── user/                     #   User management (admin)
│   │   ├── components/           #     Table, detail sheet, filter bar, bulk cohort, whitelist panel
│   │   └── lib/                  #     user-service (presumed)
│   └── whitelist/                #   Student whitelist (pre-registration)
│       └── lib/                  #     whitelist-service (queries/mutations/shared)
├── hooks/                        # Global React hooks
│   ├── use-graph-change-handlers.ts  # Graph node/edge change handlers
│   ├── use-history.ts            #   Undo/redo history
│   ├── use-mobile.ts             #   Mobile detection
│   ├── use-rpc-error.ts          #   RPC error handling
│   └── use-rpc-query.ts          #   React Query wrapper for RPC
├── lib/                          # Shared utilities
│   ├── auth.ts                   #   better-auth instance + server user retrieval
│   ├── auth-authorization.ts     #   Role-based authorization helpers
│   ├── auth-client.ts            #   Auth client (better-auth browser client)
│   ├── auth-permissions.ts       #   AccessControl (roles, permissions)
│   ├── student-id-auth.ts        #   Student ID auth helper
│   ├── date-utils.ts             #   Date formatting utils
│   ├── db-query-builder.ts       #   Query builder helpers
│   ├── error-toast.ts / error-types.ts / errors.ts  # Error handling
│   ├── react-flow-types.ts       #   React Flow type definitions
│   ├── validation-schemas.ts     #   Zod/Effect validation schemas
│   └── utils.ts / utils.test.ts  #   General utilities (cn(), etc.)
├── middlewares/
│   └── auth.ts                   # TanStack Start middlewares: authMiddleware, authMiddlewareOptional, requireRoleMiddleware
├── router.tsx                    # TanStack Router setup
├── routeTree.gen.ts              # Auto-generated route tree
├── routes/                       # TanStack Router routes
│   ├── __root.tsx                # Root layout (auth check, sidebar, theme)
│   ├── index.tsx                 # Home page
│   ├── login.tsx                 # Login page
│   ├── signup.index.tsx          # Signup page
│   ├── dashboard.tsx             # Dashboard layout (sidebar wrapper)
│   ├── dashboard.index.tsx       # Dashboard home
│   ├── dashboard.analytics.$assignmentId.index.tsx   # Analytics detail
│   ├── dashboard.analytics.$assignmentId.metrics.tsx # Analytics metrics
│   ├── dashboard.analytics.index.tsx                  # Analytics overview
│   ├── dashboard.assignments.index.tsx                # Assignments list
│   ├── dashboard.assignments.manage.$assignmentId.tsx # Manage single assignment
│   ├── dashboard.assignments.manage.index.tsx         # Assignment management
│   ├── dashboard.forms.$formId.results.tsx            # Form results
│   ├── dashboard.forms.$formId.tsx                    # Form detail
│   ├── dashboard.forms.builder.tsx                    # Form builder
│   ├── dashboard.forms.index.tsx                      # Forms list
│   ├── dashboard.forms.student.tsx                    # Student forms view
│   ├── dashboard.forms.take.tsx                       # Take a form
│   ├── dashboard.goal-map.$goalMapId.tsx              # Goal map detail
│   ├── dashboard.goal-map.index.tsx                   # Goal maps list
│   ├── dashboard.learner-map.$assignmentId.index.tsx  # Learner map list
│   ├── dashboard.learner-map.$assignmentId.result.tsx # Learner map result
│   ├── dashboard.profile.tsx                          # Profile page
│   ├── dashboard.users.index.tsx                      # User management
│   └── api/                                           # API routes
│       ├── analytics/                                 #   Analytics API
│       ├── auth/                                      #   Auth API (better-auth)
│       ├── health.ts                                  #   Health check
│       └── materials/                                 #   Materials API
├── server.tsx                    # TanStack Start server entry
├── styles.css                    # Global styles (Tailwind v4)
├── vitest.d.ts                   # Vitest type declarations
└── logo.svg
```

## 2. server/ Directory

```
src/server/
├── app-layer.ts            # AppLayer = Auth.Default + DatabaseLive + LoggerLive + ServerTelemetry
├── app-runtime.ts          # Singleton ManagedRuntime (AppLayer) for CF Workers
├── logger.ts               # Sentry-based logging layer
├── telemetry.ts            # OpenTelemetry/Sentry tracing
├── rpc-helper.ts           # RpcResult type, Rpc.ok/err/notFound/forbidden/badRequest/unauthorized helpers
├── db/
│   ├── client.ts           # Database = Effect service + DatabaseLive (Turso/LibSQL), DatabaseTest (in-memory)
│   └── schema/
│       ├── index.ts        # Re-exports app-schema + auth-schema
│       ├── auth-schema.ts  # better-auth tables: user, session, account, verification, cohorts, whitelist_entries, cohort_members
│       └── app-schema.ts   # Domain tables: texts, topics, goal_maps, kits, kit_sets, assignments, assignment_targets,
│                           #   learner_maps, diagnoses, feedback, forms, questions, form_responses, form_progress
└── rpc/
    ├── analytics.ts        # RPC handlers for analytics
    ├── assignment.ts       # RPC handlers for assignments
    ├── auth.ts             # RPC handlers for auth
    ├── form.ts             # RPC handlers for forms
    ├── goal-map.ts         # RPC handlers for goal maps
    ├── kit.ts              # RPC handlers for kits
    ├── learner-map.ts      # RPC handlers for learner maps
    ├── material-image.ts   # RPC handlers for material images
    ├── profile.ts          # RPC handlers for profiles
    ├── topic.ts            # RPC handlers for topics
    ├── user.ts             # RPC handlers for users
    └── whitelist.ts        # RPC handlers for whitelist
```

## 3. package.json Scripts & Dependencies

**Scripts:**

- `vp dev` — Dev server
- `vp build` — Production build
- `vp preview` — Preview build
- `vp test run -c vitest.ui.config.ts` — Tests (also test:ui, test:watch, test:ui:watch)
- `vpx playwright test` — E2E tests (also e2e:ui, e2e:debug)
- `drizzle-kit generate/migrate` — DB migrations
- `tsx scripts/seed/index.ts` — DB seed
- `tsx scripts/seed/reset.ts` — DB reset
- `vp fmt --write ./src/**/*` — Format (oxfmt)
- `vp lint --fix ./src/**/*` — Lint
- `tsgo --noEmit` — Typecheck
- `wrangler deploy` — Deploy to Cloudflare
- `vpx shadcn@canary` — shadcn/ui add

**Key Dependencies:**

- **Framework:** TanStack Start (react-router, react-query, react-form), React 19
- **Effect:** Effect 3.21, @effect/sql, @effect/sql-drizzle, @effect/sql-libsql, @effect/opentelemetry, @effect/vitest
- **DB:** drizzle-orm 0.45, @libsql/client 0.17, drizzle-kit 0.31
- **Auth:** better-auth 1.5.6
- **UI:** Tailwind v4, shadcn/ui (radix-ui), base-ui, @xyflow/react (react-flow), framer-motion, recharts, @dnd-kit, tiptap (rich text), cmdk, sonner (toasts)
- **Other:** date-fns, clsx, tailwind-merge, class-variance-authority, lucide-react, zod, jotai, papaparse, yaml, dagre
- **Platform:** @cloudflare/vite-plugin, wrangler, miniflare, sentry/cloudflare

## 4. Database Schema (Drizzle + SQLite/LibSQL)

### Auth Schema (better-auth managed)

| Table               | Purpose                                                            |
| ------------------- | ------------------------------------------------------------------ |
| `user`              | Users (role, studentId, jlptLevel, studyGroup, consentGiven, etc.) |
| `session`           | Auth sessions                                                      |
| `account`           | OAuth accounts (email+password too)                                |
| `verification`      | Email verification tokens                                          |
| `cohorts`           | Study cohorts (experiment/control groups)                          |
| `cohort_members`    | User-cohort membership (role: member/admin)                        |
| `whitelist_entries` | Pre-registered students (studentId → claimedUserId)                |

### App Schema (domain tables)

| Table                | Purpose                                                                                                 | Key FK References                                                      |
| -------------------- | ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `texts`              | Reading materials (rich text content, metadata, images)                                                 | —                                                                      |
| `topics`             | Topics/themes                                                                                           | —                                                                      |
| `goal_maps`          | Teacher-created concept maps (nodes, edges as JSON). Type: teacher/scratch                              | teacherId→user, textId→texts, topicId→topics                           |
| `kits`               | Subsets of goal maps assigned to students (layout, nodes, edges)                                        | goalMapId→goal_maps, teacherId→user, textId→texts                      |
| `kit_sets`           | Ordered sets within a kit                                                                               | kitId→kits, textId→texts                                               |
| `assignments`        | Assignment wrapper (time limit, dates, pre/post test forms)                                             | goalMapId→goal_maps, kitId→kits, pre/postTestFormId→forms              |
| `assignment_targets` | Links assignments to cohorts or individual users                                                        | assignmentId→assignments (cascade), cohortId→cohorts, userId→user      |
| `learner_maps`       | Student submissions (nodes, edges, control_text, status: draft/submitted/graded)                        | assignmentId→assignments, goalMapId→goal_maps, kitId→kits, userId→user |
| `diagnoses`          | Auto-generated diagnosis of learner maps (score, per-link analysis)                                     | goalMapId→goal_maps, learnerMapId→learner_maps                         |
| `feedback`           | Teacher feedback on learner maps (JSON items, visibility)                                               | learnerMapId→learner_maps, goalMapId→goal_maps                         |
| `forms`              | Quizzes/tests (type: pre/post/delayed/registration/tam/questionnaire, audience: all/experiment/control) | createdBy→user                                                         |
| `questions`          | Form questions (mcq/likert/text, options JSON)                                                          | formId→forms (cascade)                                                 |
| `form_responses`     | User form submissions (answers JSON, time spent). Unique per form+user                                  | formId→forms, userId→user                                              |
| `form_progress`      | Tracks form availability (locked/available/completed)                                                   | formId→forms, userId→user                                              |

### Key Relationships

- **goal_maps → kits → assignments → learner_maps** (main content pipeline)
- **assignments → assignment_targets → (cohorts | user)** (targeting)
- **forms → questions → form_responses** (quiz system)
- **assignments → pre/postTestFormId → forms** (test linkage)
- **learner_maps → diagnoses / feedback** (evaluation)
- **cohorts → cohort_members → users** (group management)
- **whitelist_entries → cohorts / users** (pre-registration chain)

## 5. Route Structure

All dashboard routes are children of `dashboard.tsx` (sidebar layout). Non-dashboard routes: root, login, signup.

### Non-Dashboard

| Route              | Description                                            |
| ------------------ | ------------------------------------------------------ |
| `/`                | Home page                                              |
| `/login`           | Login                                                  |
| `/signup`          | Multi-step signup (student ID, personal info, consent) |
| `/api/health`      | Health check endpoint                                  |
| `/api/auth/*`      | better-auth API routes                                 |
| `/api/analytics/*` | Analytics API                                          |
| `/api/materials/*` | Materials API                                          |

### Dashboard (protected)

| Route                                         | Description                      |
| --------------------------------------------- | -------------------------------- |
| `/dashboard`                                  | Dashboard home                   |
| `/dashboard/profile`                          | User profile                     |
| `/dashboard/analytics`                        | Analytics overview               |
| `/dashboard/analytics/$assignmentId`          | Analytics detail for assignment  |
| `/dashboard/analytics/$assignmentId/metrics`  | Analytics metrics for assignment |
| `/dashboard/assignments`                      | Assignments list                 |
| `/dashboard/assignments/manage`               | Assignment management            |
| `/dashboard/assignments/manage/$assignmentId` | Manage single assignment         |
| `/dashboard/forms`                            | Forms list                       |
| `/dashboard/forms/$formId`                    | Form detail                      |
| `/dashboard/forms/$formId/results`            | Form results                     |
| `/dashboard/forms/builder`                    | Form builder (create/edit)       |
| `/dashboard/forms/student`                    | Student forms view               |
| `/dashboard/forms/take`                       | Take a form                      |
| `/dashboard/goal-map`                         | Goal maps list                   |
| `/dashboard/goal-map/$goalMapId`              | Goal map editor/detail           |
| `/dashboard/learner-map/$assignmentId`        | Learner maps for assignment      |
| `/dashboard/learner-map/$assignmentId/result` | Learner map result               |
| `/dashboard/users`                            | User management (admin)          |

## Start Here

Open `src/server/db/schema/app-schema.ts` to understand the domain model — all business logic revolves around the goal_maps→kits→assignments→learner_maps pipeline and the forms/questionnaire system.
