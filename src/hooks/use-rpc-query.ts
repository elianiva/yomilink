import {
	useMutation,
	useQuery,
	type UseMutationOptions,
	type UseMutationResult,
	type UseQueryOptions,
	type UseQueryResult,
} from "@tanstack/react-query";

import { toast, type ErrorToastOptions } from "@/lib/error-toast";
import { getErrorDetails, isRetryableError } from "@/lib/error-types";
import type { RpcResult } from "@/lib/rpc-types";

import { isError, unwrap } from "./use-rpc-error";

export type RpcExtractedResult<TData> = {
	data: TData | undefined;
	rpcError: string | undefined;
	rpcErrorCode: string | undefined;
	isRpcError: boolean;
};

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

export type UseRpcMutationConfig<TData = unknown> = {
	showSuccess?: boolean;
	successMessage?: string;
	showError?: boolean;
	errorMessage?: string;
	operation?: string;
	errorToastOptions?: Omit<ErrorToastOptions, "operation">;
	onSuccess?: (data: TData) => void;
};

export type UseRpcMutationResult<TData, TVariables> = UseMutationResult<
	RpcResult<TData>,
	Error,
	TVariables
> &
	RpcExtractedResult<TData>;

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
			if (isError(data)) {
				if (showError) {
					toast.error(data, {
						...errorToastOptions,
						operation,
						fallbackMessage: errorMessage,
					});
				}
			} else {
				if (showSuccess) {
					toast.success(successMessage ?? "Operation completed successfully");
				}
				const unwrapped = unwrap(data);
				if (unwrapped === null) return;
				configOnSuccess?.(unwrapped);
			}

			options.onSuccess?.(data, variables, onMutateResult, context);
		},
		onError: (error, variables, onMutateResult, context) => {
			if (showError) {
				toast.error(error, {
					...errorToastOptions,
					operation,
					fallbackMessage: errorMessage,
				});
			}

			options.onError?.(error, variables, onMutateResult, context);
		},
	});

	const extracted = extractRpcResult(mutationResult.data);
	return {
		...mutationResult,
		...extracted,
	} as UseRpcMutationResult<TData, TVariables>;
}
