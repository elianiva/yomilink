import type { Edge, ReactFlowInstance } from "@xyflow/react";
import { atom } from "jotai";
import type { TailwindColor } from "@/features/kitbuild/components/color-picker";
import { DEFAULT_COLOR } from "@/features/kitbuild/components/color-picker";
import type { AnyNode } from "@/features/kitbuild/types";

// Core state atoms
export const nodesAtom = atom<AnyNode[]>([]);
export const edgesAtom = atom<Edge[]>([]);

// ReactFlow instance
export const rfInstanceAtom = atom<ReactFlowInstance<AnyNode, Edge> | null>(
	null,
);

// Toolbar state atoms
export const selectedColorAtom = atom<TailwindColor>(DEFAULT_COLOR);
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
export const saveTopicAtom = atom("");
export const saveNameAtom = atom("");
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
