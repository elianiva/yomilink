import { Effect, Exit } from "effect";
import { describe, expect, it } from "vite-plus/test";

import {
	normalizeAndValidateReadingMaterialSections,
	normalizeFormAudience,
	shouldExcludeForm,
	sortFormsByPriority,
} from "./form-service.shared";
import type { FormType } from "./form-service.shared";

describe("normalizeFormAudience", () => {
	it("should force 'all' for pre_test", () => {
		expect(normalizeFormAudience("pre_test", "experiment")).toBe("all");
	});

	it("should force 'all' for post_test", () => {
		expect(normalizeFormAudience("post_test", "control")).toBe("all");
	});

	it("should force 'all' for delayed_test", () => {
		expect(normalizeFormAudience("delayed_test", "experiment")).toBe("all");
	});

	it("should force 'all' for registration", () => {
		expect(normalizeFormAudience("registration", "control")).toBe("all");
	});

	it("should preserve audience for questionnaire type", () => {
		expect(normalizeFormAudience("questionnaire", "experiment")).toBe("experiment");
		expect(normalizeFormAudience("questionnaire", "control")).toBe("control");
		expect(normalizeFormAudience("questionnaire", "all")).toBe("all");
	});
});

describe("shouldExcludeForm", () => {
	const buildForm = (type: FormType, audience: "all" | "experiment" | "control") => ({
		id: "f1",
		type,
		audience,
	});

	it("should exclude registration forms", () => {
		expect(shouldExcludeForm(buildForm("registration", "all"), null)).toBe(true);
		expect(shouldExcludeForm(buildForm("registration", "all"), "experiment")).toBe(true);
	});

	it("should include 'all' audience forms regardless of study group", () => {
		expect(shouldExcludeForm(buildForm("questionnaire", "all"), null)).toBe(false);
		expect(shouldExcludeForm(buildForm("questionnaire", "all"), "experiment")).toBe(false);
		expect(shouldExcludeForm(buildForm("questionnaire", "all"), "control")).toBe(false);
	});

	it("should exclude experiment-audience forms for control group", () => {
		const form = buildForm("questionnaire", "experiment");
		expect(shouldExcludeForm(form, "control")).toBe(true);
	});

	it("should exclude control-audience forms for experiment group", () => {
		const form = buildForm("questionnaire", "control");
		expect(shouldExcludeForm(form, "experiment")).toBe(true);
	});

	it("should include experiment-audience forms for experiment group", () => {
		const form = buildForm("questionnaire", "experiment");
		expect(shouldExcludeForm(form, "experiment")).toBe(false);
	});

	it("should include control-audience forms for control group", () => {
		const form = buildForm("questionnaire", "control");
		expect(shouldExcludeForm(form, "control")).toBe(false);
	});

	it("should exclude audience-specific forms when studyGroup is null", () => {
		expect(shouldExcludeForm(buildForm("questionnaire", "experiment"), null)).toBe(true);
		expect(shouldExcludeForm(buildForm("questionnaire", "control"), null)).toBe(true);
	});
});

describe("sortFormsByPriority", () => {
	const form = (type: FormType, createdAt: Date) => ({ type, createdAt });

	it("should sort by priority: pre_test < post_test < questionnaire < delayed_test", () => {
		const forms = [
			form("delayed_test", new Date("2024-01-01")),
			form("pre_test", new Date("2024-01-01")),
			form("post_test", new Date("2024-01-01")),
			form("questionnaire", new Date("2024-01-01")),
		];
		const sorted = forms.slice().sort(sortFormsByPriority);
		expect(sorted.map((f) => f.type)).toEqual([
			"pre_test",
			"post_test",
			"questionnaire",
			"delayed_test",
		]);
	});

	it("should break ties by createdAt ascending", () => {
		const forms = [
			form("pre_test", new Date("2024-02-01")),
			form("pre_test", new Date("2024-01-01")),
		];
		const sorted = forms.slice().sort(sortFormsByPriority);
		expect(sorted[0].createdAt.getTime()).toBeLessThan(sorted[1].createdAt.getTime());
	});

	it("should treat registration as lowest priority (-1)", () => {
		const forms = [
			form("registration", new Date("2024-01-01")),
			form("delayed_test", new Date("2024-01-01")),
		];
		const sorted = forms.slice().sort(sortFormsByPriority);
		expect(sorted[0].type).toBe("registration");
		expect(sorted[1].type).toBe("delayed_test");
	});
});

describe("normalizeAndValidateReadingMaterialSections", () => {
	it("should return null for null/undefined/empty input", () => {
		const assertNull = (result: unknown) => expect(result).toBeNull();
		assertNull(Effect.runSync(normalizeAndValidateReadingMaterialSections(null)));
		assertNull(Effect.runSync(normalizeAndValidateReadingMaterialSections(undefined)));
		assertNull(Effect.runSync(normalizeAndValidateReadingMaterialSections([])));
	});

	it("should trim titles and content", () => {
		const result = Effect.runSync(
			normalizeAndValidateReadingMaterialSections([
				{
					id: "s1",
					title: "  My Section  ",
					startQuestion: 1,
					endQuestion: 5,
					content: "  Some text  ",
				},
			]),
		);
		expect(result).not.toBeNull();
		if (result) {
			expect(result[0].title).toBe("My Section");
			expect(result[0].content).toBe("Some text");
		}
	});

	it("should sort by startQuestion then endQuestion", () => {
		const result = Effect.runSync(
			normalizeAndValidateReadingMaterialSections([
				{ id: "s2", startQuestion: 10, endQuestion: 20, content: "Second" },
				{ id: "s1", startQuestion: 1, endQuestion: 5, content: "First" },
			]),
		);
		expect(result).not.toBeNull();
		if (result) {
			expect(result[0].id).toBe("s1");
			expect(result[1].id).toBe("s2");
		}
	});

	it("should reject startQuestion < 1", () => {
		const exit = Effect.runSyncExit(
			normalizeAndValidateReadingMaterialSections([
				{ id: "s1", startQuestion: 0, endQuestion: 5, content: "bad" },
			]),
		);
		expect(Exit.isFailure(exit)).toBe(true);
	});

	it("should reject empty content", () => {
		const exit = Effect.runSyncExit(
			normalizeAndValidateReadingMaterialSections([
				{ id: "s1", startQuestion: 1, endQuestion: 5, content: "   " },
			]),
		);
		expect(Exit.isFailure(exit)).toBe(true);
	});

	it("should reject endQuestion < startQuestion", () => {
		const exit = Effect.runSyncExit(
			normalizeAndValidateReadingMaterialSections([
				{ id: "s1", startQuestion: 10, endQuestion: 5, content: "invalid" },
			]),
		);
		expect(Exit.isFailure(exit)).toBe(true);
	});

	it("should reject overlapping sections", () => {
		const exit = Effect.runSyncExit(
			normalizeAndValidateReadingMaterialSections([
				{ id: "s1", startQuestion: 1, endQuestion: 10, content: "First" },
				{ id: "s2", startQuestion: 5, endQuestion: 15, content: "Second" },
			]),
		);
		expect(Exit.isFailure(exit)).toBe(true);
	});

	it("should accept adjacent non-overlapping sections", () => {
		const result = Effect.runSync(
			normalizeAndValidateReadingMaterialSections([
				{ id: "s1", startQuestion: 1, endQuestion: 5, content: "First" },
				{ id: "s2", startQuestion: 6, endQuestion: 10, content: "Second" },
			]),
		);
		expect(result).not.toBeNull();
		if (result) {
			expect(result).toHaveLength(2);
		}
	});

	it("should handle section with nullish title", () => {
		const result = Effect.runSync(
			normalizeAndValidateReadingMaterialSections([
				{
					id: "s1",
					title: undefined,
					startQuestion: 1,
					endQuestion: 5,
					content: "Text",
				},
			]),
		);
		expect(result).not.toBeNull();
		if (result) {
			expect(result[0].title).toBeUndefined();
		}
	});
});
