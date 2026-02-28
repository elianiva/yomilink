import { useReactFlow } from "@xyflow/react";
import { useCallback, useEffect, useRef, useState } from "react";

import type { Edge, Node } from "@/features/learner-map/lib/comparator";
import type { HistorySnapshot } from "@/lib/react-flow-types";

interface UseHistoryOptions {
	/** Maximum number of history snapshots to keep (default: 100) */
	maxSnapshots?: number;
	/** When true, undo/redo operations are disabled */
	disabled?: boolean;
}

interface UseHistoryReturn {
	/** Undo the last change */
	undo: () => void;
	/** Redo the last undone change */
	redo: () => void;
	/** Whether undo is available */
	canUndo: boolean;
	/** Whether redo is available */
	canRedo: boolean;
	/** Record current state as a new snapshot */
	recordSnapshot: () => void;
	/** Check if currently applying history (to prevent recording during undo/redo) */
	isApplying: boolean;
}

/**
 * Shared hook for undo/redo history management.
 * Works with useReactFlow for setNodes/setEdges operations.
 *
 * @param nodes - Current nodes array
 * @param edges - Current edges array
 * @param options - Configuration options
 * @returns History control functions and state
 */
export function useHistory(
	nodes: Node[],
	edges: Edge[],
	options: UseHistoryOptions = {},
): UseHistoryReturn {
	const { maxSnapshots = 100, disabled = false } = options;
	const { setNodes, setEdges } = useReactFlow();

	const [history, setHistory] = useState<HistorySnapshot[]>([{ nodes: [], edges: [] }]);
	const [pointer, setPointer] = useState(0);
	const [isApplying, setIsApplying] = useState(false);

	// Track previous nodes/edges to detect changes
	const prevNodesRef = useRef<string>("");
	const prevEdgesRef = useRef<string>("");

	const undo = useCallback(() => {
		if (disabled || pointer <= 0) return;
		const newPointer = pointer - 1;
		setPointer(newPointer);
		const snap = history[newPointer];
		setIsApplying(true);
		setNodes(snap.nodes);
		setEdges(snap.edges);
		requestAnimationFrame(() => {
			setIsApplying(false);
		});
	}, [pointer, history, setNodes, setEdges, disabled]);

	const redo = useCallback(() => {
		if (disabled || pointer >= history.length - 1) return;
		const newPointer = pointer + 1;
		setPointer(newPointer);
		const snap = history[newPointer];
		setIsApplying(true);
		setNodes(snap.nodes);
		setEdges(snap.edges);
		requestAnimationFrame(() => {
			setIsApplying(false);
		});
	}, [pointer, history, setNodes, setEdges, disabled]);

	const recordSnapshot = useCallback(() => {
		if (isApplying || disabled) return;

		const nodesStr = JSON.stringify(nodes);
		const edgesStr = JSON.stringify(edges);

		// Check if anything changed
		if (nodesStr === prevNodesRef.current && edgesStr === prevEdgesRef.current) return;

		prevNodesRef.current = nodesStr;
		prevEdgesRef.current = edgesStr;

		setHistory((prevHistory) => {
			const newHistory = prevHistory.slice(0, pointer + 1);
			newHistory.push({
				nodes: structuredClone(nodes),
				edges: structuredClone(edges),
			});
			if (newHistory.length > maxSnapshots) {
				newHistory.shift();
				return newHistory;
			}
			setPointer(newHistory.length - 1);
			return newHistory;
		});
	}, [nodes, edges, pointer, maxSnapshots, isApplying, disabled]);

	// Automatically record snapshots when nodes/edges change
	useEffect(() => {
		recordSnapshot();
	}, [recordSnapshot]);

	return {
		undo,
		redo,
		canUndo: !disabled && pointer > 0,
		canRedo: !disabled && pointer < history.length - 1,
		recordSnapshot,
		isApplying,
	};
}
