import { Effect } from "effect";
import { describe, expect, it } from "vite-plus/test";

import { exportAnalyticsData } from "./analytics-service.mutations";

const mockAnalytics = {
	assignment: { title: "Test Assignment" },
	goalMap: { id: "gm-1", title: "Test Goal Map" },
	learners: [
		{
			userId: "u1",
			userName: "Alice",
			learnerMapId: "lm-1",
			status: "submitted" as const,
			attempt: 1,
			score: 0.8,
			correct: 4,
			missing: 1,
			excessive: 0,
			totalGoalPropositions: 5,
			submittedAt: Date.now(),
		},
		{
			userId: "u2",
			userName: "Bob",
			learnerMapId: "lm-2",
			status: "submitted" as const,
			attempt: 1,
			score: 0.6,
			correct: 3,
			missing: 2,
			excessive: 1,
			totalGoalPropositions: 5,
			submittedAt: Date.now(),
		},
	],
	summary: {
		totalLearners: 2,
		submittedCount: 2,
		draftCount: 0,
		avgScore: 0.7,
		medianScore: 0.7,
		highestScore: 0.8,
		lowestScore: 0.6,
	},
};

describe("exportAnalyticsData", () => {
	it("should export as CSV with correct headers and rows", () => {
		const result = Effect.runSync(
			exportAnalyticsData({ analytics: mockAnalytics, format: "csv" }),
		);
		expect(result.contentType).toBe("text/csv");
		expect(result.filename).toMatch(/^KB-Analytics-[^.]+.csv$/);
		expect(result.data).toContain("u1");
		expect(result.data).toContain("Alice");
		expect(result.data).toContain("u2");
		expect(result.data).toContain("Bob");
		expect(result.data).toContain("Test Assignment");
	});

	it("should export as JSON with all sections", () => {
		const result = Effect.runSync(
			exportAnalyticsData({ analytics: mockAnalytics, format: "json" }),
		);
		expect(result.contentType).toBe("application/json");
		expect(result.filename).toMatch(/^KB-Analytics-[^.]+.json$/);
		const parsed = JSON.parse(result.data);
		expect(parsed.assignment.title).toBe("Test Assignment");
		expect(parsed.goalMap.title).toBe("Test Goal Map");
		expect(parsed.learners).toHaveLength(2);
		expect(parsed.summary.avgScore).toBe(0.7);
		expect(parsed.exportedAt).toBeDefined();
	});

	it("should handle single learner", () => {
		const single = {
			...mockAnalytics,
			learners: [mockAnalytics.learners[0]],
			summary: { ...mockAnalytics.summary, totalLearners: 1 },
		};
		const result = Effect.runSync(exportAnalyticsData({ analytics: single, format: "json" }));
		const parsed = JSON.parse(result.data);
		expect(parsed.learners).toHaveLength(1);
	});

	it("should handle empty learners array", () => {
		const empty = {
			...mockAnalytics,
			learners: [],
			summary: { ...mockAnalytics.summary, totalLearners: 0, submittedCount: 0 },
		};
		const csvResult = Effect.runSync(exportAnalyticsData({ analytics: empty, format: "csv" }));
		expect(csvResult.data).toBeDefined();

		const jsonResult = Effect.runSync(
			exportAnalyticsData({ analytics: empty, format: "json" }),
		);
		const parsed = JSON.parse(jsonResult.data);
		expect(parsed.learners).toEqual([]);
	});
});
