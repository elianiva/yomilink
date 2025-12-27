import { Effect } from "effect";
import type { Edge } from "@/lib/learnermap-comparator";
import { compareMapsDetailed } from "./map-comparator";
import { describe, expect, it } from "vitest";

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

		const result = Effect.runSync(
			compareMapsDetailed(goalMapEdges, [], learnerEdges, []),
		);

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

		const result = Effect.runSync(
			compareMapsDetailed(goalMapEdges, [], learnerEdges, []),
		);

		expect(result.match).toHaveLength(1);
		expect(result.miss).toHaveLength(1);
		expect(result.miss[0].id).toBe("missing-e2");
		expect(result.score).toBe(0.5);
	});

	it("should detect excessive edges", () => {
		const goalMapEdges: Edge[] = [
			{ id: "e1", source: "c1", target: "l1" },
			{ id: "e2", source: "l1", target: "c2" },
		];
		const learnerEdges: Edge[] = [{ id: "e3", source: "c2", target: "l1" }];

		const result = Effect.runSync(
			compareMapsDetailed(goalMapEdges, [], learnerEdges, []),
		);

		expect(result.match).toHaveLength(0);
		expect(result.excessive).toHaveLength(1);
		expect(result.score).toBe(0);
	});

	it("should identify leave edges (not used by any learner)", () => {
		const goalMapEdges: Edge[] = [{ id: "e1", source: "c1", target: "l1" }];
		const learnerEdges: Edge[] = [];

		const result = Effect.runSync(
			compareMapsDetailed(goalMapEdges, [], learnerEdges, []),
		);

		expect(result.leave).toHaveLength(1);
		expect(result.abandon).toHaveLength(0);
	});

	it("should identify abandon edges (not connected to any learner edge)", () => {
		const goalMapEdges: Edge[] = [{ id: "e1", source: "c1", target: "l1" }];
		const learnerEdges: Edge[] = [{ id: "e2", source: "c2", target: "l2" }];

		const result = Effect.runSync(
			compareMapsDetailed(goalMapEdges, [], learnerEdges, []),
		);

		expect(result.leave).toHaveLength(0);
		expect(result.abandon).toHaveLength(1);
	});

	it("should calculate score correctly", () => {
		const goalMapEdges: Edge[] = [
			{ id: "e1", source: "c1", target: "l1" },
			{ id: "e2", source: "l1", target: "c2" },
		];
		const learnerEdges: Edge[] = [{ id: "e1", source: "c1", target: "l1" }];

		const result = Effect.runSync(
			compareMapsDetailed(goalMapEdges, [], learnerEdges, []),
		);

		expect(result.match).toHaveLength(1);
		expect(result.score).toBe(0.5);
	});

	it("should handle empty goal map", () => {
		const goalMapEdges: Edge[] = [];
		const learnerEdges: Edge[] = [];

		const result = Effect.runSync(
			compareMapsDetailed(goalMapEdges, [], learnerEdges, []),
		);

		expect(result.match).toHaveLength(0);
		expect(result.miss).toHaveLength(0);
		expect(result.excessive).toHaveLength(0);
		expect(result.leave).toHaveLength(0);
		expect(result.abandon).toHaveLength(0);
		expect(result.score).toBe(1);
		expect(result.totalGoalEdges).toBe(0);
	});

	it("should handle empty learner map", () => {
		const goalMapEdges: Edge[] = [];
		const learnerEdges: Edge[] = [];

		const result = Effect.runSync(
			compareMapsDetailed(goalMapEdges, [], learnerEdges, []),
		);

		expect(result.match).toHaveLength(0);
		expect(result.miss).toHaveLength(0);
		expect(result.excessive).toHaveLength(0);
		expect(result.leave).toHaveLength(0);
		expect(result.abandon).toHaveLength(0);
		expect(result.score).toBe(1);
		expect(result.totalGoalEdges).toBe(0);
	});

	it("should compose propositions for matches", () => {
		const goalMapNodes = [
			{ id: "c1", data: { label: "Concept 1" }, position: { x: 0, y: 0 } },
			{ id: "l1", data: { label: "Link 1" }, position: { x: 0, y: 0 } },
			{ id: "c2", data: { label: "Concept 2" }, position: { x: 0, y: 0 } },
		];
		const goalMapEdges: Edge[] = [
			{ id: "e1", source: "c1", target: "l1" },
			{ id: "e2", source: "l1", target: "c2" },
		];
		const learnerEdges: Edge[] = [
			{ id: "e1", source: "c1", target: "l1" },
			{ id: "e2", source: "l1", target: "c2" },
		];
		const learnerNodes = [
			{ id: "c1", data: { label: "Concept 1" }, position: { x: 0, y: 0 } },
			{ id: "l1", data: { label: "Link 1" }, position: { x: 0, y: 0 } },
			{ id: "c2", data: { label: "Concept 2" }, position: { x: 0, y: 0 } },
		];

		const result = Effect.runSync(
			compareMapsDetailed(
				goalMapEdges,
				goalMapNodes,
				learnerEdges,
				learnerNodes,
			),
		);

		expect(result.propositions.match).toHaveLength(2);
	});

	it("should work with empty nodes", () => {
		const goalMapEdges: Edge[] = [{ id: "e1", source: "c1", target: "l1" }];
		const learnerEdges: Edge[] = [{ id: "e1", source: "c1", target: "l1" }];

		const result = Effect.runSync(
			compareMapsDetailed(goalMapEdges, [], learnerEdges, []),
		);

		expect(result.match).toHaveLength(1);
	});
});
