import { Data } from "effect";
import { describe, expect, it } from "vite-plus/test";

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

const taggedError = (tag: string, message?: string) =>
	Data.tagged<{ _tag: string; message?: string }>(tag)({ message });

describe("categorizeError", () => {
	it("should categorize by known tag", () => {
		expect(categorizeError(taggedError("NetworkError"))).toBe("network");
		expect(categorizeError(taggedError("TimeoutError"))).toBe("network");
		expect(categorizeError(taggedError("NotFoundError"))).toBe("not-found");
		expect(categorizeError(taggedError("GoalMapNotFoundError"))).toBe("not-found");
		expect(categorizeError(taggedError("ForbiddenError"))).toBe("forbidden");
		expect(categorizeError(taggedError("ValidationError"))).toBe("validation");
		expect(categorizeError(taggedError("DatabaseError"))).toBe("server");
	});

	it("should categorize by message patterns when tag is unknown", () => {
		expect(categorizeError(taggedError("CustomError", "failed to fetch"))).toBe("network");
		expect(categorizeError(taggedError("CustomError", "not found"))).toBe("not-found");
		expect(categorizeError(taggedError("CustomError", "unauthorized"))).toBe("forbidden");
		expect(categorizeError(taggedError("CustomError", "validation failed"))).toBe("validation");
		expect(categorizeError(taggedError("CustomError", "internal server error"))).toBe("server");
	});

	it("should categorize Error instances by message", () => {
		expect(categorizeError(new Error("Failed to fetch"))).toBe("network");
		expect(categorizeError(new Error("404 not found"))).toBe("not-found");
		expect(categorizeError(new Error("Forbidden"))).toBe("forbidden");
		expect(categorizeError(new Error("Invalid input"))).toBe("validation");
		expect(categorizeError(new Error("500 server error"))).toBe("server");
	});

	it("should categorize plain strings", () => {
		expect(categorizeError("connection timeout")).toBe("network");
		expect(categorizeError("resource missing")).toBe("not-found");
		expect(categorizeError("access denied")).toBe("forbidden");
	});

	it("should categorize by error property in object", () => {
		expect(categorizeError({ error: "NetworkError" })).toBe("network");
	});

	it("should return unknown for unrecognized errors", () => {
		expect(categorizeError({ random: "thing" })).toBe("unknown");
		expect(categorizeError(null)).toBe("unknown");
		expect(categorizeError(42)).toBe("unknown");
	});

	it("should prioritize tag over message when both present", () => {
		expect(categorizeError(taggedError("NetworkError", "everything is fine"))).toBe("network");
		expect(categorizeError(taggedError("ValidationError", "invalid"))).toBe("validation");
	});
});

describe("getErrorDetails", () => {
	it("should return user-friendly message for internal errors", () => {
		const details = getErrorDetails(new Error("Internal server error"));
		expect(details.message).toContain("went wrong on our end");
		expect(details.category).toBe("server");
		expect(details.isRetryable).toBe(true);
		expect(details.showToUser).toBe(true);
	});

	it("should use raw message for non-internal errors", () => {
		const details = getErrorDetails(new Error("Invalid email address"));
		expect(details.message).toBe("Invalid email address");
		expect(details.category).toBe("validation");
		expect(details.isRetryable).toBe(false);
	});

	it("should mark network and server errors as retryable", () => {
		expect(getErrorDetails(new Error("Failed to fetch")).isRetryable).toBe(true);
		expect(getErrorDetails(new Error("500 error")).isRetryable).toBe(true);
		expect(getErrorDetails(new Error("Not found")).isRetryable).toBe(false);
		expect(getErrorDetails(new Error("Forbidden")).isRetryable).toBe(false);
	});

	it("should handle tagged errors", () => {
		const details = getErrorDetails(taggedError("GoalMapNotFoundError"));
		expect(details.category).toBe("not-found");
		expect(details.message).toBe("GoalMapNotFoundError");
	});

	it("should handle string errors", () => {
		const details = getErrorDetails("connection timeout");
		expect(details.category).toBe("network");
	});

	it("should handle unknown error shapes", () => {
		const details = getErrorDetails({ error: "forbidden" });
		expect(details.category).toBe("forbidden");
	});
});

describe("error type guards", () => {
	it("isNetworkError", () => {
		expect(isNetworkError(new Error("Failed to fetch"))).toBe(true);
		expect(isNetworkError(new Error("Not found"))).toBe(false);
		expect(isNetworkError(taggedError("NetworkError"))).toBe(true);
	});

	it("isNotFoundError", () => {
		expect(isNotFoundError(new Error("Not found"))).toBe(true);
		expect(isNotFoundError(new Error("Server error"))).toBe(false);
		expect(isNotFoundError(taggedError("NotFoundError"))).toBe(true);
	});

	it("isForbiddenError", () => {
		expect(isForbiddenError(new Error("Forbidden"))).toBe(true);
		expect(isForbiddenError(new Error("Not found"))).toBe(false);
		expect(isForbiddenError(taggedError("ForbiddenError"))).toBe(true);
	});

	it("isValidationError", () => {
		expect(isValidationError(new Error("Invalid input"))).toBe(true);
		expect(isValidationError(new Error("Not found"))).toBe(false);
		expect(isValidationError(taggedError("ValidationError"))).toBe(true);
	});

	it("isServerError", () => {
		expect(isServerError(new Error("Internal server error"))).toBe(true);
		expect(isServerError(new Error("Not found"))).toBe(false);
		expect(isServerError(taggedError("ServerError"))).toBe(true);
	});

	it("isRetryableError", () => {
		expect(isRetryableError(new Error("Failed to fetch"))).toBe(true);
		expect(isRetryableError(new Error("Internal server error"))).toBe(true);
		expect(isRetryableError(new Error("Not found"))).toBe(false);
		expect(isRetryableError(new Error("Invalid input"))).toBe(false);
	});
});
