import { Cause, type Data, Effect } from "effect";

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
 * Create a standardized error response.
 * Use with Effect.catchTags for type-safe error handling.
 */
export const errorResponse = (error: string) =>
	Effect.succeed({ success: false, error } as const);
