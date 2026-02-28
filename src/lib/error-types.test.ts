import { describe, expect, it } from "vitest";

import {
	categorizeError,
	getErrorDetails,
	isForbiddenError,
	isNetworkError,
	isNotFoundError,
	isRetryableError,
	isServerError,
	isValidationError,
} from "./error-types";

describe("categorizeError", () => {
	describe("Effect.js tagged errors", () => {
		it("categorizes ForbiddenError tag", () => {
			expect(categorizeError({ _tag: "ForbiddenError" })).toBe("forbidden");
		});

		it("categorizes GoalMapNotFoundError tag", () => {
			expect(categorizeError({ _tag: "GoalMapNotFoundError" })).toBe("not-found");
		});

		it("categorizes AssignmentNotFoundError tag", () => {
			expect(categorizeError({ _tag: "AssignmentNotFoundError" })).toBe("not-found");
		});

		it("categorizes KitNotFoundError tag", () => {
			expect(categorizeError({ _tag: "KitNotFoundError" })).toBe("not-found");
		});

		it("categorizes NetworkError tag", () => {
			expect(categorizeError({ _tag: "NetworkError" })).toBe("network");
		});

		it("categorizes TimeoutError tag", () => {
			expect(categorizeError({ _tag: "TimeoutError" })).toBe("network");
		});

		it("categorizes ValidationError tag", () => {
			expect(categorizeError({ _tag: "ValidationError" })).toBe("validation");
		});

		it("categorizes ParseError tag", () => {
			expect(categorizeError({ _tag: "ParseError" })).toBe("validation");
		});

		it("categorizes ServerError tag", () => {
			expect(categorizeError({ _tag: "ServerError" })).toBe("server");
		});

		it("categorizes DatabaseError tag", () => {
			expect(categorizeError({ _tag: "DatabaseError" })).toBe("server");
		});

		it("falls back to message analysis for unknown tags", () => {
			expect(categorizeError({ _tag: "CustomError", message: "Network failed" })).toBe(
				"network",
			);
		});

		it("uses tag as message if message is missing", () => {
			expect(categorizeError({ _tag: "NotFoundError" })).toBe("not-found");
		});
	});

	describe("standard Error objects", () => {
		it("categorizes network errors by message", () => {
			expect(categorizeError(new Error("Failed to fetch"))).toBe("network");
			expect(categorizeError(new Error("Network request failed"))).toBe("network");
			expect(categorizeError(new Error("Connection timeout"))).toBe("network");
			expect(categorizeError(new Error("ECONNREFUSED"))).toBe("network");
		});

		it("categorizes not-found errors by message", () => {
			expect(categorizeError(new Error("Resource not found"))).toBe("not-found");
			expect(categorizeError(new Error("404 Page does not exist"))).toBe("not-found");
		});

		it("categorizes forbidden errors by message", () => {
			expect(categorizeError(new Error("Access forbidden"))).toBe("forbidden");
			expect(categorizeError(new Error("401 Unauthorized"))).toBe("forbidden");
			expect(categorizeError(new Error("Permission denied"))).toBe("forbidden");
		});

		it("categorizes validation errors by message", () => {
			expect(categorizeError(new Error("Validation failed"))).toBe("validation");
			expect(categorizeError(new Error("Invalid email format"))).toBe("validation");
			expect(categorizeError(new Error("Field is required"))).toBe("validation");
		});

		it("categorizes server errors by message", () => {
			expect(categorizeError(new Error("Internal server error"))).toBe("server");
			expect(categorizeError(new Error("500 Server error"))).toBe("server");
			expect(categorizeError(new Error("502 Bad Gateway"))).toBe("server");
		});

		it("returns unknown for unrecognized messages", () => {
			expect(categorizeError(new Error("Something went wrong"))).toBe("unknown");
		});
	});

	describe("string errors", () => {
		it("categorizes string errors by content", () => {
			expect(categorizeError("Network error")).toBe("network");
			expect(categorizeError("Not found")).toBe("not-found");
			expect(categorizeError("Forbidden")).toBe("forbidden");
			expect(categorizeError("Invalid input")).toBe("validation");
			expect(categorizeError("Internal server error")).toBe("server");
		});
	});

	describe("RPC error response objects", () => {
		it("categorizes RPC error responses", () => {
			expect(categorizeError({ success: false, error: "Network unavailable" })).toBe(
				"network",
			);
			expect(categorizeError({ success: false, error: "Goal map not found" })).toBe(
				"not-found",
			);
			expect(categorizeError({ success: false, error: "Access forbidden" })).toBe(
				"forbidden",
			);
		});
	});

	describe("edge cases", () => {
		it("returns unknown for null", () => {
			expect(categorizeError(null)).toBe("unknown");
		});

		it("returns unknown for undefined", () => {
			expect(categorizeError(undefined)).toBe("unknown");
		});

		it("returns unknown for numbers", () => {
			expect(categorizeError(123)).toBe("unknown");
		});

		it("returns unknown for booleans", () => {
			expect(categorizeError(true)).toBe("unknown");
		});

		it("returns unknown for objects without error field", () => {
			expect(categorizeError({ data: "test" })).toBe("unknown");
		});
	});
});

describe("getErrorDetails", () => {
	it("returns correct details for network errors", () => {
		const details = getErrorDetails(new Error("Failed to fetch"));
		expect(details.category).toBe("network");
		expect(details.message).toBe("Failed to fetch");
		expect(details.isRetryable).toBe(true);
		expect(details.showToUser).toBe(true);
	});

	it("returns correct details for not-found errors", () => {
		const details = getErrorDetails({ _tag: "GoalMapNotFoundError" });
		expect(details.category).toBe("not-found");
		expect(details.isRetryable).toBe(false);
		expect(details.showToUser).toBe(true);
	});

	it("returns correct details for forbidden errors", () => {
		const details = getErrorDetails({
			_tag: "ForbiddenError",
			message: "Access denied",
		});
		expect(details.category).toBe("forbidden");
		expect(details.message).toBe("Access denied");
		expect(details.isRetryable).toBe(false);
		expect(details.showToUser).toBe(true);
	});

	it("returns correct details for validation errors", () => {
		const details = getErrorDetails(new Error("Invalid email format"));
		expect(details.category).toBe("validation");
		expect(details.isRetryable).toBe(false);
		expect(details.showToUser).toBe(true);
	});

	it("returns correct details for server errors", () => {
		const details = getErrorDetails(new Error("Internal server error"));
		expect(details.category).toBe("server");
		expect(details.isRetryable).toBe(true);
		expect(details.showToUser).toBe(true);
	});

	it("uses default message for generic internal errors", () => {
		// The original message is kept unless it contains "internal" or is the default
		const details = getErrorDetails(new Error("Internal database issue"));
		expect(details.message).toBe("An unexpected error occurred. Please try again.");
	});

	it("preserves specific error messages for non-internal errors", () => {
		// Non-internal messages are preserved
		const details = getErrorDetails(new Error("Something went wrong"));
		expect(details.message).toBe("Something went wrong");
	});

	it("preserves originalError reference", () => {
		const error = new Error("Test error");
		const details = getErrorDetails(error);
		expect(details.originalError).toBe(error);
	});

	it("handles unknown errors with default message", () => {
		const details = getErrorDetails({ randomField: "value" });
		expect(details.category).toBe("unknown");
		expect(details.message).toBe("An unexpected error occurred. Please try again.");
	});
});

describe("type guard functions", () => {
	describe("isNetworkError", () => {
		it("returns true for network errors", () => {
			expect(isNetworkError(new Error("Network failed"))).toBe(true);
			expect(isNetworkError({ _tag: "NetworkError" })).toBe(true);
		});

		it("returns false for non-network errors", () => {
			expect(isNetworkError(new Error("Not found"))).toBe(false);
		});
	});

	describe("isNotFoundError", () => {
		it("returns true for not-found errors", () => {
			expect(isNotFoundError(new Error("Resource not found"))).toBe(true);
			expect(isNotFoundError({ _tag: "GoalMapNotFoundError" })).toBe(true);
		});

		it("returns false for non-not-found errors", () => {
			expect(isNotFoundError(new Error("Network failed"))).toBe(false);
		});
	});

	describe("isForbiddenError", () => {
		it("returns true for forbidden errors", () => {
			expect(isForbiddenError(new Error("Access forbidden"))).toBe(true);
			expect(isForbiddenError({ _tag: "ForbiddenError" })).toBe(true);
		});

		it("returns false for non-forbidden errors", () => {
			expect(isForbiddenError(new Error("Not found"))).toBe(false);
		});
	});

	describe("isValidationError", () => {
		it("returns true for validation errors", () => {
			expect(isValidationError(new Error("Invalid input"))).toBe(true);
			expect(isValidationError({ _tag: "ValidationError" })).toBe(true);
		});

		it("returns false for non-validation errors", () => {
			expect(isValidationError(new Error("Not found"))).toBe(false);
		});
	});

	describe("isServerError", () => {
		it("returns true for server errors", () => {
			expect(isServerError(new Error("Internal server error"))).toBe(true);
			expect(isServerError({ _tag: "ServerError" })).toBe(true);
		});

		it("returns false for non-server errors", () => {
			expect(isServerError(new Error("Not found"))).toBe(false);
		});
	});

	describe("isRetryableError", () => {
		it("returns true for network errors", () => {
			expect(isRetryableError(new Error("Network failed"))).toBe(true);
		});

		it("returns true for server errors", () => {
			expect(isRetryableError(new Error("Internal server error"))).toBe(true);
		});

		it("returns false for not-found errors", () => {
			expect(isRetryableError(new Error("Not found"))).toBe(false);
		});

		it("returns false for forbidden errors", () => {
			expect(isRetryableError(new Error("Forbidden"))).toBe(false);
		});

		it("returns false for validation errors", () => {
			expect(isRetryableError(new Error("Invalid input"))).toBe(false);
		});
	});
});
