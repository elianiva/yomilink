import { describe, expect, it } from "vite-plus/test";

import { simpleGoalMap } from "@/__tests__/fixtures/goal-maps";

import { classifyEdges, compareMaps, getEdgeStyleByType } from "./comparator";
import type { Edge, Node } from "./comparator";

function props(correct: number, missing: number, excessive: number, total: number, score: number) {
	return { correct, missing, excessive, total, score };
}

function result(d: ReturnType<typeof compareMaps>) {
	return props(
		d.correct.length,
		d.missing.length,
		d.excessive.length,
		d.totalGoalPropositions,
		d.score,
	);
}

const { nodes: fixtureNodes, edges: fixtureEdges } = simpleGoalMap;

describe("compareMaps", () => {
	it("perfect match — 1 proposition, 2 edges", () => {
		const nodes = [...fixtureNodes] as Node[];
		const edges = [...fixtureEdges] as Edge[];
		const r = result(compareMaps(nodes, edges, nodes, edges));
		expect(r).toEqual(props(1, 0, 0, 1, 1));
	});

	it("half proposition — only concept→connector edge matches", () => {
		const nodes = [...fixtureNodes] as Node[];
		const edges = [...fixtureEdges] as Edge[];
		const learnerEdges: Edge[] = [edges[0]]; // c1→l1 only, missing l1→c2
		const r = result(compareMaps(nodes, edges, nodes, learnerEdges));
		expect(r).toEqual(props(0, 1, 0, 1, 0));
	});

	it("swapped connector — edges partially match but proposition is wrong", () => {
		// Goal: c1→l1→c2,   c2→l2→c1
		// Learner: c1→l1→c1, c2→l2→c2  (swapped targets)
		const nodes: Node[] = [
			{ id: "c1", type: "text", position: { x: 0, y: 0 }, data: { label: "A" } },
			{ id: "c2", type: "text", position: { x: 100, y: 0 }, data: { label: "B" } },
			{ id: "l1", type: "connector", position: { x: 50, y: 50 }, data: { label: "is" } },
			{ id: "l2", type: "connector", position: { x: 150, y: 50 }, data: { label: "has" } },
		];
		const goalEdges: Edge[] = [
			{ id: "e1", source: "c1", target: "l1" },
			{ id: "e2", source: "l1", target: "c2" },
			{ id: "e3", source: "c2", target: "l2" },
			{ id: "e4", source: "l2", target: "c1" },
		];
		const learnerEdges: Edge[] = [
			{ id: "e1", source: "c1", target: "l1" },
			{ id: "e2", source: "l1", target: "c1" },
			{ id: "e3", source: "c2", target: "l2" },
			{ id: "e4", source: "l2", target: "c2" },
		];
		const r = result(compareMaps(nodes, goalEdges, nodes, learnerEdges));
		// 0/2 propositions correct
		expect(r).toEqual(props(0, 2, 2, 2, 0));
	});

	it("empty goal map", () => {
		const r = result(compareMaps([], [], [], []));
		expect(r).toEqual(props(0, 0, 0, 0, 1));
	});

	it("empty learner map", () => {
		const nodes = [...fixtureNodes] as Node[];
		const edges = [...fixtureEdges] as Edge[];
		const r = result(compareMaps(nodes, edges, [], []));
		expect(r).toEqual(props(0, 1, 0, 1, 0));
	});

	it("extra connector — excessive proposition", () => {
		const nodes = [...fixtureNodes] as Node[];
		const edges = [...fixtureEdges] as Edge[];
		const learnerNodes: Node[] = [
			...nodes,
			{ id: "l2", type: "connector", position: { x: 200, y: 200 }, data: { label: "x" } },
		];
		const learnerEdges: Edge[] = [
			...edges,
			{ id: "e3", source: "c1", target: "l2" },
			{ id: "e4", source: "l2", target: "c1" },
		];
		const r = result(compareMaps(nodes, edges, learnerNodes, learnerEdges));
		expect(r).toEqual(props(1, 0, 1, 1, 1));
	});
});

describe("classifyEdges", () => {
	it("classify all edge types correctly", () => {
		const goalEdges: Edge[] = [
			{ id: "e1", source: "c1", target: "l1" },
			{ id: "e2", source: "l1", target: "c2" },
		];
		const learnerEdges: Edge[] = [
			{ id: "e1", source: "c1", target: "l1" },
			{ id: "e3", source: "c2", target: "c1" },
		];

		const result = classifyEdges(goalEdges, learnerEdges);

		expect(result.filter((e) => e.type === "correct")).toHaveLength(1);
		expect(result.filter((e) => e.type === "excessive")).toHaveLength(1);
		expect(result.filter((e) => e.type === "missing")).toHaveLength(1);
	});

	it("handle empty edge lists", () => {
		expect(classifyEdges([], [])).toHaveLength(0);
	});

	it("all learner edges excessive when goal map is empty", () => {
		const learnerEdges: Edge[] = [
			{ id: "e1", source: "c1", target: "l1" },
			{ id: "e2", source: "l1", target: "c2" },
		];
		const result = classifyEdges([], learnerEdges);
		expect(result).toHaveLength(2);
		expect(result.every((e) => e.type === "excessive")).toBe(true);
	});

	it("all goal edges missing when learner map is empty", () => {
		const goalEdges: Edge[] = [
			{ id: "e1", source: "c1", target: "l1" },
			{ id: "e2", source: "l1", target: "c2" },
		];
		const result = classifyEdges(goalEdges, []);
		expect(result).toHaveLength(2);
		expect(result.every((e) => e.type === "missing")).toBe(true);
	});

	it("perfect match", () => {
		const edges: Edge[] = [
			{ id: "e1", source: "c1", target: "l1" },
			{ id: "e2", source: "l1", target: "c2" },
		];
		const result = classifyEdges(edges, edges);
		expect(result).toHaveLength(2);
		expect(result.every((e) => e.type === "correct")).toBe(true);
	});

	it("treats reversed direction as same edge", () => {
		const goalEdges: Edge[] = [
			{ id: "e1", source: "c1", target: "l1" },
		];
		const learnerEdges: Edge[] = [
			{ id: "e2", source: "l1", target: "c1" },
		];

		const result = classifyEdges(goalEdges, learnerEdges);

		expect(result).toHaveLength(1);
		expect(result[0].type).toBe("correct");
	});
});

describe("getEdgeStyleByType", () => {
	it("returns correct style for correct edge", () => {
		expect(getEdgeStyleByType("correct")).toEqual({ stroke: "#22c55e", strokeWidth: 3 });
	});

	it("returns correct style for excessive edge", () => {
		expect(getEdgeStyleByType("excessive")).toEqual({ stroke: "#ef4444", strokeWidth: 3 });
	});

	it("returns correct style for missing edge", () => {
		expect(getEdgeStyleByType("missing")).toEqual({
			stroke: "#f59e0b",
			strokeWidth: 2,
			strokeDasharray: "5,5",
			opacity: 0.7,
		});
	});
});
