import { atom } from "jotai";
import type { Edge, Node } from "./comparator";

// Assignment data
export const assignmentAtom = atom<{
	id: string;
	title: string;
	description?: string | null;
	goalMapId: string;
	kitId: string;
	dueAt?: number | null;
} | null>(null);

// Kit data (original nodes from kit)
export const kitNodesAtom = atom<Node[]>([]);

// Material text for reference
export const materialTextAtom = atom<string>("");

// Learner map state
export const learnerNodesAtom = atom<Node[]>([]);
export const learnerEdgesAtom = atom<Edge[]>([]);
export const learnerMapIdAtom = atom<string | null>(null);
export const submissionStatusAtom = atom<
	"draft" | "submitted" | "not_started" | "graded"
>("not_started");
export const attemptAtom = atom<number>(0);

// UI state
export const materialDialogOpenAtom = atom(false);
export const submitDialogOpenAtom = atom(false);
export const searchOpenAtom = atom(false);

// Connection mode for manual edge creation
export const connectionModeAtom = atom<{
	active: boolean;
	linkNodeId: string;
	direction: "to" | "from";
} | null>(null);

// Context menu state
export const contextMenuAtom = atom<{
	nodeId: string;
	nodeType: "text" | "connector";
	position: { x: number; y: number };
} | null>(null);

// History for undo/redo
export interface HistorySnapshot {
	nodes: Node[];
	edges: Edge[];
}

export const historyAtom = atom<HistorySnapshot[]>([]);
export const historyPointerAtom = atom(-1);
export const isApplyingHistoryAtom = atom(false);

// ReactFlow instance
export const rfInstanceAtom = atom<any>(null);

// Dirty state tracking
export const lastSavedSnapshotAtom = atom<string | null>(null);

// Derived atom for checking if there are unsaved changes
export const hasUnsavedChangesAtom = atom((get) => {
	const nodes = get(learnerNodesAtom);
	const edges = get(learnerEdgesAtom);
	const lastSaved = get(lastSavedSnapshotAtom);

	if (lastSaved === null) return false;

	const currentSnapshot = JSON.stringify({ nodes, edges });
	return currentSnapshot !== lastSaved;
});
