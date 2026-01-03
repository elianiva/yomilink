import { useAtom } from "jotai";
import { useGraphChangeHandlers } from "@/hooks/use-graph-change-handlers";
import { edgesAtom, nodesAtom } from "../lib/atoms";

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
