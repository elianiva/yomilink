import { InboxIcon, Loader2Icon } from "lucide-react";
import type * as React from "react";
import { cn } from "@/lib/utils";
import { ErrorCard } from "./ui/error-card";
import { Skeleton } from "./ui/skeleton";

/**
 * Props for the DataState component.
 */
export type DataStateProps = {
	/** Whether data is currently loading */
	loading?: boolean;
	/** Error message to display (null if no error) */
	error?: string | null;
	/** Whether the data set is empty */
	empty?: boolean;
	/** Custom content for loading state */
	loadingContent?: React.ReactNode;
	/** Custom content for empty state */
	emptyContent?: React.ReactNode;
	/** Custom content for error state */
	errorContent?: React.ReactNode;
	/** Callback when retry is clicked in error state */
	onRetry?: () => void;
	/** Whether retry is in progress */
	isRetrying?: boolean;
	/** Children to render when data exists (not loading, not empty, no error) */
	children: React.ReactNode;
	/** Additional className for the wrapper */
	className?: string;
	/** Custom empty state title */
	emptyTitle?: string;
	/** Custom empty state description */
	emptyDescription?: string;
	/** Custom error title */
	errorTitle?: string;
};

/**
 * Default loading content - centered spinner with skeleton.
 */
function DefaultLoadingContent({ className }: { className?: string }) {
	return (
		<div
			className={cn(
				"flex flex-col items-center justify-center gap-4 py-12",
				className,
			)}
		>
			<Loader2Icon className="size-8 animate-spin text-muted-foreground" />
			<div className="space-y-2 w-full max-w-xs">
				<Skeleton className="h-4 w-full" />
				<Skeleton className="h-4 w-3/4" />
			</div>
		</div>
	);
}

/**
 * Default empty content - centered icon with message.
 */
function DefaultEmptyContent({
	title,
	description,
	className,
}: {
	title: string;
	description?: string;
	className?: string;
}) {
	return (
		<div
			className={cn(
				"flex flex-col items-center justify-center gap-4 py-12 text-center",
				className,
			)}
		>
			<div className="rounded-full bg-muted p-4">
				<InboxIcon className="size-8 text-muted-foreground" />
			</div>
			<div className="space-y-1">
				<h3 className="font-medium text-foreground">{title}</h3>
				{description && (
					<p className="text-sm text-muted-foreground max-w-sm">
						{description}
					</p>
				)}
			</div>
		</div>
	);
}

/**
 * DataState - A combined component that handles loading, empty, and error states.
 *
 * This component simplifies common data fetching patterns by providing
 * consistent UI for all three states while showing children only when
 * data is available.
 *
 * @example
 * ```tsx
 * // Basic usage with useQuery
 * const { data, isLoading, error } = useQuery(SomeRpc.getData());
 *
 * <DataState
 *   loading={isLoading}
 *   error={error?.message ?? null}
 *   empty={!data || data.length === 0}
 *   onRetry={() => refetch()}
 * >
 *   <DataList items={data} />
 * </DataState>
 * ```
 *
 * @example
 * ```tsx
 * // With custom empty state
 * <DataState
 *   loading={isLoading}
 *   error={error?.message ?? null}
 *   empty={items.length === 0}
 *   emptyTitle="No assignments yet"
 *   emptyDescription="Create your first assignment to get started."
 *   emptyContent={
 *     <div className="text-center">
 *       <Button onClick={onCreate}>Create Assignment</Button>
 *     </div>
 *   }
 * >
 *   <AssignmentList items={items} />
 * </DataState>
 * ```
 *
 * @example
 * ```tsx
 * // With custom loading content
 * <DataState
 *   loading={isLoading}
 *   error={null}
 *   empty={false}
 *   loadingContent={<TableSkeleton rows={5} />}
 * >
 *   <DataTable data={data} />
 * </DataState>
 * ```
 */
export function DataState({
	loading = false,
	error = null,
	empty = false,
	loadingContent,
	emptyContent,
	errorContent,
	onRetry,
	isRetrying = false,
	children,
	className,
	emptyTitle = "No data",
	emptyDescription,
	errorTitle = "Failed to load data",
}: DataStateProps) {
	// Priority: loading > error > empty > children
	// This ensures we show the most relevant state

	if (loading) {
		return (
			<div className={className} aria-busy="true" aria-live="polite">
				{loadingContent ?? <DefaultLoadingContent />}
			</div>
		);
	}

	if (error) {
		return (
			<div className={className} aria-live="assertive">
				{errorContent ?? (
					<ErrorCard
						title={errorTitle}
						description={error}
						onRetry={onRetry}
						isRetrying={isRetrying}
					/>
				)}
			</div>
		);
	}

	if (empty) {
		return (
			<div className={className} aria-live="polite">
				{emptyContent ?? (
					<DefaultEmptyContent
						title={emptyTitle}
						description={emptyDescription}
					/>
				)}
			</div>
		);
	}

	// Data exists - render children
	return <>{children}</>;
}

/**
 * Compact variant of DataState for smaller UI areas.
 * Shows minimal loading/error/empty states inline.
 */
export function CompactDataState({
	loading = false,
	error = null,
	empty = false,
	loadingText = "Loading...",
	emptyText = "No data",
	children,
	className,
	onRetry,
}: {
	loading?: boolean;
	error?: string | null;
	empty?: boolean;
	loadingText?: string;
	emptyText?: string;
	children: React.ReactNode;
	className?: string;
	onRetry?: () => void;
}) {
	if (loading) {
		return (
			<div
				className={cn(
					"flex items-center gap-2 text-sm text-muted-foreground",
					className,
				)}
				aria-busy="true"
			>
				<Loader2Icon className="size-4 animate-spin" />
				<span>{loadingText}</span>
			</div>
		);
	}

	if (error) {
		return (
			<div className={cn("text-sm text-destructive", className)}>
				<span>{error}</span>
				{onRetry && (
					<button
						type="button"
						onClick={onRetry}
						className="ml-2 underline hover:no-underline"
					>
						Retry
					</button>
				)}
			</div>
		);
	}

	if (empty) {
		return (
			<div className={cn("text-sm text-muted-foreground", className)}>
				{emptyText}
			</div>
		);
	}

	return <>{children}</>;
}
