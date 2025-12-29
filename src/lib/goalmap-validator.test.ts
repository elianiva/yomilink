import { describe, expect, it } from "@effect/vitest";
import { Effect } from "effect";
import {
	GoalMapValidator,
	detectCycles,
	findConnectedComponents,
} from "./goalmap-validator";

describe("GoalMapValidator", () => {
	it.effect("should validate a correct KBFIRA structure", () =>
		Effect.gen(function* () {
			const validator = yield* GoalMapValidator;
			const nodes = [
				{
					id: "root",
					type: "text",
					data: { label: "Concept" },
					position: { x: 0, y: 0 },
				},
				{
					id: "child1",
					type: "text",
					data: { label: "Child 1" },
					position: { x: 100, y: 100 },
				},
				{
					id: "child2",
					type: "text",
					data: { label: "Child 2" },
					position: { x: 200, y: 100 },
				},
				{
					id: "link",
					type: "connector",
					data: { label: "is" },
					position: { x: 150, y: 50 },
				},
			];
			const edges = [
				{ id: "edge1", source: "root", target: "link" },
				{ id: "edge2", source: "link", target: "child1" },
				{ id: "edge3", source: "link", target: "child2" },
			];
			const result = yield* validator.validateNodes(nodes, edges);
			expect(result.isValid).toBe(true);
			expect(result.errors).toEqual([]);
		}).pipe(Effect.provide(GoalMapValidator.Default)),
	);

	it.effect("should reject goal map with insufficient nodes", () =>
		Effect.gen(function* () {
			const validator = yield* GoalMapValidator;
			const nodes = [
				{
					id: "root",
					type: "text",
					data: { label: "Concept" },
					position: { x: 0, y: 0 },
				},
				{
					id: "link",
					type: "connector",
					data: { label: "is" },
					position: { x: 50, y: 50 },
				},
			];
			const edges = [{ id: "edge1", source: "root", target: "link" }];
			const result = yield* validator.validateNodes(nodes, edges);
			expect(result.isValid).toBe(false);
			expect(result.errors).toContain(
				"At least 2 concept nodes (text/image) required",
			);
		}).pipe(Effect.provide(GoalMapValidator.Default)),
	);

	it.effect("should reject goal map with insufficient connectors", () =>
		Effect.gen(function* () {
			const validator = yield* GoalMapValidator;
			const nodes = [
				{
					id: "root",
					type: "text",
					data: { label: "Concept" },
					position: { x: 0, y: 0 },
				},
				{
					id: "child1",
					type: "text",
					data: { label: "Child 1" },
					position: { x: 100, y: 100 },
				},
			];
			const edges = [{ id: "edge1", source: "root", target: "child1" }];
			const result = yield* validator.validateNodes(nodes, edges);
			expect(result.isValid).toBe(false);
			expect(result.errors).toContain("At least 1 connector node required");
		}).pipe(Effect.provide(GoalMapValidator.Default)),
	);

	it.effect("should reject goal map with insufficient edges", () =>
		Effect.gen(function* () {
			const validator = yield* GoalMapValidator;
			const nodes = [
				{
					id: "root",
					type: "text",
					data: { label: "Concept" },
					position: { x: 0, y: 0 },
				},
				{
					id: "child1",
					type: "text",
					data: { label: "Child 1" },
					position: { x: 100, y: 100 },
				},
				{
					id: "link",
					type: "connector",
					data: { label: "is" },
					position: { x: 50, y: 50 },
				},
			];
			const edges = [{ id: "edge1", source: "root", target: "link" }];
			const result = yield* validator.validateNodes(nodes, edges);
			expect(result.isValid).toBe(false);
			expect(result.errors).toContain("At least 2 edges required");
		}).pipe(Effect.provide(GoalMapValidator.Default)),
	);

	it.effect("should reject goal map with non-unique node IDs", () =>
		Effect.gen(function* () {
			const validator = yield* GoalMapValidator;
			const nodes = [
				{
					id: "root",
					type: "text",
					data: { label: "Concept" },
					position: { x: 0, y: 0 },
				},
				{
					id: "root",
					type: "text",
					data: { label: "Duplicate" },
					position: { x: 100, y: 100 },
				},
				{
					id: "link",
					type: "connector",
					data: { label: "is" },
					position: { x: 50, y: 50 },
				},
			];
			const edges = [
				{ id: "edge1", source: "root", target: "link" },
				{ id: "edge2", source: "link", target: "root" },
			];
			const result = yield* validator.validateNodes(nodes, edges);
			expect(result.isValid).toBe(false);
			expect(result.errors).toContain("All node IDs must be unique");
		}).pipe(Effect.provide(GoalMapValidator.Default)),
	);

	it.effect("should reject goal map with invalid edge references", () =>
		Effect.gen(function* () {
			const validator = yield* GoalMapValidator;
			const nodes = [
				{
					id: "root",
					type: "text",
					data: { label: "Concept" },
					position: { x: 0, y: 0 },
				},
				{
					id: "link",
					type: "connector",
					data: { label: "is" },
					position: { x: 50, y: 50 },
				},
			];
			const edges = [
				{ id: "edge1", source: "root", target: "link" },
				{ id: "edge2", source: "nonexistent", target: "link" },
			];
			const result = yield* validator.validateNodes(nodes, edges);
			expect(result.isValid).toBe(false);
			expect(result.errors.some((e) => e.includes("does not exist"))).toBe(
				true,
			);
		}).pipe(Effect.provide(GoalMapValidator.Default)),
	);

	it.effect("should reject goal map with disconnected connectors", () =>
		Effect.gen(function* () {
			const validator = yield* GoalMapValidator;
			const nodes = [
				{
					id: "root",
					type: "text",
					data: { label: "Concept" },
					position: { x: 0, y: 0 },
				},
				{
					id: "child1",
					type: "text",
					data: { label: "Child 1" },
					position: { x: 100, y: 100 },
				},
				{
					id: "link",
					type: "connector",
					data: { label: "is" },
					position: { x: 50, y: 50 },
				},
			];
			const edges = [{ id: "edge1", source: "root", target: "child1" }];
			const result = yield* validator.validateNodes(nodes, edges);
			expect(result.isValid).toBe(false);
			expect(
				result.errors.some(
					(e) => e.includes("has no") && e.includes("connections"),
				),
			).toBe(true);
		}).pipe(Effect.provide(GoalMapValidator.Default)),
	);

	it.effect("should compose propositions correctly", () =>
		Effect.gen(function* () {
			const validator = yield* GoalMapValidator;
			const nodes = [
				{
					id: "cat",
					type: "text",
					data: { label: "Cat" },
					position: { x: 0, y: 0 },
				},
				{
					id: "animal",
					type: "text",
					data: { label: "Animal" },
					position: { x: 200, y: 0 },
				},
				{
					id: "is",
					type: "connector",
					data: { label: "is a" },
					position: { x: 100, y: 0 },
				},
			];
			const edges = [
				{ id: "edge1", source: "cat", target: "is" },
				{ id: "edge2", source: "is", target: "animal" },
			];
			const result = yield* validator.validateNodes(nodes, edges);
			expect(result.propositions).toHaveLength(1);
			expect(result.propositions[0]).toEqual({
				sourceId: "cat",
				linkId: "is",
				targetId: "animal",
			});
		}).pipe(Effect.provide(GoalMapValidator.Default)),
	);

	it.effect("should warn about disconnected concept nodes", () =>
		Effect.gen(function* () {
			const validator = yield* GoalMapValidator;
			const nodes = [
				{
					id: "root",
					type: "text",
					data: { label: "Concept" },
					position: { x: 0, y: 0 },
				},
				{
					id: "child1",
					type: "text",
					data: { label: "Child 1" },
					position: { x: 100, y: 100 },
				},
				{
					id: "orphan",
					type: "text",
					data: { label: "Orphan" },
					position: { x: 200, y: 200 },
				},
				{
					id: "link",
					type: "connector",
					data: { label: "is" },
					position: { x: 50, y: 50 },
				},
			];
			const edges = [
				{ id: "edge1", source: "root", target: "link" },
				{ id: "edge2", source: "link", target: "child1" },
			];
			const result = yield* validator.validateNodes(nodes, edges);
			expect(
				result.warnings.some(
					(w) => w.includes("Orphan") && w.includes("not connected"),
				),
			).toBe(true);
		}).pipe(Effect.provide(GoalMapValidator.Default)),
	);

	describe("findConnectedComponents", () => {
		it("should find single connected component", () => {
			const nodes = [
				{
					id: "a",
					type: "text",
					data: { label: "A" },
					position: { x: 0, y: 0 },
				},
				{
					id: "b",
					type: "text",
					data: { label: "B" },
					position: { x: 100, y: 0 },
				},
				{
					id: "c",
					type: "text",
					data: { label: "C" },
					position: { x: 200, y: 0 },
				},
			];
			const edges = [
				{ id: "e1", source: "a", target: "b" },
				{ id: "e2", source: "b", target: "c" },
			];
			const components = findConnectedComponents(nodes, edges);
			expect(components).toHaveLength(1);
			expect(components[0]).toHaveLength(3);
		});

		it("should detect multiple disconnected components", () => {
			const nodes = [
				{
					id: "a",
					type: "text",
					data: { label: "A" },
					position: { x: 0, y: 0 },
				},
				{
					id: "b",
					type: "text",
					data: { label: "B" },
					position: { x: 100, y: 0 },
				},
				{
					id: "c",
					type: "text",
					data: { label: "C" },
					position: { x: 200, y: 0 },
				},
				{
					id: "d",
					type: "text",
					data: { label: "D" },
					position: { x: 300, y: 0 },
				},
			];
			const edges = [
				{ id: "e1", source: "a", target: "b" },
				{ id: "e2", source: "c", target: "d" },
			];
			const components = findConnectedComponents(nodes, edges);
			expect(components).toHaveLength(2);
			expect(components[0]).toHaveLength(2);
			expect(components[1]).toHaveLength(2);
		});

		it("should handle isolated nodes as separate components", () => {
			const nodes = [
				{
					id: "a",
					type: "text",
					data: { label: "A" },
					position: { x: 0, y: 0 },
				},
				{
					id: "b",
					type: "text",
					data: { label: "B" },
					position: { x: 100, y: 0 },
				},
				{
					id: "c",
					type: "text",
					data: { label: "C" },
					position: { x: 200, y: 0 },
				},
			];
			const edges = [{ id: "e1", source: "a", target: "b" }];
			const components = findConnectedComponents(nodes, edges);
			expect(components).toHaveLength(2);
			expect(components[0]).toHaveLength(2);
			expect(components[1]).toHaveLength(1);
			expect(components[1][0].id).toBe("c");
		});

		it("should handle empty nodes array", () => {
			const components = findConnectedComponents([], []);
			expect(components).toHaveLength(0);
		});

		it("should handle nodes with no edges", () => {
			const nodes = [
				{
					id: "a",
					type: "text",
					data: { label: "A" },
					position: { x: 0, y: 0 },
				},
				{
					id: "b",
					type: "text",
					data: { label: "B" },
					position: { x: 100, y: 0 },
				},
			];
			const components = findConnectedComponents(nodes, []);
			expect(components).toHaveLength(2);
		});

		it("should work with bidirectional edges", () => {
			const nodes = [
				{
					id: "a",
					type: "text",
					data: { label: "A" },
					position: { x: 0, y: 0 },
				},
				{
					id: "b",
					type: "text",
					data: { label: "B" },
					position: { x: 100, y: 0 },
				},
			];
			const edges = [
				{ id: "e1", source: "a", target: "b" },
				{ id: "e2", source: "b", target: "a" },
			];
			const components = findConnectedComponents(nodes, edges);
			expect(components).toHaveLength(1);
			expect(components[0]).toHaveLength(2);
		});
	});

	describe("detectCycles", () => {
		it("should detect simple cycle", () => {
			const nodes = [
				{
					id: "a",
					type: "text",
					data: { label: "A" },
					position: { x: 0, y: 0 },
				},
				{
					id: "b",
					type: "text",
					data: { label: "B" },
					position: { x: 100, y: 0 },
				},
			];
			const edges = [
				{ id: "e1", source: "a", target: "b" },
				{ id: "e2", source: "b", target: "a" },
			];
			expect(detectCycles(nodes, edges)).toBe(true);
		});

		it("should detect cycle with three nodes", () => {
			const nodes = [
				{
					id: "a",
					type: "text",
					data: { label: "A" },
					position: { x: 0, y: 0 },
				},
				{
					id: "b",
					type: "text",
					data: { label: "B" },
					position: { x: 100, y: 0 },
				},
				{
					id: "c",
					type: "text",
					data: { label: "C" },
					position: { x: 200, y: 0 },
				},
			];
			const edges = [
				{ id: "e1", source: "a", target: "b" },
				{ id: "e2", source: "b", target: "c" },
				{ id: "e3", source: "c", target: "a" },
			];
			expect(detectCycles(nodes, edges)).toBe(true);
		});

		it("should return false for acyclic graph", () => {
			const nodes = [
				{
					id: "a",
					type: "text",
					data: { label: "A" },
					position: { x: 0, y: 0 },
				},
				{
					id: "b",
					type: "text",
					data: { label: "B" },
					position: { x: 100, y: 0 },
				},
				{
					id: "c",
					type: "text",
					data: { label: "C" },
					position: { x: 200, y: 0 },
				},
			];
			const edges = [
				{ id: "e1", source: "a", target: "b" },
				{ id: "e2", source: "b", target: "c" },
			];
			expect(detectCycles(nodes, edges)).toBe(false);
		});

		it("should return false for empty graph", () => {
			expect(detectCycles([], [])).toBe(false);
		});

		it("should return false for single node with no edges", () => {
			const nodes = [
				{
					id: "a",
					type: "text",
					data: { label: "A" },
					position: { x: 0, y: 0 },
				},
			];
			expect(detectCycles(nodes, [])).toBe(false);
		});

		it("should detect cycle in complex graph with multiple paths", () => {
			const nodes = [
				{
					id: "a",
					type: "text",
					data: { label: "A" },
					position: { x: 0, y: 0 },
				},
				{
					id: "b",
					type: "text",
					data: { label: "B" },
					position: { x: 100, y: 0 },
				},
				{
					id: "c",
					type: "text",
					data: { label: "C" },
					position: { x: 200, y: 0 },
				},
				{
					id: "d",
					type: "text",
					data: { label: "D" },
					position: { x: 300, y: 0 },
				},
			];
			const edges = [
				{ id: "e1", source: "a", target: "b" },
				{ id: "e2", source: "a", target: "c" },
				{ id: "e3", source: "b", target: "d" },
				{ id: "e4", source: "c", target: "d" },
				{ id: "e5", source: "d", target: "a" },
			];
			expect(detectCycles(nodes, edges)).toBe(true);
		});

		it("should return false for tree structure", () => {
			const nodes = [
				{
					id: "root",
					type: "text",
					data: { label: "Root" },
					position: { x: 0, y: 0 },
				},
				{
					id: "child1",
					type: "text",
					data: { label: "C1" },
					position: { x: 100, y: 0 },
				},
				{
					id: "child2",
					type: "text",
					data: { label: "C2" },
					position: { x: 200, y: 0 },
				},
				{
					id: "grandchild1",
					type: "text",
					data: { label: "G1" },
					position: { x: 300, y: 0 },
				},
			];
			const edges = [
				{ id: "e1", source: "root", target: "child1" },
				{ id: "e2", source: "root", target: "child2" },
				{ id: "e3", source: "child1", target: "grandchild1" },
			];
			expect(detectCycles(nodes, edges)).toBe(false);
		});

		it("should handle self-loop", () => {
			const nodes = [
				{
					id: "a",
					type: "text",
					data: { label: "A" },
					position: { x: 0, y: 0 },
				},
			];
			const edges = [{ id: "e1", source: "a", target: "a" }];
			expect(detectCycles(nodes, edges)).toBe(true);
		});
	});
});
