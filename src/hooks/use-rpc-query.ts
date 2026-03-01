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
 * Extracted RPC result fields shared by query and mutation hooks.
 */
export type RpcExtractedResult<TData> = {
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
 * Extracts data and error info from an RPC result.
 */
function extractRpcResult<TData>(rawData: RpcResult<TData> | undefined): RpcExtractedResult<TData> {
	if (isError(rawData)) {
		const errorDetails = getErrorDetails(rawData);
		return {
			data: undefined,
			rpcError: errorDetails.message,
			rpcErrorCode: rawData.code,
			isRpcError: true,
		};
	}
	return {
		data: unwrap(rawData) ?? undefined,
		rpcError: undefined,
		rpcErrorCode: undefined,
		isRpcError: false,
	};
}
export type UseRpcQueryResult<TData> = Omit<UseQueryResult<RpcResult<TData>, Error>, "data"> &
	RpcExtractedResult<TData>;

/**
 * useRpcQuery - Custom React Query hook for RPC queries.
 *
 * Automatically unwraps RPC result types and provides typed error handling.
 *
 * @example
 * ```tsx
 * const { data, isLoading, rpcError, refetch } = useRpcQuery(GoalMapRpc.getGoalMap(goalMapId));
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
): UseRpcQueryResult<TData> {
	const queryResult = useQuery<RpcResult<TData>, Error, RpcResult<TData>, TQueryKey>({
		...options,
		retry: (failureCount, error) => failureCount < 3 && isRetryableError(error),
		retryDelay: (attemptIndex) => [1000, 2000, 4000][attemptIndex] ?? 4000,
	});

	const { data: rawData, ...restQueryResult } = queryResult;
	const processedResult = extractRpcResult(rawData);

	return {
		...restQueryResult,
		...processedResult,
	} as UseRpcQueryResult<TData>;
}

/**
 * Configuration options for useRpcMutation.
 */
export type UseRpcMutationConfig<TData = unknown> = {
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
	onSuccess?: (data: TData) => void;
};

/**
 * Extended result type for useRpcMutation.
 */
export type UseRpcMutationResult<TData, TVariables> = UseMutationResult<
	RpcResult<TData>,
	Error,
	TVariables
> &
	RpcExtractedResult<TData>;

/**
 * useRpcMutation - Custom React Query hook for RPC mutations.
 *
 * Automatically handles RPC error responses with toast notifications,
 * provides type-safe data extraction, and optional success toasts.
 */
export function useRpcMutation<TData, TVariables, TContext = unknown>(
	options: UseMutationOptions<RpcResult<TData>, Error, TVariables, TContext>,
	config: UseRpcMutationConfig<TData> = {},
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
				const unwrapped = unwrap(data);
				if (unwrapped === null) return;
				configOnSuccess?.(unwrapped);
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

	// Compute RPC error state using shared extraction
	const extracted = extractRpcResult(mutationResult.data);
	return {
		...mutationResult,
		...extracted,
	} as UseRpcMutationResult<TData, TVariables>;
}
