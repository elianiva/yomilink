/**
 * Custom React Query Hooks for RPC Operations
 *
 * Wraps standard useQuery and useMutation with automatic RPC error handling,
 * retry logic, and toast notifications.
 */

import {
	useMutation,
	useQuery,
	type UseMutationOptions,
	type UseMutationResult,
	type UseQueryOptions,
	type UseQueryResult,
} from "@tanstack/react-query";
import { useMemo } from "react";

import { toast, type ErrorToastOptions } from "@/lib/error-toast";
import { getErrorDetails, isRetryableError } from "@/lib/error-types";

import {
	extractData,
	isErrorResponse,
	type RpcErrorResponse,
	type RpcSuccessResponse,
} from "./use-rpc-error";

/**
 * Configuration options for useRpcQuery.
 */
export type UseRpcQueryConfig = {
	/** Whether to show error inline (via returned error state). Default: true */
	showError?: boolean;
	/** Custom error message to display */
	errorMessage?: string;
	/** Custom error title */
	errorTitle?: string;
	/** Number of retry attempts for retryable errors. Default: 3 */
	retryCount?: number;
	/** Retry delays in milliseconds. Default: [1000, 2000, 4000] */
	retryDelays?: number[];
};

/**
 * Filter out RpcErrorResponse from a union type.
 * This distributes over unions to remove error types.
 */
type ExcludeError<T> = T extends RpcErrorResponse ? never : T;

/**
 * Extract data from RpcSuccessResponse, or return plain type as-is.
 */
type UnwrapSuccess<T> = T extends RpcSuccessResponse<infer D> ? D : T;

/**
 * Extract the success data type from a potential RPC response union.
 * Removes RpcErrorResponse and unwraps RpcSuccessResponse.
 */
type ExtractSuccessData<T> = UnwrapSuccess<ExcludeError<T>>;

/**
 * Extended result type for useRpcQuery.
 */
export type UseRpcQueryResult<TData> = Omit<
	UseQueryResult<TData | RpcErrorResponse, Error>,
	"data" | "error"
> & {
	/** Extracted data (null if loading or error) */
	data: ExtractSuccessData<TData> | null;
	/** RPC error message (null if no error) */
	rpcError: string | null;
	/** Whether the response is an RPC error */
	isRpcError: boolean;
	/** Original query result for advanced usage */
	queryResult: UseQueryResult<TData | RpcErrorResponse, Error>;
};

/**
 * Default retry delays (exponential backoff): 1s, 2s, 4s
 */
const DEFAULT_RETRY_DELAYS = [1000, 2000, 4000];

/**
 * useRpcQuery - Custom React Query hook for RPC queries.
 *
 * Automatically handles RPC error responses, provides type-safe data extraction,
 * and implements exponential backoff retry for network/server errors.
 *
 * @example
 * ```tsx
 * // Basic usage
 * const { data, isLoading, rpcError, refetch } = useRpcQuery(
 *   GoalMapRpc.getGoalMap(goalMapId)
 * );
 *
 * if (isLoading) return <Spinner />;
 * if (rpcError) return <ErrorCard title="Error" description={rpcError} onRetry={refetch} />;
 * if (!data) return null;
 *
 * return <GoalMapEditor data={data} />;
 * ```
 *
 * @example
 * ```tsx
 * // With custom error handling
 * const { data, rpcError } = useRpcQuery(
 *   AssignmentRpc.listAssignments(),
 *   {
 *     showError: true,
 *     errorMessage: "Unable to load assignments",
 *     retryCount: 5,
 *   }
 * );
 * ```
 */
export function useRpcQuery<TData, TQueryKey extends readonly unknown[] = readonly unknown[]>(
	options: UseQueryOptions<TData | RpcErrorResponse, Error, TData | RpcErrorResponse, TQueryKey>,
	config: UseRpcQueryConfig = {},
): UseRpcQueryResult<TData> {
	const {
		showError = true,
		errorMessage,
		retryCount = 3,
		retryDelays = DEFAULT_RETRY_DELAYS,
	} = config;

	// Custom retry logic
	const retry = (failureCount: number, error: Error) => {
		// Don't retry beyond max attempts
		if (failureCount >= retryCount) {
			return false;
		}
		// Only retry for retryable errors
		return isRetryableError(error);
	};

	// Custom retry delay
	const retryDelay = (attemptIndex: number) => {
		return retryDelays[attemptIndex] ?? retryDelays[retryDelays.length - 1] ?? 4000;
	};

	const queryResult = useQuery<
		TData | RpcErrorResponse,
		Error,
		TData | RpcErrorResponse,
		TQueryKey
	>({
		...options,
		retry,
		retryDelay,
	});

	// Extract data and error state
	const { data: rawData } = queryResult;

	const processedResult = useMemo(() => {
		// Check if response is an RPC error
		if (isErrorResponse(rawData)) {
			const errorDetails = getErrorDetails(rawData);
			return {
				data: null as ExtractSuccessData<TData> | null,
				rpcError: showError ? (errorMessage ?? errorDetails.message) : null,
				isRpcError: true,
			};
		}
		// Success case - extract data, filtering out error response type
		const extracted = extractData(rawData);
		return {
			data: extracted as ExtractSuccessData<TData> | null,
			rpcError: null,
			isRpcError: false,
		};
	}, [rawData, showError, errorMessage]);

	// Spread queryResult but override data to avoid type conflicts
	const { data: _rawData, error: _error, ...restQueryResult } = queryResult;

	return {
		...restQueryResult,
		...processedResult,
		queryResult,
	} as UseRpcQueryResult<TData>;
}

/**
 * Configuration options for useRpcMutation.
 */
export type UseRpcMutationConfig = {
	/** Whether to show success toast. Default: false */
	showSuccess?: boolean;
	/** Custom success message */
	successMessage?: string;
	/** Whether to show error toast. Default: true */
	showError?: boolean;
	/** Custom error message */
	errorMessage?: string;
	/** Operation name for error context (e.g., "delete assignment") */
	operation?: string;
	/** Additional error toast options */
	errorToastOptions?: Omit<ErrorToastOptions, "operation">;
	/** Callback when mutation succeeds */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	onSuccess?: (data: any) => void;
};

/**
 * Extended result type for useRpcMutation.
 */
export type UseRpcMutationResult<TData, TVariables> = UseMutationResult<
	TData,
	Error,
	TVariables
> & {
	/** Whether the last mutation resulted in an RPC error */
	isRpcError: boolean;
	/** RPC error message from last mutation (null if no error) */
	rpcError: string | null;
};

/**
 * useRpcMutation - Custom React Query hook for RPC mutations.
 *
 * Automatically handles RPC error responses with toast notifications,
 * provides type-safe data extraction, and optional success toasts.
 *
 * @example
 * ```tsx
 * // Basic usage
 * const mutation = useRpcMutation(
 *   AssignmentRpc.deleteAssignment(),
 *   { operation: "delete assignment" }
 * );
 *
 * <Button onClick={() => mutation.mutate({ id })}>
 *   Delete
 * </Button>
 * ```
 *
 * @example
 * ```tsx
 * // With success toast
 * const mutation = useRpcMutation(
 *   AssignmentRpc.createAssignment(),
 *   {
 *     showSuccess: true,
 *     successMessage: "Assignment created successfully",
 *     operation: "create assignment",
 *   }
 * );
 * ```
 *
 * @example
 * ```tsx
 * // With callbacks
 * const mutation = useRpcMutation(
 *   GoalMapRpc.saveGoalMap(),
 *   {
 *     showSuccess: true,
 *     successMessage: "Goal map saved",
 *   }
 * );
 *
 * mutation.mutate(data, {
 *   onSuccess: (result) => {
 *     // Only called for successful RPC responses
 *     if (!isErrorResponse(result)) {
 *       navigate({ to: "/dashboard" });
 *     }
 *   },
 * });
 * ```
 */
export function useRpcMutation<TData, TVariables, TContext = unknown>(
	options: UseMutationOptions<TData, Error, TVariables, TContext>,
	config: UseRpcMutationConfig = {},
): UseRpcMutationResult<TData, TVariables> {
	const {
		showSuccess = false,
		successMessage,
		showError = true,
		errorMessage,
		operation,
		errorToastOptions,
		onSuccess: configOnSuccess,
	} = config;

	const mutationResult = useMutation<TData, Error, TVariables, TContext>({
		...options,
		onSuccess: (data, variables, onMutateResult, context) => {
			// Check if it's an RPC error response
			if (isErrorResponse(data)) {
				if (showError) {
					toast.error(data, {
						...errorToastOptions,
						operation,
						fallbackMessage: errorMessage,
					});
				}
			} else {
				// Success case
				if (showSuccess) {
					toast.success(successMessage ?? "Operation completed successfully");
				}
				// Call config onSuccess for non-error responses
				configOnSuccess?.(data);
			}

			// Call original onSuccess
			options.onSuccess?.(data, variables, onMutateResult, context);
		},
		onError: (error, variables, onMutateResult, context) => {
			// Handle non-RPC errors (network errors, etc.)
			if (showError) {
				toast.error(error, {
					...errorToastOptions,
					operation,
					fallbackMessage: errorMessage,
				});
			}

			// Call original onError
			options.onError?.(error, variables, onMutateResult, context);
		},
	});

	// Compute RPC error state
	const { data } = mutationResult;
	const isRpcError = isErrorResponse(data);
	const rpcError = isRpcError ? (data as RpcErrorResponse).error : null;

	return {
		...mutationResult,
		isRpcError,
		rpcError,
	} as UseRpcMutationResult<TData, TVariables>;
}
