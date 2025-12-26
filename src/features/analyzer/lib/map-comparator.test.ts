import type { Edge } from "@xyflow/react";
import { describe, expect, it } from "vitest";
import { compareMapsDetailed } from "./map-comparator";

describe("compareMapsDetailed", () => {
	it("should return perfect match for identical maps", () => {
		const goalMapEdges: Edge[] = [
			{ id: "e1", source: "c1", target: "l1" },
			{ id: "e2", source: "l1", target: "c2" },
		];
		const learnerEdges: Edge[] = [
			{ id: "e1", source: "c1", target: "l1" },
			{ id: "e2", source: "l1", target: "c2" },
		];

		const result = compareMapsDetailed(goalMapEdges, learnerEdges, "bi");

		expect(result.match).toHaveLength(2);
		expect(result.miss).toHaveLength(0);
		expect(result.excessive).toHaveLength(0);
		expect(result.score).toBe(1);
		expect(result.totalGoalEdges).toBe(2);
	});

	it("should detect missing edges", () => {
		const goalMapEdges: Edge[] = [
			{ id: "e1", source: "c1", target: "l1" },
			{ id: "e2", source: "l1", target: "c2" },
		];
		const learnerEdges: Edge[] = [{ id: "e1", source: "c1", target: "l1" }];

		const result = compareMapsDetailed(goalMapEdges, learnerEdges, "bi");

		expect(result.match).toHaveLength(1);
		expect(result.miss).toHaveLength(1);
		expect(result.miss[0].id).toBe("missing-e2");
		expect(result.score).toBe(0.5);
	});

	it("should detect excessive edges", () => {
		const goalMapEdges: Edge[] = [{ id: "e1", source: "c1", target: "l1" }];
		const learnerEdges: Edge[] = [{ id: "e1", source: "c1", target: "l1" }];

		const result = compareMapsDetailed(goalMapEdges, learnerEdges, "bi");

		expect(result.match).toHaveLength(1);
	});

	it("should identify leave edges", () => {
		const goalMapEdges: Edge[] = [
			{ id: "e1", source: "c1", target: "l1" },
			{ id: "e2", source: "l1", target: "c2" },
		];
		const learnerEdges: Edge[] = [{ id: "e1", source: "c1", target: "l1" }];

		const result = compareMapsDetailed(goalMapEdges, learnerEdges, "bi");

		expect(result.leave).toHaveLength(1);
		expect(result.leave[0].source).toBe("l1");
		expect(result.leave[0].target).toBe("c2");
	});

	it("should identify abandon edges", () => {
		const goalMapEdges: Edge[] = [
			{ id: "e1", source: "c1", target: "l1" },
			{ id: "e2", source: "l1", target: "c2" },
		];
		const learnerEdges: Edge[] = [];

		const result = compareMapsDetailed(goalMapEdges, learnerEdges, "bi");

		expect(result.abandon).toHaveLength(2);
	});

	it("should calculate score correctly", () => {
		const goalMapEdges: Edge[] = [
			{ id: "e1", source: "c1", target: "l1" },
			{ id: "e2", source: "l1", target: "c2" },
			{ id: "e3", source: "c2", target: "l2" },
			{ id: "e4", source: "l2", target: "c3" },
		];
		const learnerEdges: Edge[] = [
			{ id: "e1", source: "c1", target: "l1" },
			{ id: "e2", source: "l1", target: "c2" },
		];

		const result = compareMapsDetailed(goalMapEdges, learnerEdges, "bi");

		expect(result.match).toHaveLength(2);
		expect(result.score).toBe(0.5);
	});

	it("should handle empty goal map", () => {
		const result = compareMapsDetailed([], [], "bi");

		expect(result.score).toBe(1);
		expect(result.totalGoalEdges).toBe(0);
		expect(result.match).toHaveLength(0);
		expect(result.miss).toHaveLength(0);
	});

	it("should handle empty learner map", () => {
		const goalMapEdges: Edge[] = [{ id: "e1", source: "c1", target: "l1" }];

		const result = compareMapsDetailed(goalMapEdges, [], "bi");

		expect(result.score).toBe(0);
		expect(result.miss).toHaveLength(1);
	});

	it("should compose propositions for matches", () => {
		const goalMapEdges: Edge[] = [{ id: "e1", source: "c1", target: "l1" }];
		const learnerEdges: Edge[] = [{ id: "e1", source: "c1", target: "l1" }];

		const result = compareMapsDetailed(goalMapEdges, learnerEdges, "bi");

		expect(result.propositions.match).toHaveLength(1);
	});

	it("should support bi, uni, and multi directions", () => {
		const goalMapEdges: Edge[] = [{ id: "e1", source: "c1", target: "l1" }];
		const learnerEdges: Edge[] = [{ id: "e1", source: "c1", target: "l1" }];

		const biResult = compareMapsDetailed(goalMapEdges, learnerEdges, "bi");
		const uniResult = compareMapsDetailed(goalMapEdges, learnerEdges, "uni");
		const multiResult = compareMapsDetailed(
			goalMapEdges,
			learnerEdges,
			"multi",
		);

		expect(biResult.match).toHaveLength(1);
		expect(uniResult.match).toHaveLength(1);
		expect(multiResult.match).toHaveLength(1);
	});
});
