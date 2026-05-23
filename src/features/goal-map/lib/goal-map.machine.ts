import { setup, assign, assertEvent } from "xstate";

import {
	recordSnapshot,
	canUndo,
	canRedo,
	type GraphContext,
	type GraphEvent,
} from "@/features/kit/lib/graph-machine";
import type { Edge, Node } from "@/features/learner-map/lib/comparator";

export interface LoadedGoalMap {
	nodes: Node[];
	edges: Edge[];
}

export type GoalMapEvent =
	| { type: "LOADED"; data: LoadedGoalMap }
	| { type: "LOAD_ERROR" }
	| GraphEvent;

interface FullContext extends GraphContext {}

export const goalMapMachine = setup({
	types: {
		context: {} as FullContext,
		events: {} as GoalMapEvent,
	},
	actions: {
		assignLoadData: assign({
			nodes: ({ event }) => {
				assertEvent(event, "LOADED");
				return event.data.nodes;
			},
			edges: ({ event }) => {
				assertEvent(event, "LOADED");
				return event.data.edges;
			},
			history: ({ event }) => {
				assertEvent(event, "LOADED");
				return [{ nodes: event.data.nodes, edges: event.data.edges }];
			},
			pointer: () => 0,
		}),
		recordAndSetNodes: assign({
			history: ({ context, event }) => {
				assertEvent(event, "SET_NODES");
				return recordSnapshot(context, {
					nodes: event.nodes,
					edges: context.edges,
				});
			},
			pointer: ({ context }) => context.pointer + 1,
			nodes: ({ event }) => {
				assertEvent(event, "SET_NODES");
				return event.nodes;
			},
		}),
		recordAndSetEdges: assign({
			history: ({ context, event }) => {
				assertEvent(event, "SET_EDGES");
				return recordSnapshot(context, {
					nodes: context.nodes,
					edges: event.edges,
				});
			},
			pointer: ({ context }) => context.pointer + 1,
			edges: ({ event }) => {
				assertEvent(event, "SET_EDGES");
				return event.edges;
			},
		}),
		recordAndDeleteSelected: assign({
			history: ({ context, event }) => {
				assertEvent(event, "DELETE_SELECTED");
				return recordSnapshot(context, {
					nodes: event.nodes,
					edges: event.edges,
				});
			},
			pointer: ({ context }) => context.pointer + 1,
			nodes: ({ event }) => {
				assertEvent(event, "DELETE_SELECTED");
				return event.nodes;
			},
			edges: ({ event }) => {
				assertEvent(event, "DELETE_SELECTED");
				return event.edges;
			},
		}),
		undo: assign({
			pointer: ({ context }) => context.pointer - 1,
			nodes: ({ context }) => context.history[context.pointer - 1].nodes,
			edges: ({ context }) => context.history[context.pointer - 1].edges,
		}),
		redo: assign({
			pointer: ({ context }) => context.pointer + 1,
			nodes: ({ context }) => context.history[context.pointer + 1].nodes,
			edges: ({ context }) => context.history[context.pointer + 1].edges,
		}),
	},
	guards: {
		canUndo: ({ context }) => canUndo(context),
		canRedo: ({ context }) => canRedo(context),
	},
}).createMachine({
	id: "goal-map",
	initial: "loading",
	context: {
		nodes: [],
		edges: [],
		history: [{ nodes: [], edges: [] }],
		pointer: 0,
	},
	states: {
		loading: {
			on: {
				LOADED: {
					target: "editing",
					actions: "assignLoadData",
				},
				LOAD_ERROR: "error",
			},
		},
		editing: {
			on: {
				SET_NODES: {
					actions: "recordAndSetNodes",
				},
				SET_EDGES: {
					actions: "recordAndSetEdges",
				},
				DELETE_SELECTED: {
					actions: "recordAndDeleteSelected",
				},
				UNDO: {
					guard: "canUndo",
					actions: "undo",
				},
				REDO: {
					guard: "canRedo",
					actions: "redo",
				},
			},
		},
		error: {},
	},
});
