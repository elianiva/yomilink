import { describe, expect, it } from "vite-plus/test";
import { createActor } from "xstate";

import { learnerMapMachine } from "./learner-map.machine";
import type { AssignmentSummaryData, Condition } from "./learner-map.machine";

function mockAssignment(overrides?: Partial<AssignmentSummaryData>): AssignmentSummaryData {
	return {
		assignment: {
			id: "a1",
			title: "Test",
			description: null,
			readingMaterial: null,
			timeLimitMinutes: null,
			goalMapId: "gm-1",
			kitId: "k-1",
			dueAt: undefined,
			preTestFormId: null,
			postTestFormId: null,
			delayedPostTestFormId: null,
			delayedPostTestDelayDays: null,
		},
		learnerMap: null,
		kit: {
			id: "k-1",
			nodes: [],
			edges: [],
		},
		materialText: null,
		studyGroup: null,
		...overrides,
	};
}

function startMachine(condition: Condition, data: AssignmentSummaryData = mockAssignment()) {
	const actor = createActor(learnerMapMachine).start();
	actor.send({ type: "LOADED", data, condition });
	return actor;
}

describe("learnerMapMachine", () => {
	it("should start in loading state", () => {
		const actor = createActor(learnerMapMachine).start();
		expect(actor.getSnapshot().value).toBe("loading");
	});

	it("should transition to conceptMap editing on LOADED with concept_map condition", () => {
		const actor = startMachine("concept_map");
		expect(actor.getSnapshot().value).toEqual({ conceptMap: "drafting" });
	});

	it("should transition to summarizing on LOADED with summarizing condition", () => {
		const actor = startMachine("summarizing");
		expect(actor.getSnapshot().value).toEqual({ summarizing: "drafting" });
	});

	it("should go to error on LOADED with null condition", () => {
		const actor = createActor(learnerMapMachine).start();
		actor.send({ type: "LOADED", data: mockAssignment(), condition: null });
		expect(actor.getSnapshot().value).toBe("error");
	});

	it("should go to error on LOAD_ERROR", () => {
		const actor = createActor(learnerMapMachine).start();
		actor.send({ type: "LOAD_ERROR" });
		expect(actor.getSnapshot().value).toBe("error");
	});

	describe("conceptMap", () => {
		const startConceptMap = () =>
			startMachine(
				"concept_map",
				mockAssignment({
					kit: {
						id: "k-1",
						nodes: [
							{
								id: "a",
								type: "text",
								position: { x: 0, y: 0 },
								data: { label: "A" },
							},
						],
						edges: [],
					},
				}),
			);

		it("should set nodes from kit initially", () => {
			const actor = startConceptMap();
			expect(actor.getSnapshot().context.nodes).toHaveLength(1);
		});

		it("should set nodes from existing learnerMap if present", () => {
			const actor = createActor(learnerMapMachine).start();
			actor.send({
				type: "LOADED",
				data: mockAssignment({
					learnerMap: {
						id: "lm-1",
						nodes: [
							{
								id: "x",
								type: "text",
								position: { x: 0, y: 0 },
								data: { label: "X" },
							},
						],
						edges: [],
						status: "draft",
						attempt: 1,
						controlText: null,
					},
				}),
				condition: "concept_map",
			});
			expect(actor.getSnapshot().context.nodes).toHaveLength(1);
			expect(actor.getSnapshot().context.nodes[0].id).toBe("x");
		});

		it("should update nodes on SET_NODES and record history", () => {
			const actor = startConceptMap();
			const newNodes = [
				{
					id: "b",
					type: "text" as const,
					position: { x: 100, y: 0 },
					data: { label: "B" },
				},
			];
			actor.send({ type: "SET_NODES", nodes: newNodes });
			expect(actor.getSnapshot().context.nodes).toEqual(newNodes);
			expect(actor.getSnapshot().context.history).toHaveLength(2);
		});

		it("should allow undo/redo", () => {
			const actor = startConceptMap();
			const newNodes = [
				{
					id: "b",
					type: "text" as const,
					position: { x: 100, y: 0 },
					data: { label: "B" },
				},
			];
			actor.send({ type: "SET_NODES", nodes: newNodes });
			actor.send({ type: "UNDO" });
			expect(actor.getSnapshot().context.nodes).toHaveLength(1);
			expect(actor.getSnapshot().context.nodes[0].id).toBe("a");
			actor.send({ type: "REDO" });
			expect(actor.getSnapshot().context.nodes).toHaveLength(1);
			expect(actor.getSnapshot().context.nodes[0].id).toBe("b");
		});

		it("should transition to submitting on SUBMIT", () => {
			const actor = startConceptMap();
			actor.send({ type: "SUBMIT" });
			expect(actor.getSnapshot().value).toEqual({ conceptMap: "submitting" });
		});

		it("should transition back to drafting on SUBMIT_ERROR", () => {
			const actor = startConceptMap();
			actor.send({ type: "SUBMIT" });
			actor.send({ type: "SUBMIT_ERROR" });
			expect(actor.getSnapshot().value).toEqual({ conceptMap: "drafting" });
		});

		it("should go to submitted on SUBMIT_DONE", () => {
			const actor = startConceptMap();
			actor.send({ type: "SUBMIT" });
			actor.send({ type: "SUBMIT_DONE" });
			expect(actor.getSnapshot().value).toEqual({ conceptMap: "submitted" });
		});
	});

	describe("summarizing", () => {
		const startSummarizing = () => startMachine("summarizing");

		it("should update controlText on SET_CONTROL_TEXT", () => {
			const actor = startSummarizing();
			actor.send({ type: "SET_CONTROL_TEXT", text: "My summary" });
			expect(actor.getSnapshot().context.controlText).toBe("My summary");
		});

		it("should transition to submitting on CONTROL_SUBMIT", () => {
			const actor = startSummarizing();
			actor.send({ type: "CONTROL_SUBMIT" });
			expect(actor.getSnapshot().value).toEqual({ summarizing: "submitting" });
		});

		it("should go back to drafting on CONTROL_SUBMIT_ERROR", () => {
			const actor = startSummarizing();
			actor.send({ type: "CONTROL_SUBMIT" });
			actor.send({ type: "CONTROL_SUBMIT_ERROR" });
			expect(actor.getSnapshot().value).toEqual({ summarizing: "drafting" });
		});

		it("should go to submitted on CONTROL_SUBMIT_DONE", () => {
			const actor = startSummarizing();
			actor.send({ type: "CONTROL_SUBMIT" });
			actor.send({ type: "CONTROL_SUBMIT_DONE" });
			expect(actor.getSnapshot().value).toEqual({ summarizing: "submitted" });
		});
	});
});
