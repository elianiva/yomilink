import { Effect } from "effect";

/**
 * Safely get authenticated user from context
 */
export const requireUser = <T extends { user: { id: string } | null }>(
	context: T,
) => {
	if (!context.user) {
		return Effect.fail(new Error("Unauthorized"));
	}
	return Effect.succeed(context.user);
};

/**
 * Transform Date to timestamp safely
 */
export const toTimestamp = (date: Date | null | undefined): number | null =>
	date?.getTime() ?? null;

/**
 * Create standardized success response
 */
export const successResponse = <T extends Record<string, unknown>>(data: T) =>
	({
		success: true,
		...data,
	}) as const;

/**
 * Create standardized error response
 */
export const errorResponse = (message: string) =>
	({
		success: false,
		error: message,
	}) as const;
