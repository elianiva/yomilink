/**
 * RPC Error Type Utilities
 *
 * Type-safe utilities for handling the standardized RPC error response format
 * ({ success: false, error: string }). Provides the foundation for consistent
 * error handling across all components.
 */

/**
 * Standardized RPC error response format.
 */
export type RpcErrorResponse = {
	readonly success: false;
	readonly error: string;
};

/**
 * Standardized RPC success response format.
 * The data can be any shape, typically an object with additional fields.
 */
export type RpcSuccessResponse<T = unknown> = {
	readonly success: true;
} & T;

/**
 * Union type representing any RPC response.
 */
export type RpcResponse<T = unknown> = RpcErrorResponse | RpcSuccessResponse<T>;

/**
 * Type guard to check if a response is an error response.
 * Handles undefined, null, and non-object values gracefully.
 *
 * @example
 * ```ts
 * const response = await fetchData();
 * if (isErrorResponse(response)) {
 *   console.error(response.error);
 *   return;
 * }
 * // response is now narrowed to success type
 * ```
 */
export function isErrorResponse(
	response: unknown,
): response is RpcErrorResponse {
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
 *   console.log("Got data:", response);
 * }
 * ```
 */
export function isSuccess<T>(
	response: unknown,
): response is RpcSuccessResponse<T> {
	if (response === null || response === undefined) {
		return false;
	}
	if (typeof response !== "object") {
		return false;
	}
	const obj = response as Record<string, unknown>;
	return obj.success === true;
}

/**
 * Extracts data from an RPC response, returning null for errors.
 * Useful for simple cases where you just want the data or nothing.
 *
 * @example
 * ```ts
 * const response = await fetchGoalMaps();
 * const goalMaps = extractData(response);
 * if (!goalMaps) {
 *   // Handle error case
 *   return;
 * }
 * // Use goalMaps safely
 * ```
 */
export function extractData<T>(
	response: RpcResponse<T> | T | null | undefined,
): T | null {
	if (response === null || response === undefined) {
		return null;
	}

	// Check if it's an error response
	if (isErrorResponse(response)) {
		return null;
	}

	// Check if it's a success response with explicit success: true
	if (isSuccess<T>(response)) {
		// Return the response without the success field
		// biome-ignore lint/suspicious/noExplicitAny: need to extract success from response
		const { success: _, ...data } = response as any;
		return data as T;
	}

	// If response doesn't have success field at all (raw data like arrays)
	return response as T;
}

/**
 * Result type for useRpcErrorState hook.
 */
export type RpcErrorState<T> = {
	/** Extracted data, null if error or undefined */
	data: T | null;
	/** Error message if response is an error, null otherwise */
	error: string | null;
	/** Whether the response is an error */
	isError: boolean;
	/** Whether the response is successful */
	isSuccess: boolean;
};

/**
 * Extracts both data and error state from an RPC response.
 * Returns a structured object with data, error, and status flags.
 *
 * @example
 * ```ts
 * const response = await fetchAssignments();
 * const { data, error, isError } = getRpcErrorState(response);
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
export function getRpcErrorState<T>(
	response: RpcResponse<T> | T | null | undefined,
): RpcErrorState<T> {
	if (response === null || response === undefined) {
		return {
			data: null,
			error: null,
			isError: false,
			isSuccess: false,
		};
	}

	if (isErrorResponse(response)) {
		return {
			data: null,
			error: response.error,
			isError: true,
			isSuccess: false,
		};
	}

	const data = extractData<T>(response);
	return {
		data,
		error: null,
		isError: false,
		isSuccess: true,
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

	if (isErrorResponse(response)) {
		return [];
	}

	if (Array.isArray(response)) {
		return response;
	}

	// Handle success response wrapper with items field
	if (typeof response === "object" && response !== null) {
		const obj = response as Record<string, unknown>;
		if (obj.success === true && Array.isArray(obj.items)) {
			return obj.items as T[];
		}
	}

	return [];
}
