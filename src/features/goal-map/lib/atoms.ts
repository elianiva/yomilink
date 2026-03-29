import { atom } from "jotai";

import type { Edge, Node } from "@/features/learner-map/lib/comparator";
import type {
	ContextMenuState as LibContextMenuState,
	ConnectionModeState as LibConnectionModeState,
} from "@/lib/react-flow-types";

// ============================================
// Core Graph State
// ============================================

/** Current nodes in the goal map */
export const nodesAtom = atom<Node[]>([]);

/** Current edges in the goal map */
export const edgesAtom = atom<Edge[]>([]);

/** Combined graph state for operations that need both */
export const graphStateAtom = atom((get) => ({
	nodes: get(nodesAtom),
	edges: get(edgesAtom),
}));

// ============================================
// Dialog State
// ============================================

/** Controls visibility of the add concept dialog */
export const conceptDialogOpenAtom = atom(false);

/** Controls visibility of the add/edit link dialog */
export const linkDialogOpenAtom = atom(false);

/** Controls visibility of the search dialog */
export const searchDialogOpenAtom = atom(false);

// Backward compatible alias
export const searchOpenAtom = searchDialogOpenAtom;

/** Controls visibility of the file import dialog */
export const importDialogOpenAtom = atom(false);

// ============================================
// Image State
// ============================================

/** Represents an image that has been uploaded and processed */
export interface UploadedImage {
	readonly id: string;
	readonly url: string;
	readonly name: string;
	readonly type: string;
	readonly size: number;
	readonly uploadedAt: number;
}

/** Draft image being previewed before finalizing */
export interface ImageDraft {
	readonly url: string;
	readonly caption?: string;
}

/** Currently selected image draft for the concept dialog */
export const imageDraftAtom = atom<ImageDraft | null>(null);

/** All images that have been uploaded for the current goal map */
export const imagesAtom = atom<UploadedImage[]>([]);

// ============================================
// Material State
// ============================================

/** The imported material text content */
export const materialTextAtom = atom("");

// ============================================
// History/Undo State
// ============================================

/** A single entry in the history stack */
export interface HistoryEntry {
	readonly nodes: Node[];
	readonly edges: Edge[];
}

/** Full history stack for undo/redo functionality */
export const historyAtom = atom<HistoryEntry[]>([{ nodes: [], edges: [] }]);

// Backward compatible export
export { historyAtom as historyAtomWithPointer };

/**
 * Current position in the history stack.
 * 0 = initial state, history.length - 1 = most recent state.
 * @deprecated Use historyPointer to match old naming
 */
export const historyPointerAtom = atom(0);

// Backward compatible name
export { historyPointerAtom as historyPointer };

export const isApplyingHistoryAtom = atom(false);

// ============================================
// Hydration State
// ============================================

/**
 * Indicates whether the goal map state has been hydrated
 * from the server/localStorage. Prevents hydration mismatches.
 */
export const isHydratedAtom = atom(false);

// ============================================
// Context Menu State
// ============================================

/** Re-export from lib/react-flow-types for compatibility */
export type ContextMenuState = LibContextMenuState;

export const contextMenuAtom = atom<ContextMenuState>(null);

// ============================================
// Connection Mode State
// ============================================

/** Re-export from lib/react-flow-types for compatibility */
export type ConnectionModeState = LibConnectionModeState;

export const connectionModeAtom = atom<ConnectionModeState>(null);

// ============================================
// Edit Node State
// ============================================

export interface EditNodeData {
	readonly id: string;
	readonly type: "text" | "connector";
	readonly label: string;
	/** Only applicable for text nodes */
	readonly color?: string;
}

export type EditNodeState = EditNodeData | null;

export const editNodeAtom = atom<EditNodeState>(null);

// Backward compatible name
export { editNodeAtom as editNode };
