import { describe, expect, it } from "vitest";
import type { Node } from "@/features/learner-map/lib/comparator";
import { getLayoutedElements } from "./layout";

describe("getLayoutedElements", () => {
	it("should layout nodes in left-to-right direction", () => {
		const nodes: Node[] = [
			{ id: "1", type: "text", position: { x: 0, y: 0 }, data: { label: "A" } },
			{ id: "2", type: "text", position: { x: 0, y: 0 }, data: { label: "B" } },
		];
		const edges = [{ id: "e1", source: "1", target: "2" }];

		const result = getLayoutedElements(nodes, edges, "LR");

		expect(result.nodes).toHaveLength(2);
		// biome-ignore lint/style/noNonNullAssertion: false positive
		expect(result.nodes[0].position!.x).toBeLessThan(result.nodes[1].position!.x);
	});

	it("should layout nodes in top-to-bottom direction", () => {
		const nodes: Node[] = [
			{ id: "1", type: "text", position: { x: 0, y: 0 }, data: { label: "A" } },
			{ id: "2", type: "text", position: { x: 0, y: 0 }, data: { label: "B" } },
		];
		const edges = [{ id: "e1", source: "1", target: "2" }];

		const result = getLayoutedElements(nodes, edges, "TB");

		expect(result.nodes).toHaveLength(2);
		// biome-ignore lint/style/noNonNullAssertion: false positive
		expect(result.nodes[0].position!.y).toBeLessThan(result.nodes[1].position!.y);
	});

	it("should handle multiple connected nodes", () => {
		const nodes: Node[] = [
			{ id: "1", type: "text", position: { x: 0, y: 0 }, data: { label: "A" } },
			{ id: "2", type: "text", position: { x: 0, y: 0 }, data: { label: "B" } },
			{ id: "3", type: "text", position: { x: 0, y: 0 }, data: { label: "C" } },
		];
		const edges = [
			{ id: "e1", source: "1", target: "2" },
			{ id: "e2", source: "2", target: "3" },
		];

		const result = getLayoutedElements(nodes, edges, "LR");

		expect(result.nodes).toHaveLength(3);
		expect(result.edges).toHaveLength(2);
	});

	it("should preserve node data", () => {
		const nodes: Node[] = [
			{
				id: "1",
				type: "text",
				position: { x: 0, y: 0 },
				data: { label: "Test" },
			},
		];
		const edges: Array<{ id: string; source: string; target: string }> = [];

		const result = getLayoutedElements(nodes, edges, "LR");

		expect(result.nodes[0].data.label).toBe("Test");
	});

	it("should handle empty nodes", () => {
		const result = getLayoutedElements([], [], "LR");

		expect(result.nodes).toHaveLength(0);
		expect(result.edges).toHaveLength(0);
	});

	it("should handle disconnected nodes", () => {
		const nodes: Node[] = [
			{ id: "1", type: "text", position: { x: 0, y: 0 }, data: { label: "A" } },
			{ id: "2", type: "text", position: { x: 0, y: 0 }, data: { label: "B" } },
		];
		const edges: Array<{ id: string; source: string; target: string }> = [];

		const result = getLayoutedElements(nodes, edges, "LR");

		expect(result.nodes).toHaveLength(2);
		expect(result.edges).toHaveLength(0);
	});

	it("should use default LR direction when not specified", () => {
		const nodes: Node[] = [
			{ id: "1", type: "text", position: { x: 0, y: 0 }, data: { label: "A" } },
			{ id: "2", type: "text", position: { x: 0, y: 0 }, data: { label: "B" } },
		];
		const edges = [{ id: "e1", source: "1", target: "2" }];

		const result = getLayoutedElements(nodes, edges);

		expect(result.nodes).toHaveLength(2);
	});

	it("should preserve edges", () => {
		const nodes: Node[] = [
			{ id: "1", type: "text", position: { x: 0, y: 0 }, data: { label: "A" } },
			{ id: "2", type: "text", position: { x: 0, y: 0 }, data: { label: "B" } },
		];
		const edges = [{ id: "e1", source: "1", target: "2" }];

		const result = getLayoutedElements(nodes, edges, "LR");

		expect(result.edges).toHaveLength(1);
		expect(result.edges[0].source).toBe("1");
		expect(result.edges[0].target).toBe("2");
	});
});
