import { describe, expect, it } from "vite-plus/test";

import { isCorrectMcqAnswer, normalizeSelectedAnswerIds } from "./form-scoring";

describe("normalizeSelectedAnswerIds", () => {
	it("should return array as-is with string conversion", () => {
		expect(normalizeSelectedAnswerIds(["a", "b"])).toEqual(["a", "b"]);
	});

	it("should convert number array to string array", () => {
		expect(normalizeSelectedAnswerIds([1, 2])).toEqual(["1", "2"]);
	});

	it("should wrap single string in array", () => {
		expect(normalizeSelectedAnswerIds("a")).toEqual(["a"]);
	});

	it("should wrap single number in array", () => {
		expect(normalizeSelectedAnswerIds(1)).toEqual(["1"]);
	});

	it("should handle empty array", () => {
		expect(normalizeSelectedAnswerIds([])).toEqual([]);
	});

	it("should handle mixed types in array", () => {
		expect(normalizeSelectedAnswerIds(["a", 2, "c"])).toEqual(["a", "2", "c"]);
	});
});

describe("isCorrectMcqAnswer", () => {
	const mcqOptions = { type: "mcq" as const, correctOptionIds: ["a", "b"] };

	it("should return true for correct answer", () => {
		expect(isCorrectMcqAnswer(mcqOptions, ["a", "b"])).toBe(true);
	});

	it("should return false for wrong answer", () => {
		expect(isCorrectMcqAnswer(mcqOptions, ["a", "c"])).toBe(false);
	});

	it("should return false for empty selection", () => {
		expect(isCorrectMcqAnswer(mcqOptions, [])).toBe(false);
	});

	it("should return null when options is null", () => {
		expect(isCorrectMcqAnswer(null, ["a"])).toBe(null);
	});

	it("should return null when options is undefined", () => {
		expect(isCorrectMcqAnswer(undefined, ["a"])).toBe(null);
	});

	it("should return null when correctOptionIds is empty", () => {
		const noCorrect = { type: "mcq" as const, correctOptionIds: [] };
		expect(isCorrectMcqAnswer(noCorrect, ["a"])).toBe(null);
	});

	it("should return true for subset of correct options", () => {
		expect(isCorrectMcqAnswer(mcqOptions, ["a"])).toBe(true);
	});

	it("should return false for extra answers", () => {
		expect(isCorrectMcqAnswer(mcqOptions, ["a", "b", "c"])).toBe(false);
	});

	it("should handle string answer by normalizing", () => {
		expect(isCorrectMcqAnswer(mcqOptions, "a")).toBe(true);
	});

	it("should handle null/undefined answer", () => {
		expect(isCorrectMcqAnswer(mcqOptions, null)).toBe(false);
		expect(isCorrectMcqAnswer(mcqOptions, undefined)).toBe(false);
	});

	it("should work with string correctOptionIds and number answer", () => {
		const numericOpts = { type: "mcq" as const, correctOptionIds: ["1", "2"] };
		expect(isCorrectMcqAnswer(numericOpts, [1, 2])).toBe(true);
	});
});
