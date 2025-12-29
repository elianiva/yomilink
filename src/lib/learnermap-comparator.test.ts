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

	it.effect("should handle empty edge lists", () =>
		Effect.gen(function* () {
			const result = yield* classifyEdges([], []);
			expect(result).toHaveLength(0);
		}),
	);

	it.effect(
		"should classify all learner edges as excessive when goal map is empty",
		() =>
			Effect.gen(function* () {
				const learnerEdges = [
					{ id: "e1", source: "c1", target: "l1" },
					{ id: "e2", source: "l1", target: "c2" },
				];
				const result = yield* classifyEdges([], learnerEdges);
				expect(result).toHaveLength(2);
				expect(result.every((e) => e.type === "excessive")).toBe(true);
			}),
	);

	it.effect(
		"should mark all goal edges as missing when learner map is empty",
		() =>
			Effect.gen(function* () {
				const goalEdges = [
					{ id: "e1", source: "c1", target: "l1" },
					{ id: "e2", source: "l1", target: "c2" },
				];
				const result = yield* classifyEdges(goalEdges, []);
				expect(result).toHaveLength(2);
				expect(result.every((e) => e.type === "missing")).toBe(true);
				result.forEach((r) => {
					expect(r.edge.style?.strokeDasharray).toBe("5,5");
					expect(r.edge.animated).toBe(true);
				});
			}),
	);

	it.effect("should classify neutral edges correctly", () =>
		Effect.gen(function* () {
			const goalEdges = [
				{ id: "e1", source: "c1", target: "l1" },
				{ id: "e2", source: "l1", target: "c2" },
			];
			const learnerEdges = [
				{ id: "e1", source: "c1", target: "l1" },
				{ id: "e3", source: "x", target: "y" },
			];
			const result = yield* classifyEdges(goalEdges, learnerEdges);
			const correct = result.filter((e) => e.type === "correct");
			const excessive = result.filter((e) => e.type === "excessive");
			const missing = result.filter((e) => e.type === "missing");
			const neutral = result.filter((e) => e.type === "neutral");

			expect(correct).toHaveLength(1);
			expect(excessive).toHaveLength(1);
			expect(missing).toHaveLength(1);
			expect(neutral).toHaveLength(0);
		}),
	);

	it.effect("should handle multiple edges between same nodes", () =>
		Effect.gen(function* () {
			const goalEdges = [
				{ id: "e1", source: "c1", target: "l1" },
				{ id: "e2", source: "l1", target: "c2" },
			];
			const learnerEdges = [
				{ id: "e1", source: "c1", target: "l1" },
				{ id: "e2", source: "l1", target: "c2" },
				{ id: "e3", source: "l1", target: "c1" },
			];
			const result = yield* classifyEdges(goalEdges, learnerEdges);
			const correct = result.filter((e) => e.type === "correct");
			const excessive = result.filter((e) => e.type === "excessive");
			const missing = result.filter((e) => e.type === "missing");

			expect(correct).toHaveLength(2);
			expect(excessive).toHaveLength(1);
			expect(missing).toHaveLength(0);
			expect(excessive[0]?.edge.id).toBe("e3");
		}),
	);

	it.effect("should handle complex scenario with all edge types", () =>
		Effect.gen(function* () {
			const goalEdges = [
				{ id: "e1", source: "c1", target: "l1" },
				{ id: "e2", source: "l1", target: "c2" },
				{ id: "e3", source: "c2", target: "l2" },
			];
			const learnerEdges = [
				{ id: "e1", source: "c1", target: "l1" },
				{ id: "e4", source: "c3", target: "l1" },
				{ id: "e5", source: "l1", target: "c1" },
			];
			const result = yield* classifyEdges(goalEdges, learnerEdges);
			const correct = result.filter((e) => e.type === "correct");
			const excessive = result.filter((e) => e.type === "excessive");
			const missing = result.filter((e) => e.type === "missing");
			const neutral = result.filter((e) => e.type === "neutral");

			expect(correct).toHaveLength(1);
			expect(excessive).toHaveLength(2);
			expect(missing).toHaveLength(2);
			expect(neutral).toHaveLength(0);
		}),
	);

	it.effect("should handle perfect match", () =>
		Effect.gen(function* () {
			const edges = [
				{ id: "e1", source: "c1", target: "l1" },
				{ id: "e2", source: "l1", target: "c2" },
			];
			const result = yield* classifyEdges(edges, edges);
			expect(result).toHaveLength(2);
			expect(result.every((e) => e.type === "correct")).toBe(true);
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
