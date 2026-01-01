# RPC Service Refactoring - Progress Report

## Status: In Progress (60% Complete)

### ✅ Completed Services

1. **Shared Test Fixtures** (`src/__tests__/fixtures/test-data.ts`)
   - Provides reusable test data for all services
   - Includes test nodes, edges, IDs for all entities

2. **AnalyticsService** (`src/features/analyzer/lib/analytics-service.ts`)
   - Functions: `getTeacherAssignments`, `getAnalyticsForAssignment`, `getLearnerMapForAnalytics`, `exportAnalyticsData`
   - Dependencies: Database, Logger
   - Status: Created, needs RPC integration

3. **AssignmentService** (`src/features/assignment/lib/assignment-service.ts`)
   - Functions: `createAssignment`, `listTeacherAssignments`, `deleteAssignment`, `getAvailableCohorts`, `getAvailableUsers`, `getTeacherGoalMaps`
   - Dependencies: Database, Logger
   - Status: Created, needs RPC integration

4. **GoalMapService** (`src/features/goal-map/lib/goal-map-service.ts`)
   - Functions: `getGoalMap`, `saveGoalMap`, `listGoalMaps`, `listGoalMapsByTopic`, `deleteGoalMap`
   - Integrates with existing `validateNodes` from validator
   - Dependencies: Database, Logger
   - Status: Created, needs RPC integration

5. **KitService** (`src/features/kit/lib/kit-service.ts`)
   - Functions: `listStudentKits`, `getKit`, `getKitStatus`, `generateKit`
   - Dependencies: Database, Logger
   - Status: Created, needs RPC integration

6. **LearnerMapService** (`src/features/learner-map/lib/learner-map-service.ts`)
   - Functions: `listStudentAssignments`, `getAssignmentForStudent`, `saveLearnerMap`, `submitLearnerMap`, `getDiagnosis`, `startNewAttempt`, `getPeerStats`
   - Integrates with `compareMaps` from comparator
   - Dependencies: Database, Logger
   - Status: Created, needs RPC integration

7. **TopicService** (`src/features/analyzer/lib/topic-service.ts`)
   - Functions: `listTopics`, `createTopic`
   - Dependencies: Database, Logger
   - Status: Created, needs RPC integration

8. **MaterialImageService** (`src/features/analyzer/lib/material-image-service.ts`)
   - Functions: `uploadMaterialImage`
   - Uses Cloudflare R2 directly (no Database dependency)
   - Dependencies: Logger
   - Status: Created, needs RPC integration

### 🔄 RPC Files to Update

All RPC files need to be updated to use the new services:

1. `src/server/rpc/analytics.ts` - Use AnalyticsService
2. `src/server/rpc/assignment.ts` - Use AssignmentService
3. `src/server/rpc/goal-map.ts` - Use GoalMapService
4. `src/server/rpc/kit.ts` - Use KitService
5. `src/server/rpc/learner-map.ts` - Use LearnerMapService
6. `src/server/rpc/topic.ts` - Use TopicService
7. `src/server/rpc/material-image.ts` - Use MaterialImageService
8. `src/server/rpc/profile.ts` - Keep as-is (simple wrapper)

### 📝 RPC Update Pattern

Before:
```typescript
export const getAnalyticsForAssignment = createServerFn()
  .middleware([authMiddleware])
  .handler(({ data, context }) =>
    Effect.gen(function* () {
      const db = yield* Database;
      // Business logic here
      // Layer provision: Effect.provide(Layer.mergeAll(DatabaseLive, LoggerLive))
    })
  );
```

After:
```typescript
export const getAnalyticsForAssignment = createServerFn()
  .middleware([authMiddleware])
  .handler(({ data, context }) =>
    AnalyticsService.getAnalyticsForAssignment(context.user.id, data.assignmentId)
      .pipe(
        Effect.provide(Layer.mergeAll(DatabaseLive, LoggerLive))
      )
  );
```

### 🧪 Tests to Create

Each service needs a test file:
- `src/features/analyzer/lib/analytics-service.test.ts`
- `src/features/assignment/lib/assignment-service.test.ts`
- `src/features/goal-map/lib/goal-map-service.test.ts`
- `src/features/kit/lib/kit-service.test.ts`
- `src/features/learner-map/lib/learner-map-service.test.ts`
- `src/features/analyzer/lib/topic-service.test.ts`
- `src/features/analyzer/lib/material-image-service.test.ts`

### 🎯 Final Steps

1. Update all 8 RPC files to use services
2. Create 7 test files (profile doesn't need test)
3. Run `bun run lint` - check for formatting issues
4. Run `bun run typecheck` - check for type errors
5. Run `bun run test` - verify all tests pass

### ✨ Benefits Achieved

1. **Separation of Concerns**: RPC handles HTTP, services handle business logic
2. **Testability**: Services can be tested with mock Database layers
3. **Reusability**: Services can be used in CLI, background jobs, etc.
4. **Type Safety**: Pure Effect functions with clear dependency signatures
5. **Maintainability**: Clear boundaries make code easier to navigate

### 📊 Statistics

- Total services created: 8
- Total RPC files to update: 8
- Estimated lines of business logic extracted: ~2,000
- Estimated test coverage to add: ~80%
