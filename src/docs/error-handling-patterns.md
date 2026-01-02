# Error Handling Patterns Guide

This guide provides comprehensive examples and patterns for using Yomilink's error handling system.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Common Scenarios](#common-scenarios)
3. [Advanced Patterns](#advanced-patterns)
4. [Migration Examples](#migration-examples)
5. [Troubleshooting](#troubleshooting)

---

## Quick Start

### Getting Started with useRpcQuery

The `useRpcQuery` hook wraps React Query's `useQuery` with automatic RPC error handling and exponential backoff retry.

```tsx
import { useRpcQuery } from "@/hooks/use-rpc-query";
import { GoalMapRpc } from "@/server/rpc/goal-map";

function GoalMapPage({ goalMapId }: { goalMapId: string }) {
  const { data, isLoading, rpcError, refetch, isRefetching } = useRpcQuery(
    GoalMapRpc.getGoalMap(goalMapId)
  );

  if (isLoading) return <Spinner />;
  if (rpcError) {
    return (
      <ErrorCard
        title="Failed to load goal map"
        description={rpcError}
        onRetry={refetch}
        isRetrying={isRefetching}
      />
    );
  }
  if (!data) return null;

  return <GoalMapEditor data={data} />;
}
```

**Key features:**
- `data` - Type-safe extracted data (null if loading/error)
- `rpcError` - Error message string (null if no error)
- `isRpcError` - Boolean flag for error state
- Automatic retry with exponential backoff (1s, 2s, 4s) for network/server errors

### Getting Started with useRpcMutation

The `useRpcMutation` hook wraps React Query's `useMutation` with automatic toast notifications.

```tsx
import { useRpcMutation } from "@/hooks/use-rpc-query";
import { AssignmentRpc } from "@/server/rpc/assignment";

function DeleteButton({ assignmentId }: { assignmentId: string }) {
  const mutation = useRpcMutation(
    AssignmentRpc.deleteAssignment(),
    {
      operation: "delete assignment",
      showSuccess: true,
      successMessage: "Assignment deleted successfully",
    }
  );

  return (
    <Button
      onClick={() => mutation.mutate({ id: assignmentId })}
      disabled={mutation.isPending}
    >
      {mutation.isPending ? "Deleting..." : "Delete"}
    </Button>
  );
}
```

**Key features:**
- Automatic error toasts for RPC errors
- Optional success toasts
- `operation` provides context in error messages ("Failed to delete assignment")

### Basic Error Display with DataState

The `DataState` component handles loading, error, and empty states in one place.

```tsx
import { DataState } from "@/components/data-state";
import { useRpcQuery } from "@/hooks/use-rpc-query";

function AssignmentList() {
  const { data, isLoading, rpcError, refetch, isRefetching } = useRpcQuery(
    AssignmentRpc.listAssignments()
  );

  return (
    <DataState
      loading={isLoading}
      error={rpcError}
      empty={!data || data.length === 0}
      onRetry={refetch}
      isRetrying={isRefetching}
      emptyTitle="No assignments yet"
      emptyDescription="Create your first assignment to get started."
    >
      {data?.map((assignment) => (
        <AssignmentCard key={assignment.id} assignment={assignment} />
      ))}
    </DataState>
  );
}
```

---

## Common Scenarios

### Loading a List with Loading/Empty/Error States

```tsx
function StudentList() {
  const { data, isLoading, rpcError, refetch, isRefetching } = useRpcQuery(
    StudentRpc.listStudents()
  );

  return (
    <DataState
      loading={isLoading}
      error={rpcError}
      empty={!data || data.length === 0}
      onRetry={refetch}
      isRetrying={isRefetching}
      emptyTitle="No students found"
      emptyDescription="Add students to see them here."
    >
      <div className="grid gap-4">
        {data?.map((student) => (
          <StudentCard key={student.id} student={student} />
        ))}
      </div>
    </DataState>
  );
}
```

### Loading a Single Item with Error Handling

```tsx
function ProfilePage({ userId }: { userId: string }) {
  const { data, isLoading, rpcError, refetch, isRefetching } = useRpcQuery(
    ProfileRpc.getProfile(userId)
  );

  return (
    <DataState
      loading={isLoading}
      error={rpcError}
      onRetry={refetch}
      isRetrying={isRefetching}
      errorTitle="Failed to load profile"
    >
      {data && <ProfileDetails profile={data} />}
    </DataState>
  );
}
```

### Form Submission with Validation Errors

```tsx
import { useForm } from "@tanstack/react-form";
import { useRpcMutation } from "@/hooks/use-rpc-query";
import { InlineError } from "@/components/ui/error-card";

function CreateAssignmentForm() {
  const mutation = useRpcMutation(
    AssignmentRpc.createAssignment(),
    {
      operation: "create assignment",
      showSuccess: true,
      successMessage: "Assignment created!",
    }
  );

  const form = useForm({
    defaultValues: { title: "", description: "" },
    onSubmit: async ({ value }) => {
      await mutation.mutateAsync(value);
    },
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }}>
      <form.Field name="title">
        {(field) => (
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
            />
            {field.state.meta.errors.length > 0 && (
              <InlineError message={field.state.meta.errors[0]} />
            )}
          </div>
        )}
      </form.Field>

      {/* Show RPC error if mutation failed */}
      {mutation.rpcError && (
        <ErrorCard
          title="Failed to create assignment"
          description={mutation.rpcError}
        />
      )}

      <Button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? "Creating..." : "Create Assignment"}
      </Button>
    </form>
  );
}
```

### Delete Operation with Confirmation

```tsx
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

function DeleteAssignmentButton({ assignmentId, onDeleted }: Props) {
  const mutation = useRpcMutation(
    AssignmentRpc.deleteAssignment(),
    {
      operation: "delete assignment",
      showSuccess: true,
      successMessage: "Assignment deleted",
    }
  );

  const handleDelete = async () => {
    const result = await mutation.mutateAsync({ id: assignmentId });
    if (!isErrorResponse(result)) {
      onDeleted?.();
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">Delete</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Assignment?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

### Bulk Operations with Partial Success

```tsx
function BulkDeleteButton({ selectedIds }: { selectedIds: string[] }) {
  const [results, setResults] = useState<{
    success: string[];
    failed: string[];
  }>({ success: [], failed: [] });

  const mutation = useRpcMutation(
    AssignmentRpc.deleteAssignment(),
    { showError: false } // Handle errors manually for bulk ops
  );

  const handleBulkDelete = async () => {
    const success: string[] = [];
    const failed: string[] = [];

    for (const id of selectedIds) {
      const result = await mutation.mutateAsync({ id });
      if (isErrorResponse(result)) {
        failed.push(id);
      } else {
        success.push(id);
      }
    }

    setResults({ success, failed });

    if (failed.length === 0) {
      showSuccessToast(`Deleted ${success.length} assignments`);
    } else if (success.length === 0) {
      showErrorToast(new Error("All deletions failed"), {
        operation: "bulk delete",
      });
    } else {
      showWarningToast(
        `Deleted ${success.length}, failed ${failed.length}`
      );
    }
  };

  return (
    <Button onClick={handleBulkDelete} disabled={mutation.isPending}>
      Delete {selectedIds.length} selected
    </Button>
  );
}
```

### Real-time Data Updates with Error Recovery

```tsx
function LiveAnalytics({ assignmentId }: { assignmentId: string }) {
  const { data, isLoading, rpcError, refetch, isRefetching } = useRpcQuery(
    {
      ...AnalyticsRpc.getLiveData(assignmentId),
      refetchInterval: 5000, // Poll every 5 seconds
      refetchIntervalInBackground: false,
    },
    {
      retryCount: 5, // More retries for live data
      retryDelays: [1000, 2000, 4000, 8000, 16000],
    }
  );

  return (
    <DataState
      loading={isLoading}
      error={rpcError}
      onRetry={refetch}
      isRetrying={isRefetching}
    >
      <AnalyticsChart data={data} />
    </DataState>
  );
}
```

---

## Advanced Patterns

### Nested Error Boundaries

Use `QueryErrorBoundary` to isolate error handling to specific sections:

```tsx
import { QueryErrorBoundary } from "@/components/query-error-boundary";

function DashboardPage() {
  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Each section has its own error boundary */}
      <QueryErrorBoundary errorTitle="Failed to load stats">
        <StatsSection />
      </QueryErrorBoundary>

      <QueryErrorBoundary errorTitle="Failed to load activity">
        <ActivitySection />
      </QueryErrorBoundary>

      <QueryErrorBoundary errorTitle="Failed to load assignments">
        <AssignmentsSection />
      </QueryErrorBoundary>

      <QueryErrorBoundary errorTitle="Failed to load students">
        <StudentsSection />
      </QueryErrorBoundary>
    </div>
  );
}
```

### Global Error Handling with Root Boundary

Wrap your entire app or route in a boundary:

```tsx
// In __root.tsx or layout component
import { QueryErrorBoundary } from "@/components/query-error-boundary";

function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <QueryErrorBoundary
      errorTitle="Something went wrong"
      onError={(error, errorInfo) => {
        // Log to error tracking service
        Sentry.captureException(error, { extra: errorInfo });
      }}
    >
      {children}
    </QueryErrorBoundary>
  );
}
```

### Custom Error Messages Per Operation

```tsx
function GoalMapEditor({ goalMapId }: { goalMapId: string }) {
  const saveMutation = useRpcMutation(
    GoalMapRpc.saveGoalMap(),
    {
      operation: "save goal map",
      errorMessage: "Your changes could not be saved. Please try again.",
      showSuccess: true,
      successMessage: "Goal map saved!",
    }
  );

  const exportMutation = useRpcMutation(
    GoalMapRpc.exportGoalMap(),
    {
      operation: "export goal map",
      errorMessage: "Export failed. Check your browser settings.",
      showSuccess: true,
      successMessage: "Export complete!",
    }
  );

  // ...
}
```

### Retry Strategies Per Query Type

```tsx
// Critical data - more retries
const { data: user } = useRpcQuery(
  ProfileRpc.getCurrentUser(),
  {
    retryCount: 5,
    retryDelays: [1000, 2000, 4000, 8000, 16000],
  }
);

// Non-critical data - fewer retries
const { data: suggestions } = useRpcQuery(
  SuggestionsRpc.getSuggestions(),
  {
    retryCount: 1,
    retryDelays: [2000],
  }
);

// No retry for user-initiated actions
const { data: searchResults } = useRpcQuery(
  SearchRpc.search(query),
  {
    retryCount: 0,
  }
);
```

### Optimistic Updates with Rollback

```tsx
import { useQueryClient } from "@tanstack/react-query";
import { useRpcMutation } from "@/hooks/use-rpc-query";

function ToggleFavorite({ itemId, isFavorite }: Props) {
  const queryClient = useQueryClient();

  const mutation = useRpcMutation(
    {
      mutationFn: FavoritesRpc.toggle,
      onMutate: async ({ id, favorite }) => {
        // Cancel outgoing refetches
        await queryClient.cancelQueries({ queryKey: ["favorites"] });

        // Snapshot previous value
        const previous = queryClient.getQueryData(["favorites"]);

        // Optimistically update
        queryClient.setQueryData(["favorites"], (old: string[]) =>
          favorite
            ? [...old, id]
            : old.filter((fav) => fav !== id)
        );

        return { previous };
      },
      onError: (_err, _vars, context) => {
        // Rollback on error
        if (context?.previous) {
          queryClient.setQueryData(["favorites"], context.previous);
        }
      },
      onSettled: () => {
        // Refetch after error or success
        queryClient.invalidateQueries({ queryKey: ["favorites"] });
      },
    },
    {
      operation: "update favorites",
      showError: true,
    }
  );

  return (
    <Button
      onClick={() => mutation.mutate({ id: itemId, favorite: !isFavorite })}
      disabled={mutation.isPending}
    >
      {isFavorite ? "Unfavorite" : "Favorite"}
    </Button>
  );
}
```

### Error Aggregation in Complex Flows

```tsx
import { showErrorToast, showWarningToast, showSuccessToast } from "@/lib/error-toast";

async function processMultipleItems(items: Item[]) {
  const errors: string[] = [];
  let successCount = 0;

  for (const item of items) {
    try {
      const result = await processItem(item);
      if (isErrorResponse(result)) {
        errors.push(`${item.name}: ${result.error}`);
      } else {
        successCount++;
      }
    } catch (err) {
      errors.push(`${item.name}: ${getErrorDetails(err).message}`);
    }
  }

  // Report results
  if (errors.length === 0) {
    showSuccessToast(`Processed ${successCount} items`);
  } else if (successCount === 0) {
    showErrorToast(new Error(errors.join("\n")), {
      title: "All items failed",
      operation: "process items",
    });
  } else {
    showWarningToast(`${successCount} succeeded, ${errors.length} failed`);
    console.error("Failed items:", errors);
  }
}
```

---

## Migration Examples

### Before/After: Basic Query

**Before (manual error handling):**
```tsx
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { toast } from "sonner";

function AssignmentList() {
  const query = useQuery(AssignmentRpc.listAssignments());

  // Manual error filtering
  const assignments = useMemo(() => {
    if (!query.data) return [];
    if ("success" in query.data && query.data.success === false) return [];
    return query.data as Assignment[];
  }, [query.data]);

  const hasError = useMemo(() => {
    if (!query.data) return false;
    return "success" in query.data && query.data.success === false;
  }, [query.data]);

  const errorMessage = useMemo(() => {
    if (!hasError || !query.data) return null;
    return (query.data as { error: string }).error;
  }, [hasError, query.data]);

  if (query.isLoading) return <Spinner />;
  if (hasError) {
    return <div className="text-red-500">{errorMessage}</div>;
  }
  if (assignments.length === 0) {
    return <div>No assignments</div>;
  }

  return (
    <ul>
      {assignments.map((a) => (
        <li key={a.id}>{a.title}</li>
      ))}
    </ul>
  );
}
```

**After (using new system):**
```tsx
import { useRpcQuery } from "@/hooks/use-rpc-query";
import { DataState } from "@/components/data-state";

function AssignmentList() {
  const { data, isLoading, rpcError, refetch, isRefetching } = useRpcQuery(
    AssignmentRpc.listAssignments()
  );

  return (
    <DataState
      loading={isLoading}
      error={rpcError}
      empty={!data || data.length === 0}
      onRetry={refetch}
      isRetrying={isRefetching}
      emptyTitle="No assignments"
    >
      <ul>
        {data?.map((a) => (
          <li key={a.id}>{a.title}</li>
        ))}
      </ul>
    </DataState>
  );
}
```

### Before/After: Mutation with Toast

**Before:**
```tsx
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

function DeleteButton({ id }: { id: string }) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    ...AssignmentRpc.deleteAssignment(),
    onSuccess: (data) => {
      if ("success" in data && data.success === false) {
        toast.error("Failed to delete", {
          description: data.error,
        });
        return;
      }
      toast.success("Assignment deleted");
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
    },
    onError: (error) => {
      toast.error("Failed to delete", {
        description: error.message,
      });
    },
  });

  return (
    <Button
      onClick={() => mutation.mutate({ id })}
      disabled={mutation.isPending}
    >
      Delete
    </Button>
  );
}
```

**After:**
```tsx
import { useRpcMutation } from "@/hooks/use-rpc-query";
import { useQueryClient } from "@tanstack/react-query";
import { isErrorResponse } from "@/hooks/use-rpc-error";

function DeleteButton({ id }: { id: string }) {
  const queryClient = useQueryClient();

  const mutation = useRpcMutation(
    {
      ...AssignmentRpc.deleteAssignment(),
      onSuccess: (result) => {
        if (!isErrorResponse(result)) {
          queryClient.invalidateQueries({ queryKey: ["assignments"] });
        }
      },
    },
    {
      operation: "delete assignment",
      showSuccess: true,
      successMessage: "Assignment deleted",
    }
  );

  return (
    <Button
      onClick={() => mutation.mutate({ id })}
      disabled={mutation.isPending}
    >
      Delete
    </Button>
  );
}
```

### Step-by-Step Migration for Complex Components

1. **Replace imports:**
   ```tsx
   // Before
   import { useQuery, useMutation } from "@tanstack/react-query";
   import { toast } from "sonner";

   // After
   import { useRpcQuery, useRpcMutation } from "@/hooks/use-rpc-query";
   import { DataState } from "@/components/data-state";
   import { isErrorResponse } from "@/hooks/use-rpc-error";
   ```

2. **Replace useQuery with useRpcQuery:**
   ```tsx
   // Before
   const query = useQuery(SomeRpc.getData());

   // After
   const { data, isLoading, rpcError, refetch, isRefetching } = useRpcQuery(
     SomeRpc.getData()
   );
   ```

3. **Remove manual error filtering useMemo blocks**

4. **Replace inline error/loading handling with DataState:**
   ```tsx
   // Before
   if (query.isLoading) return <Spinner />;
   if (hasError) return <ErrorMessage error={errorMessage} />;
   if (items.length === 0) return <EmptyState />;
   return <List items={items} />;

   // After
   return (
     <DataState
       loading={isLoading}
       error={rpcError}
       empty={!data || data.length === 0}
       onRetry={refetch}
       isRetrying={isRefetching}
     >
       <List items={data} />
     </DataState>
   );
   ```

5. **Replace useMutation with useRpcMutation:**
   ```tsx
   // Before
   const mutation = useMutation({
     ...SomeRpc.doSomething(),
     onSuccess: (data) => {
       if (data.success === false) {
         toast.error(data.error);
         return;
       }
       toast.success("Done!");
     },
     onError: (err) => toast.error(err.message),
   });

   // After
   const mutation = useRpcMutation(
     SomeRpc.doSomething(),
     {
       operation: "do something",
       showSuccess: true,
       successMessage: "Done!",
     }
   );
   ```

6. **Remove manual toast.error() calls** - they're handled automatically

---

## Troubleshooting

### Common Issues and Solutions

#### "data is possibly null" TypeScript error

**Problem:** TypeScript complains about data being null even inside DataState children.

**Solution:** Use optional chaining or a null check:
```tsx
<DataState loading={isLoading} error={rpcError}>
  {data && <Component data={data} />}
</DataState>

// Or with optional chaining
<DataState loading={isLoading} error={rpcError}>
  {data?.items.map(item => <Item key={item.id} item={item} />)}
</DataState>
```

#### Error toast shows twice

**Problem:** Error appears as both toast and inline error.

**Solution:** Disable inline error display:
```tsx
const { data, rpcError } = useRpcQuery(
  SomeRpc.getData(),
  { showError: false } // Disable rpcError, use toast only
);
```

#### Mutation shows error toast for expected errors

**Problem:** Validation errors show as toasts when you want inline handling.

**Solution:** Disable automatic error toasts:
```tsx
const mutation = useRpcMutation(
  SomeRpc.validate(),
  { showError: false } // Handle errors manually
);

// Then check mutation.rpcError for inline display
{mutation.rpcError && <InlineError message={mutation.rpcError} />}
```

#### Retry doesn't work

**Problem:** Clicking retry doesn't refetch data.

**Solution:** Ensure you're passing `refetch` to `onRetry`:
```tsx
<DataState
  error={rpcError}
  onRetry={refetch}        // Pass the function
  isRetrying={isRefetching} // Show loading state
>
```

### Debugging Tips

1. **Check the original query result:**
   ```tsx
   const result = useRpcQuery(SomeRpc.getData());
   console.log("Query result:", result.queryResult); // Full React Query result
   ```

2. **Inspect error details:**
   ```tsx
   import { getErrorDetails } from "@/lib/error-types";

   const { rpcError } = useRpcQuery(SomeRpc.getData());
   if (rpcError) {
     const details = getErrorDetails(rpcError);
     console.log("Error category:", details.category);
     console.log("Is retryable:", details.isRetryable);
   }
   ```

3. **Use React Query DevTools:**
   The hooks work with React Query DevTools. Check the "Queries" and "Mutations" tabs.

### Performance Considerations

1. **Avoid unnecessary retries:**
   ```tsx
   // For user-initiated searches, disable retry
   useRpcQuery(SearchRpc.search(query), { retryCount: 0 });
   ```

2. **Use appropriate stale times:**
   ```tsx
   useRpcQuery({
     ...ProfileRpc.getProfile(),
     staleTime: 5 * 60 * 1000, // 5 minutes
   });
   ```

3. **Batch related queries:**
   If you have multiple dependent queries, consider combining them on the server.

4. **Avoid re-renders from error state:**
   ```tsx
   // If you don't need error in render, disable it
   const { data } = useRpcQuery(
     SomeRpc.getData(),
     { showError: false }
   );
   ```
