import type { NodeChange } from "@xyflow/react";

import type { Edge, Node } from "@/features/learner-map/lib/comparator";

// ── Context shape shared by all graph-editing machines ────
export interface GraphContext {
	nodes: Node[];
	edges: Edge[];
	history: { nodes: Node[]; edges: Edge[] }[];
	pointer: number;
}

// ── Events shared by all graph-editing machines ───────────
export type GraphEvent =
	| { type: "SET_NODES"; nodes: Node[] }
	| { type: "SET_EDGES"; edges: Edge[] }
	| { type: "UNDO" }
	| { type: "REDO" }
	// DELETE_SELECTED is sent with the already-computed result arrays
	// because the machine doesn't track transient selection state.
	| { type: "DELETE_SELECTED"; nodes: Node[]; edges: Edge[] };

// ── Pure helpers for machine actions & guards ─────────────
export function recordSnapshot(ctx: GraphContext, next: { nodes: Node[]; edges: Edge[] }) {
	return ctx.history.slice(0, ctx.pointer + 1).concat([next]);
}

export function canUndo(ctx: GraphContext) {
	return ctx.pointer > 0;
}

export function canRedo(ctx: GraphContext) {
	return ctx.pointer < ctx.history.length - 1;
}

// ── ReactFlow change helpers (component layer) ────────────
export function filterSelectChanges(changes: NodeChange<Node>[]): NodeChange<Node>[] {
	return changes.filter((c) => c.type !== "select");
}
