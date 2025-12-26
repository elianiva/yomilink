import { describe, expect, it } from "vitest";
import { composePropositions } from "./proposition-composer";

describe("composePropositions", () => {
	it("should compose propositions from nodes and edges", () => {
		const nodes = [
			{ id: "n1", type: "text", label: "Cat" },
			{ id: "n2", type: "text", label: "Animal" },
			{ id: "l1", type: "connector", label: "is a" },
		];
		const edges = [
			{ id: "e1", source: "n1", target: "l1" },
			{ id: "e2", source: "l1", target: "n2" },
		];

		const result = composePropositions(nodes, edges);

		expect(result).toHaveLength(2);
		expect(result[0].source).toEqual({ id: "n1", type: "text", label: "Cat" });
		expect(result[0].target).toEqual({
			id: "l1",
			type: "connector",
			label: "is a",
		});
		expect(result[0].link).toEqual({ id: "n1", label: "Cat" });
	});

	it("should handle empty nodes and edges", () => {
		const result = composePropositions([], []);
		expect(result).toEqual([]);
	});

	it("should handle nodes but no edges", () => {
		const nodes = [
			{ id: "n1", type: "text", label: "Cat" },
			{ id: "n2", type: "text", label: "Animal" },
		];
		const result = composePropositions(nodes, []);
		expect(result).toEqual([]);
	});

	it("should skip edges with missing source or target", () => {
		const nodes = [{ id: "n1", type: "text", label: "Cat" }];
		const edges = [{ id: "e1", source: "n1", target: "nonexistent" }];

		const result = composePropositions(nodes, edges);
		expect(result).toEqual([]);
	});

	it("should handle multiple edges from the same node", () => {
		const nodes = [
			{ id: "n1", type: "text", label: "Cat" },
			{ id: "n2", type: "text", label: "Animal" },
			{ id: "n3", type: "text", label: "Mammal" },
			{ id: "l1", type: "connector", label: "is a" },
			{ id: "l2", type: "connector", label: "is also" },
		];
		const edges = [
			{ id: "e1", source: "n1", target: "l1" },
			{ id: "e2", source: "l1", target: "n2" },
			{ id: "e3", source: "n1", target: "l2" },
			{ id: "e4", source: "l2", target: "n3" },
		];

		const result = composePropositions(nodes, edges);

		expect(result).toHaveLength(4);
		expect(result[0].source.id).toBe("n1");
		expect(result[0].target.id).toBe("l1");
	});

	it("should handle circular relationships", () => {
		const nodes = [
			{ id: "n1", type: "text", label: "A" },
			{ id: "n2", type: "text", label: "B" },
			{ id: "n3", type: "text", label: "C" },
			{ id: "l1", type: "connector", label: "links to" },
			{ id: "l2", type: "connector", label: "links to" },
			{ id: "l3", type: "connector", label: "links to" },
		];
		const edges = [
			{ id: "e1", source: "n1", target: "l1" },
			{ id: "e2", source: "l1", target: "n2" },
			{ id: "e3", source: "n2", target: "l2" },
			{ id: "e4", source: "l2", target: "n3" },
			{ id: "e5", source: "n3", target: "l3" },
			{ id: "e6", source: "l3", target: "n1" },
		];

		const result = composePropositions(nodes, edges);
		expect(result).toHaveLength(6);
	});
});
