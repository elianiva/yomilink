/**
 * Shared React Flow types used across goal-map and learner-map features.
 */

import type { Edge, Node } from "@/features/learner-map/lib/comparator";

/**
 * Context menu state for node interactions.
 * Used when right-clicking on a node to show edit/delete/connect options.
 */
export type ContextMenuState = {
	nodeId: string;
	nodeType: "text" | "connector";
	position: { x: number; y: number };
} | null;

/**
 * Connection mode state for manual edge creation.
 * Active when user clicks "Connect To" or "Connect From" on a link node.
 */
export type ConnectionModeState = {
	active: boolean;
	linkNodeId: string;
	direction: "to" | "from"; // "to" = link→concept, "from" = concept→link
} | null;

/**
 * History snapshot for undo/redo functionality.
 */
export interface HistorySnapshot {
	nodes: Node[];
	edges: Edge[];
}

/**
 * Validates if a connection between nodes is valid.
 * Rules:
 * - Connections must go through a connector (link) node
 * - text→connector or connector→text is valid
 * - text→text or connector→connector is invalid
 * - A node cannot connect to itself (same source and target node ID)
 */
export function isValidConnection(
	sourceType: string | undefined,
	targetType: string | undefined,
	sourceId?: string,
	targetId?: string,
): boolean {
	// A node cannot connect to itself
	if (sourceId && targetId && sourceId === targetId) return false;
	// If types are the same, connection is invalid (must go through connector)
	if (sourceType === targetType) return false;
	// One must be 'text' (concept) and one must be 'connector' (link)
	const types = [sourceType, targetType];
	return types.includes("text") && types.includes("connector");
}

/**
 * Checks if two nodes already have an edge between them (in either direction).
 */
export function areNodesConnected(
	edges: readonly { source: string; target: string }[],
	nodeA: string,
	nodeB: string,
): boolean {
	return edges.some(
		(e) =>
			(e.source === nodeA && e.target === nodeB) ||
			(e.source === nodeB && e.target === nodeA),
	);
}
