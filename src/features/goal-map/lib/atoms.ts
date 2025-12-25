import type { Edge, ReactFlowInstance } from "@xyflow/react";
import { atom } from "jotai";
import type { AnyNode } from "@/features/kitbuild/types";

// Core state atoms
export const nodesAtom = atom<AnyNode[]>([]);
export const edgesAtom = atom<Edge[]>([]);

// ReactFlow instance
export const rfInstanceAtom = atom<ReactFlowInstance<AnyNode, Edge> | null>(
	null,
);

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

// Save state atoms
export const saveOpenAtom = atom(false);
export const saveAsOpenAtom = atom(false);
export const saveTopicIdAtom = atom("");
export const saveNameAtom = atom("");
export const saveDescriptionAtom = atom("");
export const saveErrorAtom = atom<string | null>(null);
export const saveWarningsAtom = atom<string[]>([]);
export const lastSavedSnapshotAtom = atom<string | null>(null);

// File import state atoms
export const importDialogOpenAtom = atom(false);
export const materialTextAtom = atom("");
export const imagesAtom = atom<
	Array<{ id: string; url: string; name: string }>
>([]);

// History state atoms
export const historyAtom = atom<Array<{ nodes: AnyNode[]; edges: Edge[] }>>([
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
