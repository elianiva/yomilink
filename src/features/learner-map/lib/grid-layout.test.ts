import type { Node } from "@xyflow/react";
import { describe, expect, it } from "vitest";
import {
	arrangeNodesInGrid,
	arrangeNodesInShuffledGrid,
	arrangeNodesByType,
	shuffleArray,
} from "./grid-layout";

describe("shuffleArray", () => {
	it("should shuffle array and preserve length", () => {
		const array = [1, 2, 3, 4, 5];
		const result = shuffleArray(array);

		expect(result).toHaveLength(array.length);
		expect(result).not.toEqual(array);
	});

	it("should return new array without modifying original", () => {
		const array = [1, 2, 3, 4, 5];
		const original = [...array];
		const result = shuffleArray(array);

		expect(array).toEqual(original);
		expect(result).not.toBe(array);
	});

	it("should handle empty array", () => {
		const result = shuffleArray([]);
		expect(result).toEqual([]);
	});

	it("should handle single element", () => {
		const array = [1];
		const result = shuffleArray(array);
		expect(result).toEqual([1]);
	});
});

describe("arrangeNodesInGrid", () => {
	it("should arrange nodes in default grid", () => {
		const nodes: Node[] = [
			{ id: "1", type: "text", position: { x: 0, y: 0 }, data: { label: "A" } },
			{ id: "2", type: "text", position: { x: 0, y: 0 }, data: { label: "B" } },
			{ id: "3", type: "text", position: { x: 0, y: 0 }, data: { label: "C" } },
			{ id: "4", type: "text", position: { x: 0, y: 0 }, data: { label: "D" } },
		];

		const result = arrangeNodesInGrid(nodes);

		expect(result).toHaveLength(4);
		expect(result[0].position.x).toBe(50);
		expect(result[0].position.y).toBe(50);
	});

	it("should use custom columns", () => {
		const nodes: Node[] = [
			{ id: "1", type: "text", position: { x: 0, y: 0 }, data: { label: "A" } },
			{ id: "2", type: "text", position: { x: 0, y: 0 }, data: { label: "B" } },
		];

		const result = arrangeNodesInGrid(nodes, { columns: 1 });

		expect(result[0].position.x).toBe(50);
		expect(result[1].position.x).toBe(50);
		expect(result[1].position.y).toBeGreaterThanOrEqual(120);
	});

	it("should use custom gaps", () => {
		const nodes: Node[] = [
			{ id: "1", type: "text", position: { x: 0, y: 0 }, data: { label: "A" } },
			{ id: "2", type: "text", position: { x: 0, y: 0 }, data: { label: "B" } },
		];

		const result = arrangeNodesInGrid(nodes, { gapX: 300, gapY: 200 });

		expect(result[0].position.x).toBe(50);
		expect(result[1].position.x).toBe(350);
	});

	it("should use custom start position", () => {
		const nodes: Node[] = [
			{ id: "1", type: "text", position: { x: 0, y: 0 }, data: { label: "A" } },
		];

		const result = arrangeNodesInGrid(nodes, { startX: 100, startY: 150 });

		expect(result[0].position.x).toBe(100);
		expect(result[0].position.y).toBe(150);
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

		const result = arrangeNodesInGrid(nodes);

		expect(result[0].data.label).toBe("Test");
	});

	it("should calculate columns based on square root by default", () => {
		const nodes: Node[] = Array.from({ length: 9 }, (_, i) => ({
			id: `${i}`,
			type: "text",
			position: { x: 0, y: 0 },
			data: { label: `${i}` },
		}));

		const result = arrangeNodesInGrid(nodes);

		expect(result).toHaveLength(9);
	});
});

describe("arrangeNodesInShuffledGrid", () => {
	it("should shuffle and arrange nodes", () => {
		const nodes: Node[] = [
			{ id: "1", type: "text", position: { x: 0, y: 0 }, data: { label: "A" } },
			{ id: "2", type: "text", position: { x: 0, y: 0 }, data: { label: "B" } },
			{ id: "3", type: "text", position: { x: 0, y: 0 }, data: { label: "C" } },
		];

		const result = arrangeNodesInShuffledGrid(nodes);

		expect(result).toHaveLength(3);
	});

	it("should not modify original node order", () => {
		const nodes: Node[] = [
			{ id: "1", type: "text", position: { x: 0, y: 0 }, data: { label: "A" } },
			{ id: "2", type: "text", position: { x: 0, y: 0 }, data: { label: "B" } },
		];

		arrangeNodesInShuffledGrid(nodes);

		expect(nodes[0].data.label).toBe("A");
		expect(nodes[1].data.label).toBe("B");
	});
});

describe("arrangeNodesByType", () => {
	it("should separate concepts and connectors", () => {
		const nodes: Node[] = [
			{ id: "1", type: "text", position: { x: 0, y: 0 }, data: { label: "A" } },
			{
				id: "2",
				type: "connector",
				position: { x: 0, y: 0 },
				data: { label: "is" },
			},
			{ id: "3", type: "text", position: { x: 0, y: 0 }, data: { label: "B" } },
		];

		const result = arrangeNodesByType(nodes);

		expect(result).toHaveLength(3);
		const concepts = result.filter((n) => n.type === "text");
		const connectors = result.filter((n) => n.type === "connector");
		expect(concepts).toHaveLength(2);
		expect(connectors).toHaveLength(1);
	});

	it("should place connectors below concepts", () => {
		const nodes: Node[] = [
			{ id: "1", type: "text", position: { x: 0, y: 0 }, data: { label: "A" } },
			{
				id: "2",
				type: "connector",
				position: { x: 0, y: 0 },
				data: { label: "is" },
			},
		];

		const result = arrangeNodesByType(nodes);

		const concepts = result.filter((n) => n.type === "text");
		const connectors = result.filter((n) => n.type === "connector");

		expect(concepts[0].position.y).toBeLessThan(connectors[0].position.y);
	});

	it("should use custom columns", () => {
		const nodes: Node[] = [
			{ id: "1", type: "text", position: { x: 0, y: 0 }, data: { label: "A" } },
			{ id: "2", type: "text", position: { x: 0, y: 0 }, data: { label: "B" } },
			{ id: "3", type: "text", position: { x: 0, y: 0 }, data: { label: "C" } },
		];

		const result = arrangeNodesByType(nodes, { conceptColumns: 1 });

		const concepts = result.filter((n) => n.type === "text");
		expect(concepts[0].position.x).toBe(concepts[1].position.x);
	});

	it("should handle image nodes as concepts", () => {
		const nodes: Node[] = [
			{
				id: "1",
				type: "image",
				position: { x: 0, y: 0 },
				data: { label: "A" },
			},
			{
				id: "2",
				type: "connector",
				position: { x: 0, y: 0 },
				data: { label: "is" },
			},
		];

		const result = arrangeNodesByType(nodes);

		const concepts = result.filter((n) => n.type === "image");
		const connectors = result.filter((n) => n.type === "connector");

		expect(concepts).toHaveLength(1);
		expect(connectors).toHaveLength(1);
	});

	it("should handle empty nodes", () => {
		const result = arrangeNodesByType([]);
		expect(result).toHaveLength(0);
	});

	it("should handle only concepts", () => {
		const nodes: Node[] = [
			{ id: "1", type: "text", position: { x: 0, y: 0 }, data: { label: "A" } },
			{ id: "2", type: "text", position: { x: 0, y: 0 }, data: { label: "B" } },
		];

		const result = arrangeNodesByType(nodes);
		expect(result).toHaveLength(2);
		expect(result.every((n) => n.type === "text")).toBe(true);
	});

	it("should handle only connectors", () => {
		const nodes: Node[] = [
			{
				id: "1",
				type: "connector",
				position: { x: 0, y: 0 },
				data: { label: "is" },
			},
			{
				id: "2",
				type: "connector",
				position: { x: 0, y: 0 },
				data: { label: "has" },
			},
		];

		const result = arrangeNodesByType(nodes);
		expect(result).toHaveLength(2);
		expect(result.every((n) => n.type === "connector")).toBe(true);
	});
});
