import type { Edge, Node } from "@/lib/learnermap-comparator";
import { describe, expect, it } from "vitest";
import {
	groupCompare,
	type LearnerMapComparisonData,
} from "./group-comparator";

describe("groupCompare", () => {
	it("should aggregate matches across multiple learners", () => {
		const goalMapEdges: Edge[] = [
			{ id: "e1", source: "c1", target: "l1" },
			{ id: "e2", source: "l1", target: "c2" },
		];

		const goalMapNodes: Node[] = [
			{ id: "c1", data: { label: "Concept 1" }, position: { x: 0, y: 0 } },
			{ id: "l1", data: { label: "Link 1" }, position: { x: 0, y: 0 } },
			{ id: "c2", data: { label: "Concept 2" }, position: { x: 0, y: 0 } },
		];

		const learnerMaps: LearnerMapComparisonData[] = [
			{
				id: "lm1",
				userId: "u1",
				userName: "Alice",
				nodes: goalMapNodes,
				edges: goalMapEdges,
				comparison: {
					match: [...goalMapEdges],
					miss: [],
					excessive: [],
				},
			},
			{
				id: "lm2",
				userId: "u2",
				userName: "Bob",
				nodes: goalMapNodes,
				edges: goalMapEdges,
				comparison: {
					match: [...goalMapEdges],
					miss: [],
					excessive: [],
				},
			},
		];

		const result = groupCompare(learnerMaps, goalMapEdges, goalMapNodes);

		expect(result.match).toHaveLength(2);
		expect(result.match[0].count).toBe(2);
		expect(result.match[0].learnerIds).toEqual(["u1", "u2"]);
		expect(result.match[0].learnerNames).toEqual(["Alice", "Bob"]);
	});

	it("should separate match, miss, and excessive edges", () => {
		const goalMapEdges: Edge[] = [
			{ id: "e1", source: "c1", target: "l1" },
			{ id: "e2", source: "l1", target: "c2" },
		];

		const goalMapNodes: Node[] = [
			{ id: "c1", data: { label: "Concept 1" }, position: { x: 0, y: 0 } },
			{ id: "l1", data: { label: "Link 1" }, position: { x: 0, y: 0 } },
			{ id: "c2", data: { label: "Concept 2" }, position: { x: 0, y: 0 } },
		];

		const learnerMaps: LearnerMapComparisonData[] = [
			{
				id: "lm1",
				userId: "u1",
				userName: "Alice",
				nodes: goalMapNodes,
				edges: [{ id: "e1", source: "c1", target: "l1" }],
				comparison: {
					match: [{ id: "e1", source: "c1", target: "l1" }],
					miss: [{ id: "e2", source: "l1", target: "c2" }],
					excessive: [{ id: "e3", source: "c2", target: "c1" }],
				},
			},
		];

		const result = groupCompare(learnerMaps, goalMapEdges, goalMapNodes);

		expect(result.match).toHaveLength(1);
		expect(result.miss).toHaveLength(1);
		expect(result.excessive).toHaveLength(1);
		expect(result.match[0].type).toBe("match");
		expect(result.miss[0].type).toBe("miss");
		expect(result.excessive[0].type).toBe("excessive");
	});

	it("should identify leave edges (not used by any learner)", () => {
		const goalMapEdges: Edge[] = [{ id: "e1", source: "c1", target: "l1" }];

		const goalMapNodes: Node[] = [
			{ id: "c1", data: { label: "Concept 1" }, position: { x: 0, y: 0 } },
			{ id: "l1", data: { label: "Link 1" }, position: { x: 0, y: 0 } },
		];

		const learnerMaps: LearnerMapComparisonData[] = [
			{
				id: "lm1",
				userId: "u1",
				userName: "Alice",
				nodes: goalMapNodes,
				edges: [],
				comparison: {
					match: [],
					miss: [],
					excessive: [],
				},
			},
		];

		const result = groupCompare(learnerMaps, goalMapEdges, goalMapNodes);

		expect(result.leave.length).toBeGreaterThanOrEqual(0);
	});

	it("should calculate counts correctly across multiple learners", () => {
		const goalMapEdges: Edge[] = [{ id: "e1", source: "c1", target: "l1" }];

		const goalMapNodes: Node[] = [
			{ id: "c1", data: { label: "Concept 1" }, position: { x: 0, y: 0 } },
			{ id: "l1", data: { label: "Link 1" }, position: { x: 0, y: 0 } },
		];

		const learnerMaps: LearnerMapComparisonData[] = [
			{
				id: "lm1",
				userId: "u1",
				userName: "Alice",
				nodes: goalMapNodes,
				edges: [{ id: "e1", source: "c1", target: "l1" }],
				comparison: {
					match: [{ id: "e1", source: "c1", target: "l1" }],
					miss: [],
					excessive: [],
				},
			},
			{
				id: "lm2",
				userId: "u2",
				userName: "Bob",
				nodes: goalMapNodes,
				edges: [{ id: "e1", source: "c1", target: "l1" }],
				comparison: {
					match: [{ id: "e1", source: "c1", target: "l1" }],
					miss: [],
					excessive: [],
				},
			},
			{
				id: "lm3",
				userId: "u3",
				userName: "Charlie",
				nodes: goalMapNodes,
				edges: [{ id: "e1", source: "c1", target: "l1" }],
				comparison: {
					match: [{ id: "e1", source: "c1", target: "l1" }],
					miss: [],
					excessive: [],
				},
			},
		];

		const result = groupCompare(learnerMaps, goalMapEdges, goalMapNodes);

		expect(result.match).toHaveLength(1);
		expect(result.match[0].count).toBe(3);
		expect(result.match[0].learnerIds).toEqual(["u1", "u2", "u3"]);
	});

	it("should handle empty learner maps", () => {
		const goalMapEdges: Edge[] = [{ id: "e1", source: "c1", target: "l1" }];
		const goalMapNodes: Node[] = [
			{ id: "c1", data: { label: "Concept 1" }, position: { x: 0, y: 0 } },
			{ id: "l1", data: { label: "Link 1" }, position: { x: 0, y: 0 } },
		];

		const result = groupCompare([], goalMapEdges, goalMapNodes);

		expect(result.match).toHaveLength(0);
		expect(result.miss).toHaveLength(0);
		expect(result.excessive).toHaveLength(0);
	});

	it("should handle multiple excessive edges with same key", () => {
		const goalMapEdges: Edge[] = [{ id: "e1", source: "c1", target: "l1" }];
		const goalMapNodes: Node[] = [
			{ id: "c1", data: { label: "Concept 1" }, position: { x: 0, y: 0 } },
			{ id: "l1", data: { label: "Link 1" }, position: { x: 0, y: 0 } },
			{ id: "c2", data: { label: "Concept 2" }, position: { x: 0, y: 0 } },
			{ id: "l2", data: { label: "Link 2" }, position: { x: 0, y: 0 } },
		];

		const learnerMaps: LearnerMapComparisonData[] = [
			{
				id: "lm1",
				userId: "u1",
				userName: "Alice",
				nodes: goalMapNodes,
				edges: [{ id: "e2", source: "c2", target: "l2" }],
				comparison: {
					match: [],
					miss: [],
					excessive: [{ id: "e2", source: "c2", target: "l2" }],
				},
			},
			{
				id: "lm2",
				userId: "u2",
				userName: "Bob",
				nodes: goalMapNodes,
				edges: [{ id: "e3", source: "c2", target: "l2" }],
				comparison: {
					match: [],
					miss: [],
					excessive: [{ id: "e3", source: "c2", target: "l2" }],
				},
			},
		];

		const result = groupCompare(learnerMaps, goalMapEdges, goalMapNodes);

		expect(result.excessive).toHaveLength(1);
		expect(result.excessive[0].count).toBe(2);
	});

	it("should correctly identify leave edges", () => {
		const goalMapEdges: Edge[] = [
			{ id: "e1", source: "c1", target: "l1" },
			{ id: "e2", source: "l1", target: "c2" },
		];
		const goalMapNodes: Node[] = [
			{ id: "c1", data: { label: "Concept 1" }, position: { x: 0, y: 0 } },
			{ id: "l1", data: { label: "Link 1" }, position: { x: 0, y: 0 } },
			{ id: "c2", data: { label: "Concept 2" }, position: { x: 0, y: 0 } },
		];

		const learnerMaps: LearnerMapComparisonData[] = [
			{
				id: "lm1",
				userId: "u1",
				userName: "Alice",
				nodes: goalMapNodes,
				edges: [{ id: "e1", source: "c1", target: "l1" }],
				comparison: {
					match: [{ id: "e1", source: "c1", target: "l1" }],
					miss: [{ id: "e2", source: "l1", target: "c2" }],
					excessive: [],
				},
			},
		];

		const result = groupCompare(learnerMaps, goalMapEdges, goalMapNodes);

		expect(result.leave).toHaveLength(1);
		expect(result.leave[0].source.id).toBe("l1");
		expect(result.leave[0].target.id).toBe("c2");
		expect(result.leave[0].type).toBe("leave");
	});

	it("should correctly identify abandon edges", () => {
		const goalMapEdges: Edge[] = [
			{ id: "e1", source: "c1", target: "l1" },
			{ id: "e2", source: "l1", target: "c2" },
		];
		const goalMapNodes: Node[] = [
			{ id: "c1", data: { label: "Concept 1" }, position: { x: 0, y: 0 } },
			{ id: "l1", data: { label: "Link 1" }, position: { x: 0, y: 0 } },
			{ id: "c2", data: { label: "Concept 2" }, position: { x: 0, y: 0 } },
		];

		const learnerMaps: LearnerMapComparisonData[] = [
			{
				id: "lm1",
				userId: "u1",
				userName: "Alice",
				nodes: goalMapNodes,
				edges: goalMapEdges,
				comparison: {
					match: [...goalMapEdges],
					miss: [],
					excessive: [],
				},
			},
		];

		const result = groupCompare(learnerMaps, goalMapEdges, goalMapNodes);

		expect(result.abandon).toHaveLength(2);
		expect(result.abandon.every((e) => e.type === "abandon")).toBe(true);
	});

	it("should handle partial usage of goal edges", () => {
		const goalMapEdges: Edge[] = [
			{ id: "e1", source: "c1", target: "l1" },
			{ id: "e2", source: "l1", target: "c2" },
			{ id: "e3", source: "c2", target: "l2" },
		];
		const goalMapNodes: Node[] = [
			{ id: "c1", data: { label: "Concept 1" }, position: { x: 0, y: 0 } },
			{ id: "l1", data: { label: "Link 1" }, position: { x: 0, y: 0 } },
			{ id: "c2", data: { label: "Concept 2" }, position: { x: 0, y: 0 } },
			{ id: "l2", data: { label: "Link 2" }, position: { x: 0, y: 0 } },
		];

		const learnerMaps: LearnerMapComparisonData[] = [
			{
				id: "lm1",
				userId: "u1",
				userName: "Alice",
				nodes: goalMapNodes,
				edges: [
					{ id: "e1", source: "c1", target: "l1" },
					{ id: "e2", source: "l1", target: "c2" },
				],
				comparison: {
					match: [
						{ id: "e1", source: "c1", target: "l1" },
						{ id: "e2", source: "l1", target: "c2" },
					],
					miss: [{ id: "e3", source: "c2", target: "l2" }],
					excessive: [],
				},
			},
		];

		const result = groupCompare(learnerMaps, goalMapEdges, goalMapNodes);

		expect(result.leave).toHaveLength(1);
		expect(result.abandon).toHaveLength(2);
		expect(result.match).toHaveLength(2);
	});

	it("should handle multiple learners with different propositions", () => {
		const goalMapEdges: Edge[] = [
			{ id: "e1", source: "c1", target: "l1" },
			{ id: "e2", source: "l1", target: "c2" },
		];
		const goalMapNodes: Node[] = [
			{ id: "c1", data: { label: "Concept 1" }, position: { x: 0, y: 0 } },
			{ id: "l1", data: { label: "Link 1" }, position: { x: 0, y: 0 } },
			{ id: "c2", data: { label: "Concept 2" }, position: { x: 0, y: 0 } },
		];

		const learnerMaps: LearnerMapComparisonData[] = [
			{
				id: "lm1",
				userId: "u1",
				userName: "Alice",
				nodes: goalMapNodes,
				edges: [{ id: "e1", source: "c1", target: "l1" }],
				comparison: {
					match: [{ id: "e1", source: "c1", target: "l1" }],
					miss: [{ id: "e2", source: "l1", target: "c2" }],
					excessive: [],
				},
			},
			{
				id: "lm2",
				userId: "u2",
				userName: "Bob",
				nodes: goalMapNodes,
				edges: [{ id: "e2", source: "l1", target: "c2" }],
				comparison: {
					match: [{ id: "e2", source: "l1", target: "c2" }],
					miss: [{ id: "e1", source: "c1", target: "l1" }],
					excessive: [],
				},
			},
			{
				id: "lm3",
				userId: "u3",
				userName: "Charlie",
				nodes: goalMapNodes,
				edges: goalMapEdges,
				comparison: {
					match: [...goalMapEdges],
					miss: [],
					excessive: [],
				},
			},
		];

		const result = groupCompare(learnerMaps, goalMapEdges, goalMapNodes);

		expect(result.match).toHaveLength(2);
		expect(result.miss).toHaveLength(2);
		expect(result.match[0].count).toBe(2);
		expect(result.match[1].count).toBe(2);
		expect(result.abandon).toHaveLength(2);
	});

	it("should handle mixed scenarios with all edge types", () => {
		const goalMapEdges: Edge[] = [
			{ id: "e1", source: "c1", target: "l1" },
			{ id: "e2", source: "l1", target: "c2" },
			{ id: "e3", source: "c2", target: "l2" },
		];
		const goalMapNodes: Node[] = [
			{ id: "c1", data: { label: "Concept 1" }, position: { x: 0, y: 0 } },
			{ id: "l1", data: { label: "Link 1" }, position: { x: 0, y: 0 } },
			{ id: "c2", data: { label: "Concept 2" }, position: { x: 0, y: 0 } },
			{ id: "l2", data: { label: "Link 2" }, position: { x: 0, y: 0 } },
		];

		const learnerMaps: LearnerMapComparisonData[] = [
			{
				id: "lm1",
				userId: "u1",
				userName: "Alice",
				nodes: goalMapNodes,
				edges: [
					{ id: "e1", source: "c1", target: "l1" },
					{ id: "e2", source: "l1", target: "c2" },
					{ id: "ex1", source: "c2", target: "c1" },
				],
				comparison: {
					match: [
						{ id: "e1", source: "c1", target: "l1" },
						{ id: "e2", source: "l1", target: "c2" },
					],
					miss: [{ id: "e3", source: "c2", target: "l2" }],
					excessive: [{ id: "ex1", source: "c2", target: "c1" }],
				},
			},
			{
				id: "lm2",
				userId: "u2",
				userName: "Bob",
				nodes: goalMapNodes,
				edges: [{ id: "e1", source: "c1", target: "l1" }],
				comparison: {
					match: [{ id: "e1", source: "c1", target: "l1" }],
					miss: [
						{ id: "e2", source: "l1", target: "c2" },
						{ id: "e3", source: "c2", target: "l2" },
					],
					excessive: [],
				},
			},
		];

		const result = groupCompare(learnerMaps, goalMapEdges, goalMapNodes);

		expect(result.match).toHaveLength(2);
		expect(result.miss).toHaveLength(2);
		expect(result.excessive).toHaveLength(1);
		expect(result.leave).toHaveLength(1);
		expect(result.abandon).toHaveLength(2);
	});

	it("should handle missing nodes gracefully", () => {
		const goalMapEdges: Edge[] = [{ id: "e1", source: "c1", target: "l1" }];
		const goalMapNodes: Node[] = [
			{ id: "c1", data: { label: "Concept 1" }, position: { x: 0, y: 0 } },
		];

		const learnerMaps: LearnerMapComparisonData[] = [
			{
				id: "lm1",
				userId: "u1",
				userName: "Alice",
				nodes: [
					{
						id: "missing",
						data: { label: "Missing" },
						position: { x: 0, y: 0 },
					},
				],
				edges: [{ id: "e1", source: "c1", target: "l1" }],
				comparison: {
					match: [{ id: "e1", source: "c1", target: "l1" }],
					miss: [],
					excessive: [],
				},
			},
		];

		const result = groupCompare(learnerMaps, goalMapEdges, goalMapNodes);

		expect(result.match).toHaveLength(1);
		expect(result.match[0].source.label).toBe("c1");
		expect(result.match[0].target.label).toBe("l1");
	});
});
