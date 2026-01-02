import { useQueryErrorResetBoundary } from "@tanstack/react-query";
import type * as React from "react";
import { Component, useCallback, useEffect, useRef } from "react";
import { getErrorDetails } from "@/lib/error-types";
import { ErrorCard } from "./ui/error-card";

/**
 * Props for QueryErrorBoundary component.
 */
export type QueryErrorBoundaryProps = {
	/** Children to render */
	children: React.ReactNode;
	/** Custom fallback component to render when an error occurs */
	fallback?: React.ReactNode | ((props: FallbackProps) => React.ReactNode);
	/** Callback when an error is caught */
	onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
	/** Callback when the boundary is reset */
	onReset?: () => void;
	/** Keys that, when changed, will reset the error boundary */
	resetKeys?: unknown[];
	/** Custom error title */
	errorTitle?: string;
};

/**
 * Props passed to the fallback component.
 */
export type FallbackProps = {
	error: Error;
	resetErrorBoundary: () => void;
	isResetting: boolean;
};

/**
 * Internal state for the error boundary.
 */
type ErrorBoundaryState = {
	error: Error | null;
	isResetting: boolean;
};

/**
 * Class component for error boundary (required by React).
 */
class ErrorBoundaryClass extends Component<
	QueryErrorBoundaryProps & {
		onResetQuery: () => void;
		resetKeysRef: React.MutableRefObject<unknown[] | undefined>;
	},
	ErrorBoundaryState
> {
	state: ErrorBoundaryState = {
		error: null,
		isResetting: false,
	};

	static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
		return { error };
	}

	componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
		this.props.onError?.(error, errorInfo);
	}

	componentDidUpdate(
		_prevProps: QueryErrorBoundaryProps & {
			onResetQuery: () => void;
			resetKeysRef: React.MutableRefObject<unknown[] | undefined>;
		},
	) {
		const { resetKeys } = this.props;
		const { error } = this.state;

		// Check if resetKeys changed
		if (error && resetKeys) {
			const prevResetKeys = this.props.resetKeysRef.current;
			const hasChanged =
				prevResetKeys &&
				(prevResetKeys.length !== resetKeys.length ||
					prevResetKeys.some((key, index) => key !== resetKeys[index]));

			if (hasChanged) {
				this.resetErrorBoundary();
			}
		}

		// Update ref with current keys
		this.props.resetKeysRef.current = resetKeys;
	}

	resetErrorBoundary = () => {
		const { onReset, onResetQuery } = this.props;

		this.setState({ isResetting: true });

		// Reset React Query cache
		onResetQuery();

		// Call custom reset handler
		onReset?.();

		// Clear error state after a brief delay to show loading state
		setTimeout(() => {
			this.setState({ error: null, isResetting: false });
		}, 100);
	};

	render() {
		const { error, isResetting } = this.state;
		const { children, fallback, errorTitle } = this.props;

		if (error) {
			// Render custom fallback if provided
			if (fallback) {
				if (typeof fallback === "function") {
					return fallback({
						error,
						resetErrorBoundary: this.resetErrorBoundary,
						isResetting,
					});
				}
				return fallback;
			}

			// Default fallback using ErrorCard
			const errorDetails = getErrorDetails(error);
			return (
				<ErrorCard
					title={errorTitle || "Something went wrong"}
					description={errorDetails.message}
					onRetry={this.resetErrorBoundary}
					isRetrying={isResetting}
				/>
			);
		}

		return children;
	}
}

/**
 * QueryErrorBoundary - A React Error Boundary designed to catch and handle
 * React Query errors with support for retry and recovery.
 *
 * This component integrates with React Query's error reset boundary to ensure
 * that retries properly reset the query cache.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <QueryErrorBoundary>
 *   <ComponentThatUsesQueries />
 * </QueryErrorBoundary>
 * ```
 *
 * @example
 * ```tsx
 * // With custom fallback
 * <QueryErrorBoundary
 *   fallback={({ error, resetErrorBoundary }) => (
 *     <div>
 *       <p>Error: {error.message}</p>
 *       <button onClick={resetErrorBoundary}>Try again</button>
 *     </div>
 *   )}
 * >
 *   <ComponentThatUsesQueries />
 * </QueryErrorBoundary>
 * ```
 *
 * @example
 * ```tsx
 * // With reset keys (auto-reset when keys change)
 * const [userId, setUserId] = useState("1");
 *
 * <QueryErrorBoundary resetKeys={[userId]}>
 *   <UserProfile userId={userId} />
 * </QueryErrorBoundary>
 * ```
 *
 * @example
 * ```tsx
 * // With error callback
 * <QueryErrorBoundary
 *   onError={(error, errorInfo) => {
 *     // Log to error tracking service
 *     Sentry.captureException(error, { extra: errorInfo });
 *   }}
 *   onReset={() => {
 *     // Clear any local state
 *     setLocalError(null);
 *   }}
 * >
 *   <ComponentThatUsesQueries />
 * </QueryErrorBoundary>
 * ```
 */
export function QueryErrorBoundary({
	children,
	fallback,
	onError,
	onReset,
	resetKeys,
	errorTitle,
}: QueryErrorBoundaryProps) {
	const { reset: resetQuery } = useQueryErrorResetBoundary();
	const resetKeysRef = useRef<unknown[] | undefined>(resetKeys);

	// Update ref on each render
	useEffect(() => {
		resetKeysRef.current = resetKeys;
	}, [resetKeys]);

	const handleResetQuery = useCallback(() => {
		resetQuery();
	}, [resetQuery]);

	return (
		<ErrorBoundaryClass
			fallback={fallback}
			onError={onError}
			onReset={onReset}
			resetKeys={resetKeys}
			errorTitle={errorTitle}
			onResetQuery={handleResetQuery}
			resetKeysRef={resetKeysRef}
		>
			{children}
		</ErrorBoundaryClass>
	);
}

/**
 * Hook to use within QueryErrorBoundary to manually trigger reset.
 * Must be used within a QueryErrorBoundary.
 */
export function useQueryErrorBoundaryReset() {
	const { reset } = useQueryErrorResetBoundary();
	return reset;
}
