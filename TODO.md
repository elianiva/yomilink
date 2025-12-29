# TODO List

## High Priority

### TODO Comments
- [ ] `src/lib/auth.ts:67` - Better error handling (currently just logs to console)
- [ ] `src/routes/api/auth/$.ts:14` - Better logging with Sentry

### Incomplete Pages
- [ ] `src/routes/dashboard/results.tsx` - **Dynamic Analyzer page**
  - Contains hardcoded `demoSessions` array with mock data
  - Toolbar buttons (Undo/Redo, Zoom, Export, Clear) have no functionality
  - Group Analysis sliders, timeline slider not wired up
- [ ] `src/routes/dashboard/rooms.tsx` - **System Administration page**
  - Contains extensive hardcoded dummy data (users, groups, roles, etc.)
  - All CRUD buttons (View, Edit, Delete, Create) render UI only with no implementation
- [ ] `src/routes/dashboard/assignments/archived.tsx` - **Archived Assignments page**
  - Hardcoded mock data, no actual data fetching

### Coming Soon Features
- [ ] `src/routes/dashboard/analytics.tsx:364` - Metrics feature (shows "coming soon" toast)

## Medium Priority

### Profile Page
- [ ] `src/routes/dashboard/profile.tsx` - All fields are read-only, no edit functionality

### Code Quality
- [ ] `src/routes/dashboard/goal-map.$goalMapId.tsx:142-168` - Duplicate useEffect hooks setting page title
- [ ] Review console statements in production code:
  - `src/lib/auth.ts:68` - `console.log(e)`
  - `src/routes/dashboard/goal-map.$goalMapId.tsx:473` - `console.warn`
  - `src/routes/dashboard/goal-map.$goalMapId.tsx:623` - `console.error`
  - `src/routes/dashboard/goal-map.$goalMapId.tsx:673` - `console.error`
  - `src/routes/dashboard/assignments/manage.tsx:219` - `console.error`

### Documentation
- [ ] `README.md:276` - License section is a placeholder

## Low Priority - Test Coverage

### Server RPC/API (No tests)
- [ ] `src/server/rpc/analytics.ts`
- [ ] `src/server/rpc/assignment.ts`
- [ ] `src/server/rpc/goal-map.ts`
- [ ] `src/server/rpc/kit.ts`
- [ ] `src/server/rpc/learner-map.ts`
- [ ] `src/server/rpc/material-image.ts`
- [ ] `src/server/rpc/material-image-delete.ts`
- [ ] `src/server/rpc/profile.ts`
- [ ] `src/server/rpc/topic.ts`

### Authentication/Authorization (No tests)
- [ ] `src/lib/auth.ts`
- [ ] `src/lib/auth-client.ts`
- [ ] `src/lib/auth-permissions.ts`
- [ ] `src/middlewares/auth.ts`

### React Hooks (No tests)
- [ ] `src/hooks/use-mobile.ts`
- [ ] `src/features/goal-map/hooks/use-node-operations.ts`
- [ ] `src/features/goal-map/hooks/use-file-import.ts`
- [ ] `src/features/goal-map/hooks/use-history.ts`

### State Management (No tests)
- [ ] `src/features/goal-map/lib/atoms.ts`
- [ ] `src/features/learner-map/lib/atoms.ts`
- [ ] `src/lib/page-title.ts`

---

## Already Well Tested
- Core library functions (utils, comparators, validators)
- Layout and graph algorithms
- `src/features/analyzer/lib/` - group-comparator, map-comparator, proposition-composer, edge-styles
- `src/features/kitbuild/lib/` - floating-edge-utils, layout
- `src/features/learner-map/lib/` - grid-layout
- `src/lib/` - utils, learnermap-comparator, goalmap-validator
