import { Cause, Effect } from "effect";

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
 * Format an error for safe serialization.
 * Handles various error types including Effect errors, exceptions, and arbitrary values.
 */
const formatError = (error: unknown): { message: string; cause?: unknown } => {
	if (error && typeof error === "object" && "_tag" in error) {
		const err = error as { _tag: string; message?: string; cause?: unknown };
		return {
			message: err.message || `${err._tag} error`,
			cause: err.cause !== undefined ? err.cause : error,
		};
	}

	if (error instanceof Error) {
		return {
			message: error.message,
			cause: error.cause ?? error.stack,
		};
	}

	if (typeof error === "string") {
		return { message: error };
	}

	return {
		message: String(error),
		cause: error,
	};
};

/**
 * Log an error with operation context and return a formatted error response.
 * Use this with Effect.catchAll to log AND return errors.
 *
 * @param operationName - The name of the operation for context
 */
export const logAndReturnError =
	(operationName: string) =>
	(error: unknown): Effect.Effect<RpcError> => {
		const formatted = formatError(error);

		return Effect.gen(function* () {
			yield* Effect.logError("RPC operation failed", Cause.fail(error)).pipe(
				Effect.annotateLogs({
					operation: operationName,
					errorTag: (error as { _tag?: string })._tag ?? "Unknown",
					errorMessage: formatted.message,
				}),
			);

			return {
				success: false,
				error: `Internal server error: ${formatted.message}`,
				code: "INTERNAL_ERROR",
			};
		});
	};

/**
 * Log an error with operation context (error-only logging, for use with tapError).
 * Prefer logAndReturnError for catchAll handlers.
 */
export const logRpcError =
	(operationName: string) =>
	<TError>(error: TError) =>
		Effect.logError("RPC operation failed", Cause.fail(error)).pipe(
			Effect.annotateLogs({
				operation: operationName,
				errorTag: (error as { _tag?: string })._tag ?? "Unknown",
			}),
		);

/**
 * Log a defect (unexpected crash) with operation context and return error response.
 * Use this with Effect.catchAllDefect to handle unexpected failures.
 *
 * @param operationName - The name of the operation for context
 */
export const logAndReturnDefect =
	(operationName: string) =>
	(defect: unknown): Effect.Effect<RpcError> => {
		const formatted = formatError(defect);

		return Effect.gen(function* () {
			yield* Effect.logError("RPC operation defect (crash)", Cause.die(defect)).pipe(
				Effect.annotateLogs({
					operation: operationName,
					defectType: typeof defect,
					defectMessage: formatted.message,
				}),
			);

			return {
				success: false,
				error: `Internal server error: ${formatted.message}`,
				code: "INTERNAL_DEFECT",
			};
		});
	};

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
	 * Create a standardized error response with optional cause.
	 * @param error - Human-readable error message
	 * @param code - Optional error code for client-side handling
	 * @param cause - Optional underlying cause (will be serialized)
	 */
	err: (error: string, code?: string, cause?: unknown): Effect.Effect<RpcError> =>
		Effect.succeed({
			success: false,
			error,
			...(code && { code }),
			...(cause !== undefined && { cause }),
		} as const),

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

	/**
	 * Create a "bad request" error response for validation failures.
	 * @param message - Validation error message
	 */
	badRequest: (message: string): Effect.Effect<RpcError> =>
		Effect.succeed({
			success: false,
			error: message,
			code: "BAD_REQUEST",
		} as const),

	/**
	 * Create an "unauthorized" error response.
	 * @param message - Optional custom message
	 */
	unauthorized: (message = "Authentication required"): Effect.Effect<RpcError> =>
		Effect.succeed({
			success: false,
			error: message,
			code: "UNAUTHORIZED",
		} as const),
};
