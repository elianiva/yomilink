import { atom } from "jotai";

import type { ContextMenuState as LibContextMenuState } from "@/lib/react-flow-types";

// ── Canvas UI state (needed by kit components) ────────────
export type ContextMenuState = LibContextMenuState;
export const contextMenuAtom = atom<ContextMenuState>(null);

export interface EditNodeData {
	readonly id: string;
	readonly type: "text" | "connector";
	readonly label: string;
	readonly color?: string;
}

export type EditNodeState = EditNodeData | null;

export const editNodeAtom = atom<EditNodeState>(null);

// ── Dialog state ──────────────────────────────────────────
export const conceptDialogOpenAtom = atom(false);
export const linkDialogOpenAtom = atom(false);
export const searchOpenAtom = atom(false);
export const materialDialogOpenAtom = atom(false);

// ── Material state ────────────────────────────────────────
export interface UploadedImage {
	readonly id: string;
	readonly url: string;
	readonly name: string;
	readonly type: string;
	readonly size: number;
	readonly uploadedAt: number;
}

export const imagesAtom = atom<UploadedImage[]>([]);
export const materialTextAtom = atom("");
