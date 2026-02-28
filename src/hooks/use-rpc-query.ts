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

import { isError, type RpcResult, unwrap } from "./use-rpc-error";

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
 * Extended result type for useRpcQuery.
 */
export type UseRpcQueryResult<TData> = Omit<
	UseQueryResult<RpcResult<TData>, Error>,
	"data"
> & {
	/** Extracted data (undefined if loading or error) */
	data: TData | undefined;
	/** RPC error message (undefined if no error) */
	rpcError: string | undefined;
	/** Error code if available */
	rpcErrorCode: string | undefined;
	/** Whether the response is an RPC error */
	isRpcError: boolean;
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
 */
export function useRpcQuery<TData, TQueryKey extends readonly unknown[] = readonly unknown[]>(
	options: UseQueryOptions<RpcResult<TData>, Error, RpcResult<TData>, TQueryKey>,
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

	const queryResult = useQuery<RpcResult<TData>, Error, RpcResult<TData>, TQueryKey>({
		...options,
		retry,
		retryDelay,
	});

	// Extract data and error state
	const { data: rawData } = queryResult;

	const processedResult = useMemo(() => {
		// Check if response is an RPC error
		if (isError(rawData)) {
			const errorDetails = getErrorDetails(rawData);
			return {
				data: undefined,
				rpcError: showError ? (errorMessage ?? errorDetails.message) : undefined,
				rpcErrorCode: rawData.code,
				isRpcError: true,
			};
		}
		// Success case - extract data
		const extracted = unwrap(rawData);
		return {
			data: extracted ?? undefined,
			rpcError: undefined,
			rpcErrorCode: undefined,
			isRpcError: false,
		};
	}, [rawData, showError, errorMessage]);

	// Spread queryResult but override data to avoid type conflicts
	const { data: _rawData, ...restQueryResult } = queryResult;

	return {
		...restQueryResult,
		...processedResult,
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
	onSuccess?: (data: unknown) => void;
};

/**
 * Extended result type for useRpcMutation.
 */
export type UseRpcMutationResult<TData, TVariables> = UseMutationResult<
	RpcResult<TData>,
	Error,
	TVariables
> & {
	/** Whether the last mutation resulted in an RPC error */
	isRpcError: boolean;
	/** RPC error message from last mutation (undefined if no error) */
	rpcError: string | undefined;
	/** Error code if available */
	rpcErrorCode: string | undefined;
	/** Extracted data from last mutation */
	data: TData | undefined;
};

/**
 * useRpcMutation - Custom React Query hook for RPC mutations.
 *
 * Automatically handles RPC error responses with toast notifications,
 * provides type-safe data extraction, and optional success toasts.
 */
export function useRpcMutation<TData, TVariables, TContext = unknown>(
	options: UseMutationOptions<RpcResult<TData>, Error, TVariables, TContext>,
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

	const mutationResult = useMutation<RpcResult<TData>, Error, TVariables, TContext>({
		...options,
		onSuccess: (data, variables, onMutateResult, context) => {
			// Check if it's an RPC error response
			if (isError(data)) {
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
				configOnSuccess?.(unwrap(data));
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
	const rpcErrorData = isError(data) ? data : undefined;
	const extractedData = data ? unwrap(data) : undefined;

	return {
		...mutationResult,
		data: extractedData ?? undefined,
		isRpcError: !!rpcErrorData,
		rpcError: rpcErrorData?.error,
		rpcErrorCode: rpcErrorData?.code,
	} as UseRpcMutationResult<TData, TVariables>;
}
