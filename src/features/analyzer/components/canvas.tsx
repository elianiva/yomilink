import { ReactFlowProvider, useReactFlow } from "@xyflow/react";
import { ZoomIn, ZoomOut } from "lucide-react";
import { useCallback, useMemo } from "react";

import { Button } from "@/components/ui/button";
import { useAnalyticsEdges } from "@/features/analyzer/lib/use-analytics-edges";

import "@xyflow/react/dist/style.css";
import { useAnalyticsNodes } from "@/features/analyzer/lib/use-analytics-nodes";
import { ConceptMapCanvas } from "@/features/kit/components/concept-map-canvas";
import type { Edge, Node } from "@/features/learner-map/lib/comparator";

interface AnalyticsCanvasProps {
	goalMap: {
		id: string;
		title: string;
		nodes: ReadonlyArray<Node>;
		edges: ReadonlyArray<Edge>;
		direction: "bi" | "uni" | "multi";
	};
	learnerMap?: {
		id: string;
		userId: string;
		userName: string;
		status: string;
		attempt: number;
		submittedAt: number | null;
		nodes: ReadonlyArray<Node>;
		edges: ReadonlyArray<Edge>;
	};
	learnerMaps?: ReadonlyArray<{
		id: string;
		userId: string;
		userName: string;
		status: string;
		attempt: number;
		submittedAt: number | null;
		nodes: ReadonlyArray<Node>;
		edges: ReadonlyArray<Edge>;
	}>;
	edgeClassifications?: ReadonlyArray<{
		edge: Edge;
		type: "correct" | "missing" | "excessive" | "neutral";
		createdBy?: string;
	}>;
	allEdgeClassifications?: ReadonlyArray<{
		edge: Edge;
		type: "correct" | "missing" | "excessive" | "neutral";
		createdBy?: string;
	}>;
	visibility: {
		showGoalMap: boolean;
		showLearnerMap: boolean;
		showCorrectEdges: boolean;
		showMissingEdges: boolean;
		showExcessiveEdges: boolean;
		showNeutralEdges: boolean;
		consolidatedView: boolean;
		showNamesOnHover: boolean;
	};
	isMultiView?: boolean;
	readOnly?: boolean;
}

export function AnalyticsCanvas(props: AnalyticsCanvasProps) {
	return (
		<ReactFlowProvider>
			<AnalyticsCanvasInner {...props} />
		</ReactFlowProvider>
	);
}

function AnalyticsCanvasInner({
	goalMap,
	learnerMap,
	learnerMaps,
	edgeClassifications,
	allEdgeClassifications,
	visibility,
	isMultiView,
	readOnly = true,
}: AnalyticsCanvasProps) {
	const { zoomIn, zoomOut, fitView } = useReactFlow();

	const currentLearnerMaps = useMemo(
		() => (isMultiView ? learnerMaps || [] : learnerMap ? [learnerMap] : []),
		[isMultiView, learnerMaps, learnerMap],
	);

	const currentEdgeClassifications = useMemo(
		() => (isMultiView ? allEdgeClassifications || [] : edgeClassifications || []),
		[isMultiView, allEdgeClassifications, edgeClassifications],
	);

	const nodes = useAnalyticsNodes({
		goalNodes: goalMap.nodes,
		learnerMaps: currentLearnerMaps,
	});

	const edges = useAnalyticsEdges({
		goalEdges: goalMap.edges,
		currentLearnerMaps,
		currentEdgeClassifications,
		visibility,
		isMultiView,
	});

	const displayEdges = edges as Edge[];
	const noop = useCallback(() => {}, []);

	return (
		<div className="flex-1 h-full relative">
			<div className="absolute bottom-4 right-4 z-10 flex flex-col gap-2">
				<Button
					className="size-10"
					variant="floating"
					onClick={() => zoomIn()}
					title="Zoom In"
				>
					<ZoomIn className="size-4" />
				</Button>
				<Button
					className="size-10"
					variant="floating"
					onClick={() => zoomOut()}
					title="Zoom Out"
				>
					<ZoomOut className="size-4" />
				</Button>
				<Button
					className="size-10"
					variant="floating"
					onClick={() => fitView()}
					title="Fit View"
				>
					<span className="text-xs font-semibold">Fit</span>
				</Button>
			</div>
			<ConceptMapCanvas
				nodes={nodes}
				edges={displayEdges}
				onNodesChange={noop}
				onEdgesChange={noop}
				onConnect={noop}
				readOnly={readOnly}
			/>
		</div>
	);
}
