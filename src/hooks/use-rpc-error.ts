/**
 * RPC Error Type Utilities
 *
 * Type-safe utilities for handling the standardized RPC error response format
 * ({ success: false, error: string }) and success format ({ success: true, data: T }).
 * Provides the foundation for consistent error handling across all components.
 */

/**
 * Standardized RPC error response format.
 */
export type RpcError = {
	readonly success: false;
	readonly error: string;
	readonly code?: string;
};

/**
 * Standardized RPC success response format.
 */
export type RpcSuccess<T> = {
	readonly success: true;
	readonly data: T;
};

/**
 * Standardized RPC response type (success or error).
 */
export type RpcResult<T> = RpcSuccess<T> | RpcError;

/**
 * Type guard to check if a response is an error response.
 * Handles undefined, null, and non-object values gracefully.
 *
 * @example
 * ```ts
 * const response = await fetchData();
 * if (isError(response)) {
 *   console.error(response.error);
 *   return;
 * }
 * // response is now narrowed to success type
 * ```
 */
export function isError(response: unknown): response is RpcError {
	if (response === null || response === undefined) {
		return false;
	}
	if (typeof response !== "object") {
		return false;
	}
	const obj = response as Record<string, unknown>;
	return obj.success === false && typeof obj.error === "string";
}

/**
 * Type guard to check if a response is a success response.
 * Handles undefined, null, and non-object values gracefully.
 *
 * @example
 * ```ts
 * const response = await fetchData();
 * if (isSuccess(response)) {
 *   console.log("Got data:", response.data);
 * }
 * ```
 */
export function isSuccess<T>(response: unknown): response is RpcSuccess<T> {
	if (response === null || response === undefined) {
		return false;
	}
	if (typeof response !== "object") {
		return false;
	}
	const obj = response as Record<string, unknown>;
	return obj.success === true && "data" in obj;
}

/**
 * Extracts data from an RPC response, returning null for errors.
 *
 * @example
 * ```ts
 * const response = await fetchGoalMaps();
 * const goalMaps = unwrap(response);
 * if (!goalMaps) {
 *   // Handle error case
 *   return;
 * }
 * // Use goalMaps safely
 * ```
 */
export function unwrap<T>(response: RpcResult<T> | null | undefined): T | null {
	if (response === null || response === undefined) {
		return null;
	}

	if (isError(response)) {
		return null;
	}

	if (isSuccess<T>(response)) {
		return response.data;
	}

	return null;
}

/**
 * Result type for getRpcState function.
 */
export type RpcState<T> = {
	/** Extracted data, undefined if error or loading */
	data: T | undefined;
	/** Error message if response is an error, undefined otherwise */
	error: string | undefined;
	/** Error code if available */
	code: string | undefined;
	/** Whether the response is an error */
	isError: boolean;
	/** Whether the response is successful */
	isSuccess: boolean;
	/** Whether loading (response is null/undefined) */
	isLoading: boolean;
};

/**
 * Extracts both data and error state from an RPC response.
 * Returns a structured object with data, error, and status flags.
 *
 * @example
 * ```ts
 * const response = await fetchAssignments();
 * const { data, error, isError } = getRpcState(response);
 *
 * if (isError) {
 *   showErrorMessage(error);
 *   return;
 * }
 *
 * // Use data safely
 * renderAssignments(data);
 * ```
 */
export function getRpcState<T>(response: RpcResult<T> | null | undefined): RpcState<T> {
	if (response === null || response === undefined) {
		return {
			data: undefined,
			error: undefined,
			code: undefined,
			isError: false,
			isSuccess: false,
			isLoading: true,
		};
	}

	if (isError(response)) {
		return {
			data: undefined,
			error: response.error,
			code: response.code,
			isError: true,
			isSuccess: false,
			isLoading: false,
		};
	}

	const data = unwrap(response);
	return {
		data: data ?? undefined,
		error: undefined,
		code: undefined,
		isError: false,
		isSuccess: true,
		isLoading: false,
	};
}

/**
 * Filters an array response, returning empty array for errors.
 * Common pattern for list endpoints.
 *
 * @example
 * ```ts
 * const response = await fetchAssignments();
 * const assignments = filterArrayResponse(response);
 * // Always returns an array, empty if error
 * ```
 */
export function filterArrayResponse<T>(response: unknown): T[] {
	if (response === null || response === undefined) {
		return [];
	}

	if (isError(response)) {
		return [];
	}

	if (isSuccess<{ items: T[] }>(response) && Array.isArray(response.data.items)) {
		return response.data.items;
	}

	if (isSuccess<T[]>(response) && Array.isArray(response.data)) {
		return response.data;
	}

	if (Array.isArray(response)) {
		return response as T[];
	}

	return [];
}

// Re-export for backward compatibility with old naming
export type {
	RpcError as RpcErrorResponse,
	RpcSuccess as RpcSuccessResponse,
	RpcResult as RpcResponse,
};
