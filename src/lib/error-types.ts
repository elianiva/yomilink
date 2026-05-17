export type ErrorCategory =
	| "network"
	| "not-found"
	| "forbidden"
	| "validation"
	| "server"
	| "unknown";

export type ErrorDetails = {
	readonly category: ErrorCategory;
	readonly message: string;
	readonly isRetryable: boolean;
	readonly showToUser: boolean;
	readonly originalError: unknown;
};

type TaggedError = {
	readonly _tag: string;
	readonly message?: string;
};

function isTaggedError(error: unknown): error is TaggedError {
	return (
		typeof error === "object" &&
		error !== null &&
		"_tag" in error &&
		typeof (error as TaggedError)._tag === "string"
	);
}

function isError(error: unknown): error is Error {
	return error instanceof Error;
}

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

const NOT_FOUND_PATTERNS = ["not found", "notfound", "404", "does not exist", "missing"] as const;

const FORBIDDEN_PATTERNS = [
	"forbidden",
	"unauthorized",
	"401",
	"403",
	"permission",
	"access denied",
	"not allowed",
] as const;

const SERVER_ERROR_PATTERNS = [
	"internal server",
	"500",
	"502",
	"503",
	"504",
	"server error",
] as const;

const VALIDATION_PATTERNS = [
	"validation",
	"invalid",
	"required",
	"must be",
	"cannot be",
	"expected",
] as const;

function matchesPatterns(message: string, patterns: readonly string[]): boolean {
	const lowerMessage = message.toLowerCase();
	return patterns.some((pattern) => lowerMessage.includes(pattern));
}

const TAG_TO_CATEGORY: Record<string, ErrorCategory> = {
	NetworkError: "network",
	TimeoutError: "network",
	ConnectionError: "network",

	NotFoundError: "not-found",
	GoalMapNotFoundError: "not-found",
	AssignmentNotFoundError: "not-found",
	KitNotFoundError: "not-found",
	UserNotFoundError: "not-found",
	ResourceNotFoundError: "not-found",

	ForbiddenError: "forbidden",
	UnauthorizedError: "forbidden",
	AuthenticationError: "forbidden",
	PermissionError: "forbidden",

	ValidationError: "validation",
	ParseError: "validation",
	DecodeError: "validation",
	SchemaError: "validation",

	ServerError: "server",
	InternalError: "server",
	DatabaseError: "server",
};

export function categorizeError(error: unknown): ErrorCategory {
	if (isTaggedError(error)) {
		const tagCategory = TAG_TO_CATEGORY[error._tag];
		if (tagCategory) {
			return tagCategory;
		}

		const message = error.message || error._tag;
		return categorizeByMessage(message);
	}

	if (isError(error)) {
		return categorizeByMessage(error.message);
	}

	if (typeof error === "string") {
		return categorizeByMessage(error);
	}

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
	if (matchesPatterns(message, SERVER_ERROR_PATTERNS)) {
		return "server";
	}
	if (matchesPatterns(message, VALIDATION_PATTERNS)) {
		return "validation";
	}
	return "unknown";
}

const DEFAULT_MESSAGES: Record<ErrorCategory, string> = {
	network: "Unable to connect. Please check your internet connection and try again.",
	"not-found": "The requested resource could not be found.",
	forbidden: "You don't have permission to perform this action.",
	validation: "The provided data is invalid. Please check your input.",
	server: "Something went wrong on our end. Please try again later.",
	unknown: "An unexpected error occurred. Please try again.",
};

// Only network and server errors are automatically retryable
function isRetryableCategory(category: ErrorCategory): boolean {
	return category === "network" || category === "server";
}

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

export function getErrorDetails(error: unknown): ErrorDetails {
	const category = categorizeError(error);
	const rawMessage = extractMessage(error);

	const isInternalMessage =
		rawMessage.toLowerCase().includes("internal") || rawMessage === "An unknown error occurred";

	const message = isInternalMessage ? DEFAULT_MESSAGES[category] : rawMessage;

	return {
		category,
		message,
		isRetryable: isRetryableCategory(category),
		showToUser: true,
		originalError: error,
	};
}

export function isNetworkError(error: unknown): boolean {
	return categorizeError(error) === "network";
}

export function isNotFoundError(error: unknown): boolean {
	return categorizeError(error) === "not-found";
}

export function isForbiddenError(error: unknown): boolean {
	return categorizeError(error) === "forbidden";
}

export function isValidationError(error: unknown): boolean {
	return categorizeError(error) === "validation";
}

export function isServerError(error: unknown): boolean {
	return categorizeError(error) === "server";
}

export function isRetryableError(error: unknown): boolean {
	return getErrorDetails(error).isRetryable;
}
