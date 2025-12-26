import { describe, expect, it } from "@effect/vitest";
import { Effect } from "effect";
import { simpleGoalMap } from "@/__tests__/fixtures/goal-maps";
import {
	classifyEdges,
	compareMaps,
	getEdgeStyleByType,
} from "@/lib/learnermap-comparator";

describe("compareMaps", () => {
	it.effect("should return perfect match", () =>
		Effect.gen(function* () {
			const result = yield* compareMaps(
				[...simpleGoalMap.edges],
				[...simpleGoalMap.edges],
			);
			expect(result.score).toBe(1);
			expect(result.correct).toHaveLength(2);
			expect(result.missing).toHaveLength(0);
			expect(result.excessive).toHaveLength(0);
		}),
	);

	it.effect("should detect missing edges", () =>
		Effect.gen(function* () {
			const result = yield* compareMaps(
				[...simpleGoalMap.edges],
				[simpleGoalMap.edges[0]],
			);
			expect(result.score).toBe(0.5);
			expect(result.correct).toHaveLength(1);
			expect(result.missing).toHaveLength(1);
			expect(result.missing[0]?.source).toBe("l1");
			expect(result.missing[0]?.target).toBe("c2");
		}),
	);

	it.effect("should detect excessive edges", () =>
		Effect.gen(function* () {
			const learnerEdges = [
				...simpleGoalMap.edges,
				{ id: "e3", source: "c2", target: "c1" },
			];
			const result = yield* compareMaps([...simpleGoalMap.edges], learnerEdges);
			expect(result.score).toBe(1);
			expect(result.excessive).toHaveLength(1);
			expect(result.excessive[0]?.source).toBe("c2");
			expect(result.excessive[0]?.target).toBe("c1");
		}),
	);

	it.effect("should handle empty goal map", () =>
		Effect.gen(function* () {
			const result = yield* compareMaps([], []);
			expect(result.score).toBe(1);
			expect(result.correct).toHaveLength(0);
		}),
	);

	it.effect("should handle empty learner map", () =>
		Effect.gen(function* () {
			const result = yield* compareMaps([...simpleGoalMap.edges], []);
			expect(result.score).toBe(0);
			expect(result.missing).toHaveLength(2);
		}),
	);
});

describe("classifyEdges", () => {
	it.effect("should classify all edge types correctly", () =>
		Effect.gen(function* () {
			const goalEdges = [
				{ id: "e1", source: "c1", target: "l1" },
				{ id: "e2", source: "l1", target: "c2" },
			];
			const learnerEdges = [
				{ id: "e1", source: "c1", target: "l1" },
				{ id: "e3", source: "c2", target: "c1" },
			];

			const result = yield* classifyEdges(goalEdges, learnerEdges);

			const correct = result.filter((e) => e.type === "correct");
			const excessive = result.filter((e) => e.type === "excessive");
			const missing = result.filter((e) => e.type === "missing");

			expect(correct).toHaveLength(1);
			expect(excessive).toHaveLength(1);
			expect(missing).toHaveLength(1);

			expect(missing[0]?.edge.style?.strokeDasharray).toBe("5,5");
			expect(missing[0]?.edge.animated).toBe(true);
		}),
	);
});

describe("getEdgeStyleByType", () => {
	it("should return correct style for correct edge", () => {
		const style = getEdgeStyleByType("correct");
		expect(style).toEqual({ stroke: "#22c55e", strokeWidth: 3 });
	});

	it("should return correct style for excessive edge", () => {
		const style = getEdgeStyleByType("excessive", false);
		expect(style).toEqual({ stroke: "#ef4444", strokeWidth: 3 });
	});

	it("should return correct style for excessive edge with analytics colors", () => {
		const style = getEdgeStyleByType("excessive", true);
		expect(style).toEqual({ stroke: "#3b82f6", strokeWidth: 3 });
	});

	it("should return correct style for missing edge", () => {
		const style = getEdgeStyleByType("missing", false);
		expect(style).toEqual({
			stroke: "#f59e0b",
			strokeWidth: 2,
			strokeDasharray: "5,5",
			opacity: 0.7,
		});
	});

	it("should return correct style for missing edge with analytics colors", () => {
		const style = getEdgeStyleByType("missing", true);
		expect(style).toEqual({
			stroke: "#ef4444",
			strokeWidth: 2,
			strokeDasharray: "5,5",
			opacity: 0.8,
		});
	});

	it("should return correct style for neutral edge", () => {
		const style = getEdgeStyleByType("neutral");
		expect(style).toEqual({
			stroke: "#6b7280",
			strokeWidth: 2,
		});
	});
});
