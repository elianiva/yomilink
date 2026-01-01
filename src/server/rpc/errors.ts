import { Data } from "effect";

/**
 * Resource not found errors - used when a database lookup returns null/undefined.
 */
export class NotFoundError extends Data.TaggedError("NotFoundError")<{
	readonly resource: string;
	readonly id: string;
}> {}

/**
 * Input validation failures - used for schema/business rule validation.
 */
export class ValidationError extends Data.TaggedError("ValidationError")<{
	readonly message: string;
	readonly field?: string;
}> {}

/**
 * Missing authentication context - user not logged in.
 */
export class UnauthorizedError extends Data.TaggedError("UnauthorizedError")<{
	readonly message: string;
}> {}
