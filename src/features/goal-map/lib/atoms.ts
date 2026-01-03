import { atom } from "jotai";
import type { Edge, Node } from "@/features/learner-map/lib/comparator";
import type {
	ConnectionModeState,
	ContextMenuState,
} from "@/lib/react-flow-types";

// Core state atoms
export const nodesAtom = atom<Node[]>([]);
export const edgesAtom = atom<Edge[]>([]);

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
export const contextMenuAtom = atom<ContextMenuState>(null);

// Connection mode state - for "Connect From/To" from link nodes
export const connectionModeAtom = atom<ConnectionModeState>(null);

// Edit node dialog state
export type EditNodeState = {
	id: string;
	type: "text" | "connector";
	label: string;
	color?: string; // Only for text nodes
} | null;
export const editNodeAtom = atom<EditNodeState>(null);
