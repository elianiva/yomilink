import { Effect } from "effect";
import type {
	NotFoundError,
	UnauthorizedError,
	ValidationError,
} from "./errors";

/**
 * Standard error response type for RPC handlers.
 */
export type RpcErrorResponse = {
	readonly success: false;
	readonly error: string;
};

/**
 * Log an error with operation context.
 * Use with Effect.tapError for error-only logging.
 */
export const logRpcError = (operationName: string) => (error: unknown) =>
	Effect.logError("RPC operation failed").pipe(
		Effect.annotateLogs({
			operation: operationName,
			errorTag: (error as { _tag?: string })?._tag ?? "Unknown",
		}),
	);

/**
 * Standard error responses for common error types.
 */
export const rpcErrorResponses = {
	NotFoundError: (e: NotFoundError) =>
		Effect.succeed({
			success: false,
			error: `${e.resource} not found`,
		} as const),
	ValidationError: (e: ValidationError) =>
		Effect.succeed({ success: false, error: e.message } as const),
	UnauthorizedError: (e: UnauthorizedError) =>
		Effect.succeed({ success: false, error: e.message } as const),
	ForbiddenError: (e: { message: string }) =>
		Effect.succeed({ success: false, error: e.message } as const),
	SqlError: () =>
		Effect.succeed({
			success: false,
			error: "Database operation failed",
		} as const),
	ParseError: () =>
		Effect.succeed({
			success: false,
			error: "Invalid data format",
		} as const),
} as const;

/**
 * Fallback handler for any unexpected errors.
 */
export const unexpectedError = () =>
	Effect.succeed({
		success: false,
		error: "An unexpected error occurred",
	} as const);
