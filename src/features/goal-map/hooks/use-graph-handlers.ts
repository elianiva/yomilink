import type { EdgeChange, NodeChange } from "@xyflow/react";
import { useAtom } from "jotai";
import { useCallback } from "react";
import type { Edge, Node } from "@/features/learner-map/lib/comparator";
import { edgesAtom, nodesAtom } from "../lib/atoms";

/**
 * Core hook for handling ReactFlow graph changes.
 * Works with any state management (useState, Jotai, etc.) via callbacks.
 */
export function useGraphChangeHandlers(
	setNodes: (updater: (nodes: Node[]) => Node[]) => void,
	setEdges: (updater: (edges: Edge[]) => Edge[]) => void,
) {
	const onNodesChange = useCallback(
		(changes: NodeChange<Node>[]) => {
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
		[setNodes],
	);

	const onEdgesChange = useCallback(
		(changes: EdgeChange<Edge>[]) => {
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
		[setEdges],
	);

	return { onNodesChange, onEdgesChange };
}

/**
 * Graph handlers using Jotai atoms for state management.
 * Used by the goal-map editor.
 */
export function useGraphHandlers() {
	const [nodes, setNodes] = useAtom(nodesAtom);
	const [edges, setEdges] = useAtom(edgesAtom);
	const { onNodesChange, onEdgesChange } = useGraphChangeHandlers(
		setNodes,
		setEdges,
	);

	return { nodes, edges, onNodesChange, onEdgesChange, setNodes, setEdges };
}
