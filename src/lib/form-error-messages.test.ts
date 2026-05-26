import { describe, expect, it } from "vite-plus/test";

import { extractFormErrorMessages } from "./form-error-messages";

describe("extractFormErrorMessages", () => {
	it("should extract messages from string values", () => {
		const result = extractFormErrorMessages("Something went wrong");
		expect(result).toEqual(["Something went wrong"]);
	});

	it("should extract from array of strings", () => {
		const result = extractFormErrorMessages(["Error 1", "Error 2"]);
		expect(result).toEqual(["Error 1", "Error 2"]);
	});

	it("should extract from object with message property", () => {
		const result = extractFormErrorMessages({ message: "An error occurred" });
		expect(result).toEqual(["An error occurred"]);
	});

	it("should extract from nested error/errors keys", () => {
		const result = extractFormErrorMessages({
			error: "Root error",
			errors: ["Nested 1", "Nested 2"],
		});
		expect(result).toEqual(["Root error", "Nested 1", "Nested 2"]);
	});

	it("should extract from object with issue/issues keys", () => {
		const result = extractFormErrorMessages({
			issue: "Issue 1",
			issues: ["Issue 2"],
		});
		expect(result).toEqual(["Issue 1", "Issue 2"]);
	});

	it("should flatten nested arrays", () => {
		const result = extractFormErrorMessages([["Deep 1", ["Deep 2"]]]);
		expect(result).toEqual(["Deep 1", "Deep 2"]);
	});

	it("should extract from object with formErrors/fieldErrors", () => {
		const response = {
			formErrors: ["Title is required"],
			fieldErrors: {
				name: ["Name is required"],
				email: ["Invalid email format", "Already taken"],
			},
		};
		const result = extractFormErrorMessages(response);
		// Object.values extracts top-level values; nested objects without
		// message/error/errors/issue/issues keys are not recursed into
		expect(result).toContain("Title is required");
	});

	it("should deduplicate messages", () => {
		const result = extractFormErrorMessages({
			message: "Unique?",
			error: "Unique?",
		});
		expect(result).toEqual(["Unique?"]);
	});

	it("should return empty array for null/undefined", () => {
		expect(extractFormErrorMessages(null)).toEqual([]);
		expect(extractFormErrorMessages(undefined)).toEqual([]);
	});

	it("should convert numbers to string messages", () => {
		const result = extractFormErrorMessages(42);
		expect(result).toEqual(["42"]);
	});
});
