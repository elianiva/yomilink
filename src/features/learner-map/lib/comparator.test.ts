import { describe, expect, it } from "vitest";

import { simpleGoalMap } from "@/__tests__/fixtures/goal-maps";

import { classifyEdges, compareMaps, getEdgeStyleByType } from "./comparator";

describe("compareMaps", () => {
	it("should return perfect match", () => {
		const result = compareMaps([...simpleGoalMap.edges], [...simpleGoalMap.edges]);
		expect(result.score).toBe(1);
		expect(result.correct).toHaveLength(2);
		expect(result.missing).toHaveLength(0);
		expect(result.excessive).toHaveLength(0);
	});

	it("should detect missing edges", () => {
		const result = compareMaps([...simpleGoalMap.edges], [simpleGoalMap.edges[0]]);
		expect(result.score).toBe(0.5);
		expect(result.correct).toHaveLength(1);
		expect(result.missing).toHaveLength(1);
		expect(result.missing[0]?.source).toBe("l1");
		expect(result.missing[0]?.target).toBe("c2");
	});

	it("should detect excessive edges", () => {
		const learnerEdges = [...simpleGoalMap.edges, { id: "e3", source: "c2", target: "c1" }];
		const result = compareMaps([...simpleGoalMap.edges], learnerEdges);
		expect(result.score).toBe(1);
		expect(result.excessive).toHaveLength(1);
		expect(result.excessive[0]?.source).toBe("c2");
		expect(result.excessive[0]?.target).toBe("c1");
	});

	it("should handle empty goal map", () => {
		const result = compareMaps([], []);
		expect(result.score).toBe(1);
		expect(result.correct).toHaveLength(0);
	});

	it("should handle empty learner map", () => {
		const result = compareMaps([...simpleGoalMap.edges], []);
		expect(result.score).toBe(0);
		expect(result.missing).toHaveLength(2);
	});
});

describe("classifyEdges", () => {
	it("should classify all edge types correctly", () => {
		const goalEdges = [
			{ id: "e1", source: "c1", target: "l1" },
			{ id: "e2", source: "l1", target: "c2" },
		];
		const learnerEdges = [
			{ id: "e1", source: "c1", target: "l1" },
			{ id: "e3", source: "c2", target: "c1" },
		];

		const result = classifyEdges(goalEdges, learnerEdges);

		const correct = result.filter((e) => e.type === "correct");
		const excessive = result.filter((e) => e.type === "excessive");
		const missing = result.filter((e) => e.type === "missing");

		expect(correct).toHaveLength(1);
		expect(excessive).toHaveLength(1);
		expect(missing).toHaveLength(1);

		expect(missing[0]?.edge.style?.strokeDasharray).toBe("5,5");
		expect(missing[0]?.edge.animated).toBe(true);
	});

	it("should handle empty edge lists", () => {
		const result = classifyEdges([], []);
		expect(result).toHaveLength(0);
	});

	it("should classify all learner edges as excessive when goal map is empty", () => {
		const learnerEdges = [
			{ id: "e1", source: "c1", target: "l1" },
			{ id: "e2", source: "l1", target: "c2" },
		];
		const result = classifyEdges([], learnerEdges);
		expect(result).toHaveLength(2);
		expect(result.every((e) => e.type === "excessive")).toBe(true);
	});

	it("should mark all goal edges as missing when learner map is empty", () => {
		const goalEdges = [
			{ id: "e1", source: "c1", target: "l1" },
			{ id: "e2", source: "l1", target: "c2" },
		];
		const result = classifyEdges(goalEdges, []);
		expect(result).toHaveLength(2);
		expect(result.every((e) => e.type === "missing")).toBe(true);
		result.forEach((r) => {
			expect(r.edge.style?.strokeDasharray).toBe("5,5");
			expect(r.edge.animated).toBe(true);
		});
	});

	it("should classify neutral edges correctly", () => {
		const goalEdges = [
			{ id: "e1", source: "c1", target: "l1" },
			{ id: "e2", source: "l1", target: "c2" },
		];
		const learnerEdges = [
			{ id: "e1", source: "c1", target: "l1" },
			{ id: "e3", source: "x", target: "y" },
		];
		const result = classifyEdges(goalEdges, learnerEdges);
		const correct = result.filter((e) => e.type === "correct");
		const excessive = result.filter((e) => e.type === "excessive");
		const missing = result.filter((e) => e.type === "missing");
		const neutral = result.filter((e) => e.type === "neutral");

		expect(correct).toHaveLength(1);
		expect(excessive).toHaveLength(1);
		expect(missing).toHaveLength(1);
		expect(neutral).toHaveLength(0);
	});

	it("should handle multiple edges between same nodes", () => {
		const goalEdges = [
			{ id: "e1", source: "c1", target: "l1" },
			{ id: "e2", source: "l1", target: "c2" },
		];
		const learnerEdges = [
			{ id: "e1", source: "c1", target: "l1" },
			{ id: "e2", source: "l1", target: "c2" },
			{ id: "e3", source: "l1", target: "c1" },
		];
		const result = classifyEdges(goalEdges, learnerEdges);
		const correct = result.filter((e) => e.type === "correct");
		const excessive = result.filter((e) => e.type === "excessive");
		const missing = result.filter((e) => e.type === "missing");

		expect(correct).toHaveLength(2);
		expect(excessive).toHaveLength(1);
		expect(missing).toHaveLength(0);
		expect(excessive[0]?.edge.id).toBe("e3");
	});

	it("should handle complex scenario with all edge types", () => {
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
		const result = classifyEdges(goalEdges, learnerEdges);
		const correct = result.filter((e) => e.type === "correct");
		const excessive = result.filter((e) => e.type === "excessive");
		const missing = result.filter((e) => e.type === "missing");
		const neutral = result.filter((e) => e.type === "neutral");

		expect(correct).toHaveLength(1);
		expect(excessive).toHaveLength(2);
		expect(missing).toHaveLength(2);
		expect(neutral).toHaveLength(0);
	});

	it("should handle perfect match", () => {
		const edges = [
			{ id: "e1", source: "c1", target: "l1" },
			{ id: "e2", source: "l1", target: "c2" },
		];
		const result = classifyEdges(edges, edges);
		expect(result).toHaveLength(2);
		expect(result.every((e) => e.type === "correct")).toBe(true);
	});
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
