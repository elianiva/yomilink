/**
 * Error Classification & Types System
 *
 * Defines error categories and provides utility functions for classifying errors
 * with appropriate handling strategies. Handles Effect.js errors, RPC errors,
 * and generic Error objects.
 */

/**
 * Error categories for classification and handling.
 */
export type ErrorCategory =
	| "network"
	| "not-found"
	| "forbidden"
	| "validation"
	| "server"
	| "unknown";

/**
 * Detailed error information for handling decisions.
 */
export type ErrorDetails = {
	/** Error category for handling strategy */
	readonly category: ErrorCategory;
	/** User-friendly error message */
	readonly message: string;
	/** Whether the error should trigger automatic retry */
	readonly isRetryable: boolean;
	/** Whether the error should be displayed to users */
	readonly showToUser: boolean;
	/** Original error for debugging */
	readonly originalError: unknown;
};

/**
 * Effect.js tagged error shape.
 */
type TaggedError = {
	readonly _tag: string;
	readonly message?: string;
};

/**
 * Type guard for Effect.js TaggedError.
 */
function isTaggedError(error: unknown): error is TaggedError {
	return (
		typeof error === "object" &&
		error !== null &&
		"_tag" in error &&
		typeof (error as TaggedError)._tag === "string"
	);
}

/**
 * Type guard for standard Error objects.
 */
function isError(error: unknown): error is Error {
	return error instanceof Error;
}

/**
 * Common network error patterns to detect connectivity issues.
 */
const NETWORK_ERROR_PATTERNS = [
	"network",
	"fetch",
	"failed to fetch",
	"networkerror",
	"connection",
	"timeout",
	"econnrefused",
	"enotfound",
	"cors",
	"abort",
	"offline",
] as const;

/**
 * Common not-found error patterns.
 */
const NOT_FOUND_PATTERNS = ["not found", "notfound", "404", "does not exist", "missing"] as const;

/**
 * Common forbidden/unauthorized error patterns.
 */
const FORBIDDEN_PATTERNS = [
	"forbidden",
	"unauthorized",
	"401",
	"403",
	"permission",
	"access denied",
	"not allowed",
] as const;

/**
 * Common validation error patterns.
 */
const VALIDATION_PATTERNS = [
	"validation",
	"invalid",
	"required",
	"must be",
	"cannot be",
	"expected",
	"parse",
	"decode",
] as const;

/**
 * Common server error patterns.
 */
const SERVER_ERROR_PATTERNS = [
	"internal server",
	"500",
	"502",
	"503",
	"504",
	"server error",
] as const;

/**
 * Checks if a message matches any of the given patterns.
 */
function matchesPatterns(message: string, patterns: readonly string[]): boolean {
	const lowerMessage = message.toLowerCase();
	return patterns.some((pattern) => lowerMessage.includes(pattern));
}

/**
 * Maps Effect.js error tags to categories.
 */
const TAG_TO_CATEGORY: Record<string, ErrorCategory> = {
	// Network-related tags
	NetworkError: "network",
	TimeoutError: "network",
	ConnectionError: "network",

	// Not found tags
	NotFoundError: "not-found",
	GoalMapNotFoundError: "not-found",
	AssignmentNotFoundError: "not-found",
	KitNotFoundError: "not-found",
	UserNotFoundError: "not-found",
	ResourceNotFoundError: "not-found",

	// Forbidden tags
	ForbiddenError: "forbidden",
	UnauthorizedError: "forbidden",
	AuthenticationError: "forbidden",
	PermissionError: "forbidden",

	// Validation tags
	ValidationError: "validation",
	ParseError: "validation",
	DecodeError: "validation",
	SchemaError: "validation",

	// Server tags
	ServerError: "server",
	InternalError: "server",
	DatabaseError: "server",
};

/**
 * Categorizes an error based on its type and message.
 *
 * @example
 * ```ts
 * const category = categorizeError(new Error("Network request failed"));
 * // Returns: "network"
 *
 * const category = categorizeError({ _tag: "ForbiddenError", message: "Access denied" });
 * // Returns: "forbidden"
 * ```
 */
export function categorizeError(error: unknown): ErrorCategory {
	// Handle Effect.js tagged errors
	if (isTaggedError(error)) {
		const tagCategory = TAG_TO_CATEGORY[error._tag];
		if (tagCategory) {
			return tagCategory;
		}

		// Fall back to message analysis if tag not recognized
		const message = error.message || error._tag;
		return categorizeByMessage(message);
	}

	// Handle standard Error objects
	if (isError(error)) {
		return categorizeByMessage(error.message);
	}

	// Handle string errors
	if (typeof error === "string") {
		return categorizeByMessage(error);
	}

	// Handle RPC error response objects
	if (
		typeof error === "object" &&
		error !== null &&
		"error" in error &&
		typeof (error as { error: string }).error === "string"
	) {
		return categorizeByMessage((error as { error: string }).error);
	}

	return "unknown";
}

/**
 * Categorizes an error based on message content.
 */
function categorizeByMessage(message: string): ErrorCategory {
	if (matchesPatterns(message, NETWORK_ERROR_PATTERNS)) {
		return "network";
	}
	if (matchesPatterns(message, NOT_FOUND_PATTERNS)) {
		return "not-found";
	}
	if (matchesPatterns(message, FORBIDDEN_PATTERNS)) {
		return "forbidden";
	}
	if (matchesPatterns(message, VALIDATION_PATTERNS)) {
		return "validation";
	}
	if (matchesPatterns(message, SERVER_ERROR_PATTERNS)) {
		return "server";
	}
	return "unknown";
}

/**
 * Default user-friendly messages by category.
 */
const DEFAULT_MESSAGES: Record<ErrorCategory, string> = {
	network: "Unable to connect. Please check your internet connection and try again.",
	"not-found": "The requested resource could not be found.",
	forbidden: "You don't have permission to perform this action.",
	validation: "The provided data is invalid. Please check your input.",
	server: "Something went wrong on our end. Please try again later.",
	unknown: "An unexpected error occurred. Please try again.",
};

/**
 * Determines if an error category is retryable.
 */
function isRetryableCategory(category: ErrorCategory): boolean {
	// Only network and server errors are automatically retryable
	return category === "network" || category === "server";
}

/**
 * Determines if an error category should be shown to users.
 */
function shouldShowToUser(_category: ErrorCategory): boolean {
	// All categories should be shown to users
	return true;
}

/**
 * Extracts the error message from various error types.
 */
function extractMessage(error: unknown): string {
	if (isTaggedError(error)) {
		return error.message || error._tag;
	}
	if (isError(error)) {
		return error.message;
	}
	if (typeof error === "string") {
		return error;
	}
	if (
		typeof error === "object" &&
		error !== null &&
		"error" in error &&
		typeof (error as { error: string }).error === "string"
	) {
		return (error as { error: string }).error;
	}
	return "An unknown error occurred";
}

/**
 * Gets detailed error information for handling decisions.
 *
 * @example
 * ```ts
 * const details = getErrorDetails(error);
 * if (details.isRetryable) {
 *   // Auto-retry the operation
 * }
 * if (details.showToUser) {
 *   showToast(details.message);
 * }
 * ```
 */
export function getErrorDetails(error: unknown): ErrorDetails {
	const category = categorizeError(error);
	const rawMessage = extractMessage(error);

	// Use default message for unknown errors or internal error details
	const isInternalMessage =
		rawMessage.toLowerCase().includes("internal") || rawMessage === "An unknown error occurred";

	const message = isInternalMessage ? DEFAULT_MESSAGES[category] : rawMessage;

	return {
		category,
		message,
		isRetryable: isRetryableCategory(category),
		showToUser: shouldShowToUser(category),
		originalError: error,
	};
}

/**
 * Type guard for network errors.
 */
export function isNetworkError(error: unknown): boolean {
	return categorizeError(error) === "network";
}

/**
 * Type guard for not-found errors.
 */
export function isNotFoundError(error: unknown): boolean {
	return categorizeError(error) === "not-found";
}

/**
 * Type guard for forbidden errors.
 */
export function isForbiddenError(error: unknown): boolean {
	return categorizeError(error) === "forbidden";
}

/**
 * Type guard for validation errors.
 */
export function isValidationError(error: unknown): boolean {
	return categorizeError(error) === "validation";
}

/**
 * Type guard for server errors.
 */
export function isServerError(error: unknown): boolean {
	return categorizeError(error) === "server";
}

/**
 * Type guard for retryable errors.
 */
export function isRetryableError(error: unknown): boolean {
	return getErrorDetails(error).isRetryable;
}
