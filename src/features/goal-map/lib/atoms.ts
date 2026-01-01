import type { ReactFlowInstance } from "@xyflow/react";
import { atom } from "jotai";
import type { Edge, Node } from "@/features/learner-map/lib/comparator";

// Core state atoms
export const nodesAtom = atom<Node[]>([]);
export const edgesAtom = atom<Edge[]>([]);

// ReactFlow instance
export const rfInstanceAtom = atom<ReactFlowInstance<Node, Edge> | null>(null);

// Toolbar state atoms
export const conceptDialogOpenAtom = atom(false);
export const linkDialogOpenAtom = atom(false);
export const searchOpenAtom = atom(false);
export const directionEnabledAtom = atom(true);

// Image draft state
export const imageDraftAtom = atom<{
	url: string;
	caption?: string;
} | null>(null);

// File import state atoms
export const importDialogOpenAtom = atom(false);
export const materialTextAtom = atom("");
export const imagesAtom = atom<
	Array<{
		id: string;
		url: string;
		name: string;
		type: string;
		size: number;
		uploadedAt: number;
	}>
>([]);

// History state atoms
export const historyAtom = atom<Array<{ nodes: Node[]; edges: Edge[] }>>([
	{ nodes: [], edges: [] },
]);
export const historyPointerAtom = atom(0);
export const isApplyingHistoryAtom = atom(false);
export const isHydratedAtom = atom(false);

// Node context menu state
export type ContextMenuState = {
	nodeId: string;
	nodeType: "text" | "connector";
	position: { x: number; y: number };
} | null;
export const contextMenuAtom = atom<ContextMenuState>(null);

// Connection mode state - for "Connect From/To" from link nodes
export type ConnectionModeState = {
	active: boolean;
	linkNodeId: string;
	direction: "to" | "from"; // "to" = link→concept, "from" = concept→link
} | null;
export const connectionModeAtom = atom<ConnectionModeState>(null);

// Edit node dialog state
export type EditNodeState = {
	id: string;
	type: "text" | "connector";
	label: string;
	color?: string; // Only for text nodes
} | null;
export const editNodeAtom = atom<EditNodeState>(null);
