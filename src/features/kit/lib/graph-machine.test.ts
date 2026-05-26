import type { NodeChange } from "@xyflow/react";
import { describe, expect, it } from "vite-plus/test";

import { canRedo, canUndo, filterSelectChanges, recordSnapshot } from "./graph-machine";
import type { GraphContext } from "./graph-machine";
import type { Node, Edge } from "@/features/learner-map/lib/comparator";

const nodeA: Node = { id: "a", type: "text", position: { x: 0, y: 0 }, data: { label: "A" } };
const nodeB: Node = { id: "b", type: "text", position: { x: 100, y: 0 }, data: { label: "B" } };
const edge1: Edge = { id: "e1", source: "a", target: "b" };

function ctx(overrides?: Partial<GraphContext>): GraphContext {
	return {
		nodes: [],
		edges: [],
		history: [{ nodes: [], edges: [] }],
		pointer: 0,
		...overrides,
	};
}

describe("recordSnapshot", () => {
	it("should append snapshot after pointer", () => {
		const c = ctx({
			history: [{ nodes: [nodeA], edges: [] }, { nodes: [nodeA, nodeB], edges: [] }],
			pointer: 0,
		});
		const next = { nodes: [nodeB], edges: [] };
		const result = recordSnapshot(c, next);
		expect(result).toHaveLength(2);
		expect(result[0]).toEqual({ nodes: [nodeA], edges: [] });
		expect(result[1]).toEqual(next);
	});

	it("should truncate future history before appending", () => {
		const c = ctx({
			history: [
				{ nodes: [nodeA], edges: [] },
				{ nodes: [nodeA, nodeB], edges: [] },
				{ nodes: [nodeA, nodeB, { ...nodeB, id: "c" }], edges: [] },
			],
			pointer: 1,
		});
		const next = { nodes: [nodeB], edges: [] };
		const result = recordSnapshot(c, next);
		expect(result).toHaveLength(3);
		expect(result[0]).toEqual({ nodes: [nodeA], edges: [] });
		expect(result[1]).toEqual({ nodes: [nodeA, nodeB], edges: [] });
		expect(result[2]).toEqual(next);
		// Future history (index 2) should NOT be in result
		expect(result).not.toContainEqual({ nodes: [nodeA, nodeB, { ...nodeB, id: "c" }], edges: [] });
	});

	it("should handle empty history", () => {
		const c = ctx({ history: [{ nodes: [], edges: [] }], pointer: 0 });
		const next = { nodes: [nodeA], edges: [edge1] };
		const result = recordSnapshot(c, next);
		expect(result).toHaveLength(2);
		expect(result[0]).toEqual({ nodes: [], edges: [] });
		expect(result[1]).toEqual(next);
	});
});

describe("canUndo", () => {
	it("should return false when at initial position", () => {
		expect(canUndo(ctx({ pointer: 0 }))).toBe(false);
	});

	it("should return true when pointer > 0", () => {
		expect(canUndo(ctx({ pointer: 1 }))).toBe(true);
		expect(canUndo(ctx({ pointer: 5 }))).toBe(true);
	});
});

describe("canRedo", () => {
	it("should return false when pointer is at end of history", () => {
		const c = ctx({ history: [{ nodes: [], edges: [] }], pointer: 0 });
		expect(canRedo(c)).toBe(false);
	});

	it("should return true when pointer < history.length - 1", () => {
		const c = ctx({
			history: [{ nodes: [], edges: [] }, { nodes: [nodeA], edges: [] }],
			pointer: 0,
		});
		expect(canRedo(c)).toBe(true);
	});
});

describe("filterSelectChanges", () => {
	it("should filter out select type changes", () => {
		const changes = [
			{ type: "add" as const, item: { id: "1" } },
			{ type: "select" as const, item: { id: "1" }, selected: true },
			{ type: "position" as const, item: { id: "1" }, position: { x: 10, y: 10 } },
		];
		const result = filterSelectChanges(changes as unknown as NodeChange[]);
		expect(result).toHaveLength(2);
		expect(result.every((c) => c.type !== "select")).toBe(true);
	});

	it("should return empty array when all changes are selects", () => {
		const changes = [
			{ type: "select" as const, item: { id: "1" }, selected: true },
			{ type: "select" as const, item: { id: "2" }, selected: false },
		];
		expect(filterSelectChanges(changes as unknown as NodeChange[])).toEqual([]);
	});

	it("should return all changes when none are selects", () => {
		const changes = [
			{ type: "add" as const, item: { id: "1" } },
			{ type: "remove" as const, item: { id: "1" } },
		];
		const result = filterSelectChanges(changes as unknown as NodeChange[]);
		expect(result).toHaveLength(2);
	});

	it("should handle empty changes", () => {
		expect(filterSelectChanges([])).toEqual([]);
	});
});
