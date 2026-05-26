import { createActor } from "xstate";
import { describe, expect, it } from "vite-plus/test";

import { goalMapMachine } from "./goal-map.machine";

describe("goalMapMachine", () => {
	it("should start in loading state", () => {
		const actor = createActor(goalMapMachine).start();
		expect(actor.getSnapshot().value).toBe("loading");
		expect(actor.getSnapshot().context.nodes).toEqual([]);
		expect(actor.getSnapshot().context.pointer).toBe(0);
	});

	it("should transition to editing on LOADED with data", () => {
		const actor = createActor(goalMapMachine).start();
		actor.send({
			type: "LOADED",
			data: {
				nodes: [
					{ id: "a", type: "text", position: { x: 0, y: 0 }, data: { label: "A" } },
				],
				edges: [],
			},
		});
		expect(actor.getSnapshot().value).toBe("editing");
		expect(actor.getSnapshot().context.nodes).toHaveLength(1);
	});

	it("should transition to error on LOAD_ERROR", () => {
		const actor = createActor(goalMapMachine).start();
		actor.send({ type: "LOAD_ERROR" });
		expect(actor.getSnapshot().value).toBe("error");
	});

	it("should update nodes on SET_NODES and record history", () => {
		const actor = createActor(goalMapMachine).start();
		actor.send({
			type: "LOADED",
			data: { nodes: [], edges: [] },
		});
		const newNodes = [
			{ id: "a", type: "text", position: { x: 0, y: 0 }, data: { label: "A" } },
		];
		actor.send({ type: "SET_NODES", nodes: newNodes });
		expect(actor.getSnapshot().context.nodes).toEqual(newNodes);
		expect(actor.getSnapshot().context.history).toHaveLength(2);
	});

	it("should update edges on SET_EDGES and record history", () => {
		const actor = createActor(goalMapMachine).start();
		actor.send({
			type: "LOADED",
			data: { nodes: [], edges: [] },
		});
		const newEdges = [
			{ id: "e1", source: "a", target: "b" },
		];
		actor.send({ type: "SET_EDGES", edges: newEdges });
		expect(actor.getSnapshot().context.edges).toEqual(newEdges);
		expect(actor.getSnapshot().context.history).toHaveLength(2);
	});

	it("should support undo/redo", () => {
		const actor = createActor(goalMapMachine).start();
		actor.send({
			type: "LOADED",
			data: { nodes: [], edges: [] },
		});
		const nodesA = [
			{ id: "a", type: "text", position: { x: 0, y: 0 }, data: { label: "A" } },
		];
		const nodesB = [
			{ id: "a", type: "text", position: { x: 0, y: 0 }, data: { label: "A" } },
			{ id: "b", type: "text", position: { x: 100, y: 0 }, data: { label: "B" } },
		];
		actor.send({ type: "SET_NODES", nodes: nodesA });
		actor.send({ type: "SET_NODES", nodes: nodesB });
		expect(actor.getSnapshot().context.nodes).toHaveLength(2);
		actor.send({ type: "UNDO" });
		expect(actor.getSnapshot().context.nodes).toHaveLength(1);
		actor.send({ type: "REDO" });
		expect(actor.getSnapshot().context.nodes).toHaveLength(2);
	});

	it("should not undo when at start", () => {
		const actor = createActor(goalMapMachine).start();
		actor.send({
			type: "LOADED",
			data: { nodes: [], edges: [] },
		});
		actor.send({ type: "UNDO" });
		expect(actor.getSnapshot().context.pointer).toBe(0);
	});

	it("should not redo when at latest", () => {
		const actor = createActor(goalMapMachine).start();
		actor.send({
			type: "LOADED",
			data: { nodes: [], edges: [] },
		});
		actor.send({ type: "REDO" });
		expect(actor.getSnapshot().context.pointer).toBe(0);
	});

	it("should handle DELETE_SELECTED and record history", () => {
		const actor = createActor(goalMapMachine).start();
		actor.send({
			type: "LOADED",
			data: {
				nodes: [
					{ id: "a", type: "text", position: { x: 0, y: 0 }, data: { label: "A" } },
					{ id: "b", type: "text", position: { x: 100, y: 0 }, data: { label: "B" } },
				],
				edges: [{ id: "e1", source: "a", target: "b" }],
			},
		});
		actor.send({
			type: "DELETE_SELECTED",
			nodes: [{ id: "a", type: "text", position: { x: 0, y: 0 }, data: { label: "A" } }],
			edges: [],
		});
		expect(actor.getSnapshot().context.nodes).toHaveLength(1);
		expect(actor.getSnapshot().context.edges).toEqual([]);
		expect(actor.getSnapshot().context.history).toHaveLength(2);
	});
});
