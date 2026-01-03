import type { EdgeChange, NodeChange } from "@xyflow/react";
import { useCallback } from "react";
import type { Edge, Node } from "@/features/learner-map/lib/comparator";

interface UseGraphChangeHandlersOptions {
	/** When true, all changes are ignored (useful for submitted/readonly states) */
	disabled?: boolean;
}

/**
 * Core hook for handling ReactFlow graph changes.
 * Works with any state management (useState, Jotai, etc.) via callbacks.
 *
 * @param setNodes - Function to update nodes state
 * @param setEdges - Function to update edges state
 * @param options - Configuration options
 * @returns Object with onNodesChange and onEdgesChange handlers
 */
export function useGraphChangeHandlers(
	setNodes: (updater: (nodes: Node[]) => Node[]) => void,
	setEdges: (updater: (edges: Edge[]) => Edge[]) => void,
	options: UseGraphChangeHandlersOptions = {},
) {
	const { disabled = false } = options;

	const onNodesChange = useCallback(
		(changes: NodeChange<Node>[]) => {
			if (disabled) return;
			setNodes((nds) => {
				return changes.reduce((acc, change) => {
					if (change.type === "remove") {
						return acc.filter((n) => n.id !== change.id);
					}
					if (change.type === "position") {
						return acc.map((n) =>
							n.id === change.id
								? { ...n, position: change.position || n.position }
								: n,
						);
					}
					if (change.type === "select") {
						return acc.map((n) =>
							n.id === change.id ? { ...n, selected: change.selected } : n,
						);
					}
					if (change.type === "dimensions") {
						return acc.map((n) =>
							n.id === change.id && change.dimensions
								? {
										...n,
										measured: {
											width: change.dimensions.width,
											height: change.dimensions.height,
										},
									}
								: n,
						);
					}
					return acc;
				}, nds);
			});
		},
		[setNodes, disabled],
	);

	const onEdgesChange = useCallback(
		(changes: EdgeChange<Edge>[]) => {
			if (disabled) return;
			setEdges((eds) => {
				return changes.reduce((acc, change) => {
					if (change.type === "remove") {
						return acc.filter((e) => e.id !== change.id);
					}
					if (change.type === "select") {
						return acc.map((e) =>
							e.id === change.id ? { ...e, selected: change.selected } : e,
						);
					}
					return acc;
				}, eds);
			});
		},
		[setEdges, disabled],
	);

	return { onNodesChange, onEdgesChange };
}
