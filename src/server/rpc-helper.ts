import { Cause, Duration, Effect } from "effect";

import type { RpcError, RpcSuccess } from "@/lib/rpc-types";

export const TIMEOUT_DURATION = Duration.seconds(30);

function extractCauseMessage(error: unknown, depth = 0): string {
	if (depth > 5) return "(max depth)";

	const message =
		(error as { message?: string })?.message ??
		(error as { _tag?: string })?._tag ??
		String(error);

	const cause = (error as { cause?: unknown })?.cause;
	if (cause === undefined || cause === null) return message;

	const causeStr = extractCauseMessage(cause, depth + 1);
	if (causeStr === message) return message;
	return `${message}: ${causeStr}`;
}

const formatError = (error: unknown): { message: string; cause?: unknown } => {
	if (error && typeof error === "object" && "_tag" in error) {
		const err = error as { _tag: string; message?: string; cause?: unknown };
		const message = extractCauseMessage(err);
		return {
			message,
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

// For use with tapError, returns Effect<void> instead of error response
export const logRpcError =
	(operationName: string) =>
	<TError>(error: TError) => {
		const formatted = formatError(error);
		return Effect.logError("RPC operation failed", Cause.fail(error)).pipe(
			Effect.annotateLogs({
				operation: operationName,
				errorTag: (error as { _tag?: string })._tag ?? "Unknown",
				errorMessage: formatted.message,
			}),
		);
	};

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

export const Rpc = {
	ok: <T>(data: T): RpcSuccess<T> => ({ success: true, data }) as const,

	err: (error: string, code?: string, cause?: unknown): Effect.Effect<RpcError> =>
		Effect.succeed({
			success: false,
			error,
			...(code && { code }),
			...(cause !== undefined && { cause }),
		} as const),

	notFound: (resource = "Resource"): Effect.Effect<RpcError> =>
		Effect.succeed({
			success: false,
			error: `${resource} not found`,
			code: "NOT_FOUND",
		} as const),

	forbidden: (message = "Access denied"): Effect.Effect<RpcError> =>
		Effect.succeed({
			success: false,
			error: message,
			code: "FORBIDDEN",
		} as const),

	badRequest: (message: string): Effect.Effect<RpcError> =>
		Effect.succeed({
			success: false,
			error: message,
			code: "BAD_REQUEST",
		} as const),

	unauthorized: (message = "Authentication required"): Effect.Effect<RpcError> =>
		Effect.succeed({
			success: false,
			error: message,
			code: "UNAUTHORIZED",
		} as const),
};
