import { atom } from "jotai";

import type { Edge, Node } from "@/features/learner-map/lib/comparator";
import type {
	ContextMenuState as LibContextMenuState,
	ConnectionModeState as LibConnectionModeState,
	EdgeContextMenuState,
} from "@/lib/react-flow-types";

export const nodesAtom = atom<Node[]>([]);
export const edgesAtom = atom<Edge[]>([]);

export const graphStateAtom = atom((get) => ({
	nodes: get(nodesAtom),
	edges: get(edgesAtom),
}));

export const conceptDialogOpenAtom = atom(false);
export const linkDialogOpenAtom = atom(false);
export const searchDialogOpenAtom = atom(false);
export const searchOpenAtom = searchDialogOpenAtom;

export const materialDialogOpenAtom = atom(false);
export const importDialogOpenAtom = materialDialogOpenAtom;

export interface UploadedImage {
	readonly id: string;
	readonly url: string;
	readonly name: string;
	readonly type: string;
	readonly size: number;
	readonly uploadedAt: number;
}

export interface ImageDraft {
	readonly url: string;
	readonly caption?: string;
}

export const imageDraftAtom = atom<ImageDraft | null>(null);
export const imagesAtom = atom<UploadedImage[]>([]);

export const materialTextAtom = atom("");

export interface HistoryEntry {
	readonly nodes: Node[];
	readonly edges: Edge[];
}

export const historyAtom = atom<HistoryEntry[]>([{ nodes: [], edges: [] }]);
export { historyAtom as historyAtomWithPointer };

export const historyPointerAtom = atom(0);
export { historyPointerAtom as historyPointer };

export const isApplyingHistoryAtom = atom(false);

export type ContextMenuState = LibContextMenuState;
export const contextMenuAtom = atom<ContextMenuState>(null);
export const edgeContextMenuAtom = atom<EdgeContextMenuState>(null);

export type ConnectionModeState = LibConnectionModeState;
export const connectionModeAtom = atom<ConnectionModeState>(null);

export interface EditNodeData {
	readonly id: string;
	readonly type: "text" | "connector";
	readonly label: string;
	readonly color?: string;
}

export type EditNodeState = EditNodeData | null;

export const editNodeAtom = atom<EditNodeState>(null);
export { editNodeAtom as editNode };
