import { useAtom, useAtomValue } from "jotai";
import { useCallback } from "react";
import type { MarkerType } from "@xyflow/react";
import {
	edgesAtom,
	nodesAtom,
	rfInstanceAtom,
	directionEnabledAtom,
} from "../lib/atoms";
import { getLayoutedElements } from "@/features/kitbuild/lib/layout";

const LAYOUT_TIMEOUT_MS = 50;
const FIT_PADDING = 0.2;

export function useViewportControls() {
	const [nodes, setNodes] = useAtom(nodesAtom);
	const [edges, setEdges] = useAtom(edgesAtom);
	const rfInstance = useAtomValue(rfInstanceAtom);
	const [directionEnabled, setDirectionEnabled] = useAtom(directionEnabledAtom);

	const zoomIn = useCallback(() => {
		rfInstance?.zoomIn?.();
	}, [rfInstance]);

	const zoomOut = useCallback(() => {
		rfInstance?.zoomOut?.();
	}, [rfInstance]);

	const fit = useCallback(() => {
		rfInstance?.fitView?.({ padding: FIT_PADDING });
	}, [rfInstance]);

	const centerMap = useCallback(() => {
		rfInstance?.fitView?.({ padding: FIT_PADDING });
	}, [rfInstance]);

	const toggleDirection = useCallback(() => {
		setDirectionEnabled((prev) => !prev);
	}, [setDirectionEnabled]);

	const autoLayout = useCallback(() => {
		const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
			nodes,
			edges,
			"LR",
		);
		setNodes(layoutedNodes);
		setEdges(layoutedEdges);
		setTimeout(() => {
			rfInstance?.fitView?.({ padding: FIT_PADDING });
		}, LAYOUT_TIMEOUT_MS);
	}, [nodes, edges, setNodes, setEdges, rfInstance]);

	const updateEdgeMarkers = useCallback(() => {
		setEdges((eds) =>
			eds.map((edge) => ({
				...edge,
				markerEnd: directionEnabled
					? { type: "arrowclosed" as MarkerType, color: "#16a34a" }
					: undefined,
			})),
		);
	}, [directionEnabled, setEdges]);

	return {
		zoomIn,
		zoomOut,
		fit,
		centerMap,
		toggleDirection,
		autoLayout,
		updateEdgeMarkers,
	};
}
