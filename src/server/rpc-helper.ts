import { Cause, type Data, Effect } from "effect";

/**
 * Standardized RPC success response format.
 */
export type RpcSuccess<T> = {
	readonly success: true;
	readonly data: T;
};

/**
 * Standardized RPC error response format.
 */
export type RpcError = {
	readonly success: false;
	readonly error: string;
	readonly code?: string;
};

/**
 * Standardized RPC response type (success or error).
 */
export type RpcResult<T> = RpcSuccess<T> | RpcError;

/**
 * Log an error with operation context.
 * Use with Effect.tapError for error-only logging.
 */
export const logRpcError =
	(operationName: string) =>
	<TError = typeof Data.TaggedError>(error: TError) =>
		Effect.logError("RPC operation failed", Cause.fail(error)).pipe(
			Effect.annotateLogs({
				operation: operationName,
				errorTag: (error as { _tag?: string })?._tag ?? "Unknown",
			}),
		);

/**
 * Create a standardized success response.
 * @param data - The data to return
 */
export const Rpc = {
	/**
	 * Create a standardized success response (plain value for use with Effect.map).
	 * @param data - The data to return
	 */
	ok: <T>(data: T): RpcSuccess<T> => ({ success: true, data }) as const,

	/**
	 * Create a standardized error response.
	 * @param error - Human-readable error message
	 * @param code - Optional error code for client-side handling
	 */
	err: (error: string, code?: string): Effect.Effect<RpcError> =>
		Effect.succeed({ success: false, error, ...(code && { code }) } as const),

	/**
	 * Create a "not found" error response.
	 * @param resource - Optional resource name (e.g., "User", "Goal map")
	 */
	notFound: (resource = "Resource"): Effect.Effect<RpcError> =>
		Effect.succeed({
			success: false,
			error: `${resource} not found`,
			code: "NOT_FOUND",
		} as const),

	/**
	 * Create a "forbidden" error response.
	 * @param message - Optional custom message
	 */
	forbidden: (message = "Access denied"): Effect.Effect<RpcError> =>
		Effect.succeed({
			success: false,
			error: message,
			code: "FORBIDDEN",
		} as const),
};
