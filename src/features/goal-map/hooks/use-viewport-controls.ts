import { useReactFlow, type MarkerType } from "@xyflow/react";
import { useAtom } from "jotai";
import { useCallback } from "react";

import { getLayoutedElements } from "@/features/kitbuild/lib/layout";

import { edgesAtom, nodesAtom, directionEnabledAtom } from "../lib/atoms";

const LAYOUT_TIMEOUT_MS = 50;
const FIT_PADDING = 0.2;

export function useViewportControls() {
	const [nodes, setNodes] = useAtom(nodesAtom);
	const [edges, setEdges] = useAtom(edgesAtom);
	const { zoomIn: rfZoomIn, zoomOut: rfZoomOut, fitView } = useReactFlow();
	const [directionEnabled, setDirectionEnabled] = useAtom(directionEnabledAtom);

	const zoomIn = useCallback(() => {
		rfZoomIn();
	}, [rfZoomIn]);

	const zoomOut = useCallback(() => {
		rfZoomOut();
	}, [rfZoomOut]);

	const fit = useCallback(() => {
		fitView({ padding: FIT_PADDING });
	}, [fitView]);

	const centerMap = useCallback(() => {
		fitView({ padding: FIT_PADDING });
	}, [fitView]);

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
			fitView({ padding: FIT_PADDING });
		}, LAYOUT_TIMEOUT_MS);
	}, [nodes, edges, setNodes, setEdges, fitView]);

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
