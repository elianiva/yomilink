import type { Node } from "@xyflow/react";
import { describe, expect, it } from "vitest";

import { getEdgeParams, getEdgeParamsFromSourceToPoint } from "./floating-edge-utils";

describe("getNodeCenter", () => {
	it("should calculate center point correctly", () => {
		const node: Node = {
			id: "1",
			type: "text",
			position: { x: 100, y: 100 },
			data: { label: "Test" },
			measured: { width: 200, height: 100 },
		};

		const result = getEdgeParams(node, {
			id: "2",
			position: { x: 300, y: 100 },
			data: { label: "Test2" },
		});

		expect(result.sx).toBeDefined();
		expect(result.sy).toBeDefined();
	});
});

describe("getEdgeParams", () => {
	it("should calculate edge start and end points", () => {
		const source: Node = {
			id: "1",
			type: "text",
			position: { x: 0, y: 0 },
			data: { label: "Source" },
			measured: { width: 100, height: 50 },
		};

		const target: Node = {
			id: "2",
			type: "text",
			position: { x: 200, y: 0 },
			data: { label: "Target" },
			measured: { width: 100, height: 50 },
		};

		const result = getEdgeParams(source, target);

		expect(result.sx).toBeGreaterThan(0);
		expect(result.sy).toBeGreaterThan(0);
		expect(result.tx).toBeGreaterThan(result.sx);
	});

	it("should handle nodes with no measurements", () => {
		const source: Node = {
			id: "1",
			type: "text",
			position: { x: 0, y: 0 },
			data: { label: "Source" },
		};

		const target: Node = {
			id: "2",
			type: "text",
			position: { x: 200, y: 100 },
			data: { label: "Target" },
		};

		const result = getEdgeParams(source, target);

		expect(result.sx).toBeDefined();
		expect(result.sy).toBeDefined();
		expect(result.tx).toBeDefined();
		expect(result.ty).toBeDefined();
	});

	it("should handle vertical alignment", () => {
		const source: Node = {
			id: "1",
			type: "text",
			position: { x: 100, y: 0 },
			data: { label: "Source" },
			measured: { width: 100, height: 50 },
		};

		const target: Node = {
			id: "2",
			type: "text",
			position: { x: 100, y: 200 },
			data: { label: "Target" },
			measured: { width: 100, height: 50 },
		};

		const result = getEdgeParams(source, target);

		expect(result.sy).toBeLessThan(result.ty);
	});

	it("should handle diagonal alignment", () => {
		const source: Node = {
			id: "1",
			type: "text",
			position: { x: 0, y: 0 },
			data: { label: "Source" },
			measured: { width: 100, height: 50 },
		};

		const target: Node = {
			id: "2",
			type: "text",
			position: { x: 200, y: 200 },
			data: { label: "Target" },
			measured: { width: 100, height: 50 },
		};

		const result = getEdgeParams(source, target);

		expect(result.tx).toBeGreaterThan(result.sx);
		expect(result.ty).toBeGreaterThan(result.sy);
	});
});

describe("getEdgeParamsFromSourceToPoint", () => {
	it("should calculate edge from node to point", () => {
		const source: Node = {
			id: "1",
			type: "text",
			position: { x: 0, y: 0 },
			data: { label: "Source" },
			measured: { width: 100, height: 50 },
		};

		const targetPoint = { x: 200, y: 100 };

		const result = getEdgeParamsFromSourceToPoint(source, targetPoint);

		expect(result.sx).toBeDefined();
		expect(result.sy).toBeDefined();
		expect(result.tx).toBe(targetPoint.x);
		expect(result.ty).toBe(targetPoint.y);
	});

	it("should handle target point to the right", () => {
		const source: Node = {
			id: "1",
			type: "text",
			position: { x: 100, y: 100 },
			data: { label: "Source" },
			measured: { width: 100, height: 50 },
		};

		const targetPoint = { x: 300, y: 100 };

		const result = getEdgeParamsFromSourceToPoint(source, targetPoint);

		expect(result.tx).toBeGreaterThan(result.sx);
	});

	it("should handle target point above", () => {
		const source: Node = {
			id: "1",
			type: "text",
			position: { x: 100, y: 200 },
			data: { label: "Source" },
			measured: { width: 100, height: 50 },
		};

		const targetPoint = { x: 100, y: 0 };

		const result = getEdgeParamsFromSourceToPoint(source, targetPoint);

		expect(result.ty).toBeLessThan(result.sy);
	});

	it("should handle target point at same position", () => {
		const source: Node = {
			id: "1",
			type: "text",
			position: { x: 100, y: 100 },
			data: { label: "Source" },
			measured: { width: 100, height: 50 },
		};

		const targetPoint = { x: 100, y: 100 };

		const result = getEdgeParamsFromSourceToPoint(source, targetPoint);

		expect(result.sx).toBeDefined();
		expect(result.sy).toBeDefined();
	});
});
