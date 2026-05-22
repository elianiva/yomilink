import { setup, assign, assertEvent } from "xstate";

import type { Edge, Node } from "@/features/learner-map/lib/comparator";

export type Condition = "concept_map" | "summarizing" | null;

export interface AssignmentSummaryData {
	assignment: {
		id: string;
		title: string;
		description: string | null;
		readingMaterial: string | null;
		timeLimitMinutes: number | null;
		goalMapId: string;
		kitId: string;
		dueAt: number | undefined;
		preTestFormId: string | null;
		postTestFormId: string | null;
		delayedPostTestFormId: string | null;
		delayedPostTestDelayDays: number | null;
		tamFormId: string | null;
	};
	learnerMap: {
		id: string;
		nodes: readonly unknown[];
		edges: readonly unknown[];
		status: string;
		attempt: number;
		controlText: string | null;
	} | null;
	kit: { id: string; nodes: readonly unknown[]; edges: readonly unknown[] };
	materialText: string | null;
	studyGroup: string | null;
}

export type LearnerMapEvent =
	| { type: "LOADED"; data: AssignmentSummaryData; condition: Condition }
	| { type: "LOAD_ERROR" }
	| { type: "SET_NODES"; nodes: Node[] }
	| { type: "SET_EDGES"; edges: Edge[] }
	| { type: "SET_CONTROL_TEXT"; text: string }
	| { type: "SAVE" }
	| { type: "SAVE_DONE" }
	| { type: "SUBMIT" }
	| { type: "SUBMIT_DONE" }
	| { type: "SUBMIT_ERROR" }
	| { type: "CONTROL_SUBMIT" }
	| { type: "CONTROL_SUBMIT_DONE" }
	| { type: "CONTROL_SUBMIT_ERROR" };

export interface LearnerMapContext {
	assignmentData: AssignmentSummaryData | null;
	condition: Condition;
	nodes: Node[];
	edges: Edge[];
	controlText: string;
	learnerMapId: string | null;
	attempt: number;
	lastSavedSnapshot: string | null;
}

export const learnerMapMachine = setup({
	types: {
		context: {} as LearnerMapContext,
		events: {} as LearnerMapEvent,
	},
	actions: {
		assignLoadData: assign({
			assignmentData: ({ event }) => {
				assertEvent(event, "LOADED");
				return event.data;
			},
			condition: ({ event }) => {
				assertEvent(event, "LOADED");
				return event.condition;
			},
			learnerMapId: ({ event }) => {
				assertEvent(event, "LOADED");
				return event.data.learnerMap?.id ?? null;
			},
			attempt: ({ event }) => {
				assertEvent(event, "LOADED");
				return event.data.learnerMap?.attempt ?? 0;
			},
			nodes: ({ event }) => {
				assertEvent(event, "LOADED");
				if (event.data.learnerMap) {
					return [...event.data.learnerMap.nodes] as Node[];
				}
				return [...event.data.kit.nodes] as Node[];
			},
			edges: ({ event }) => {
				assertEvent(event, "LOADED");
				if (event.data.learnerMap) {
					return [...event.data.learnerMap.edges] as Edge[];
				}
				return [];
			},
			controlText: ({ event }) => {
				assertEvent(event, "LOADED");
				return event.data.learnerMap?.controlText ?? "";
			},
			lastSavedSnapshot: ({ event }) => {
				assertEvent(event, "LOADED");
				if (event.condition === "summarizing") {
					return event.data.learnerMap?.controlText ?? "";
				}
				if (event.data.learnerMap) {
					return JSON.stringify({
						nodes: event.data.learnerMap.nodes,
						edges: event.data.learnerMap.edges,
					});
				}
				return JSON.stringify({ nodes: event.data.kit.nodes, edges: [] });
			},
		}),
		setControlText: assign({
			controlText: ({ event }) => {
				assertEvent(event, "SET_CONTROL_TEXT");
				return event.text;
			},
		}),
		setLastSavedSnapshot: assign({
			lastSavedSnapshot: ({ context }) => {
				if (context.condition === "summarizing") {
					return context.controlText;
				}
				return JSON.stringify({ nodes: context.nodes, edges: context.edges });
			},
		}),
		setNodes: assign({
			nodes: ({ event }) => {
				assertEvent(event, "SET_NODES");
				return event.nodes;
			},
		}),
		setEdges: assign({
			edges: ({ event }) => {
				assertEvent(event, "SET_EDGES");
				return event.edges;
			},
		}),
	},
}).createMachine({
	id: "learner-map",
	initial: "loading",
	context: {
		assignmentData: null,
		condition: null,
		nodes: [],
		edges: [],
		controlText: "",
		learnerMapId: null,
		attempt: 0,
		lastSavedSnapshot: null,
	},
	states: {
		loading: {
			on: {
				LOADED: [
					{
						guard: ({ event }) => event.condition === "concept_map",
						target: "conceptMap",
						actions: "assignLoadData",
					},
					{
						guard: ({ event }) => event.condition === "summarizing",
						target: "summarizing",
						actions: "assignLoadData",
					},
					{
						target: "error",
					},
				],
				LOAD_ERROR: "error",
			},
		},
		error: {},
		conceptMap: {
			initial: "drafting",
			states: {
				drafting: {
					on: {
						SET_NODES: {
							actions: "setNodes",
						},
						SET_EDGES: {
							actions: "setEdges",
						},
						SAVE: {
							actions: "setLastSavedSnapshot",
						},
						SUBMIT: "submitting",
					},
				},
				submitting: {
					on: {
						SUBMIT_DONE: "submitted",
						SUBMIT_ERROR: "drafting",
					},
				},
				submitted: {
					type: "final",
				},
			},
		},
		summarizing: {
			initial: "drafting",
			states: {
				drafting: {
					on: {
						SET_CONTROL_TEXT: {
							actions: "setControlText",
						},
						CONTROL_SUBMIT: "submitting",
					},
				},
				submitting: {
					on: {
						CONTROL_SUBMIT_DONE: "submitted",
						CONTROL_SUBMIT_ERROR: "drafting",
					},
				},
				submitted: {
					type: "final",
				},
			},
		},
	},
});
