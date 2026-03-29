import { useReactFlow } from "@xyflow/react";
import { useAtom } from "jotai";
import { useCallback } from "react";

import { getLayoutedElements } from "@/features/kitbuild/lib/layout";

import { edgesAtom, nodesAtom } from "../lib/atoms";

const LAYOUT_TIMEOUT_MS = 50;
const FIT_PADDING = 0.2;

export function useViewportControls() {
	const [nodes, setNodes] = useAtom(nodesAtom);
	const [edges, setEdges] = useAtom(edgesAtom);
	const { zoomIn: rfZoomIn, zoomOut: rfZoomOut, fitView } = useReactFlow();

	const zoomIn = useCallback(() => {
		void rfZoomIn();
	}, [rfZoomIn]);

	const zoomOut = useCallback(() => {
		void rfZoomOut();
	}, [rfZoomOut]);

	const fit = useCallback(() => {
		void fitView({ padding: FIT_PADDING });
	}, [fitView]);

	const centerMap = useCallback(() => {
		void fitView({ padding: FIT_PADDING });
	}, [fitView]);

	const autoLayout = useCallback(() => {
		const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
			nodes,
			edges,
			"LR",
		);
		setNodes(layoutedNodes);
		setEdges(layoutedEdges);
		setTimeout(() => {
			void fitView({ padding: FIT_PADDING });
		}, LAYOUT_TIMEOUT_MS);
	}, [nodes, edges, setNodes, setEdges, fitView]);

	return {
		zoomIn,
		zoomOut,
		fit,
		centerMap,
		autoLayout,
	};
}
