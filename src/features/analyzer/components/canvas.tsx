import type { Edge, MarkerType, Node } from "@xyflow/react";
import { Background, MiniMap, ReactFlow, useReactFlow } from "@xyflow/react";
import { ZoomIn, ZoomOut } from "lucide-react";
import { useMemo } from "react";
import { Effect } from "effect";
import { ConnectorNode } from "@/features/kitbuild/components/connector-node";
import { FloatingEdge } from "@/features/kitbuild/components/floating-edge";
import { TextNode } from "@/features/kitbuild/components/text-node";
import { safeParseJson } from "@/lib/utils";

interface AnalyticsCanvasProps {
	goalMap: {
		id: string;
		title: string;
		nodes: string | Node[];
		edges: Edge[];
		direction: "bi" | "uni" | "multi";
	};
	learnerMap: {
		id: string;
		userId: string;
		userName: string;
		status: string;
		attempt: number;
		submittedAt: number | null;
		nodes: string | Node[];
		edges: Edge[];
	};
	edgeClassifications: Array<{
		edge: Edge;
		type: "correct" | "missing" | "excessive" | "neutral";
	}>;
	visibility: {
		showGoalMap: boolean;
		showLearnerMap: boolean;
		showCorrectEdges: boolean;
		showMissingEdges: boolean;
		showExcessiveEdges: boolean;
		showNeutralEdges: boolean;
	};
}

const nodeTypes = {
	text: TextNode,
	connector: ConnectorNode,
};

const edgeTypes = {
	floating: FloatingEdge,
};

function getEdgeStyleByType(
	type: "correct" | "missing" | "excessive" | "neutral",
) {
	switch (type) {
		case "correct":
			return {
				stroke: "#22c55e",
				strokeWidth: 3,
			};
		case "excessive":
			return {
				stroke: "#3b82f6",
				strokeWidth: 3,
			};
		case "missing":
			return {
				stroke: "#ef4444",
				strokeWidth: 2,
				strokeDasharray: "5,5",
			};
		case "neutral":
			return {
				stroke: "#64748b",
				strokeWidth: 2,
			};
	}
}

export function AnalyticsCanvas({
	goalMap,
	learnerMap,
	edgeClassifications,
	visibility,
}: AnalyticsCanvasProps) {
	const { zoomIn, zoomOut, fitView } = useReactFlow();

	const goalMapNodes = useMemo(() => {
		const nodes: Node[] = Effect.runSync(safeParseJson(goalMap.nodes, []));

		if (!visibility.showGoalMap) return [];

		return nodes.map((node) => ({
			...node,
			style: {
				...node.style,
				opacity: 0.3,
				borderStyle: "dashed",
			},
			data: {
				...node.data,
				opacity: 0.3,
				dashed: true,
			},
		}));
	}, [goalMap.nodes, visibility.showGoalMap]);

	const learnerMapNodes = useMemo(() => {
		if (!visibility.showLearnerMap) return [];

		const nodes: Node[] = Effect.runSync(safeParseJson(learnerMap.nodes, []));

		return nodes;
	}, [learnerMap.nodes, visibility.showLearnerMap]);

	const combinedNodes = useMemo(() => {
		if (visibility.showGoalMap && visibility.showLearnerMap) {
			return goalMapNodes;
		}
		if (visibility.showGoalMap) {
			return goalMapNodes;
		}
		if (visibility.showLearnerMap) {
			return learnerMapNodes;
		}
		return [];
	}, [
		goalMapNodes,
		learnerMapNodes,
		visibility.showGoalMap,
		visibility.showLearnerMap,
	]);

	const filteredEdges = useMemo(() => {
		const edges: Edge[] = edgeClassifications
			.filter((classification) => {
				switch (classification.type) {
					case "correct":
						return visibility.showCorrectEdges;
					case "missing":
						return visibility.showMissingEdges;
					case "excessive":
						return visibility.showExcessiveEdges;
					case "neutral":
						return visibility.showNeutralEdges;
					default:
						return false;
				}
			})
			.map((classification) => {
				const style = getEdgeStyleByType(classification.type);
				return {
					...classification.edge,
					type: "floating",
					style,
					animated: classification.type === "missing",
					markerEnd: {
						type: "arrowclosed" as MarkerType,
						color: style.stroke,
					},
				};
			});

		return edges;
	}, [
		edgeClassifications,
		visibility.showCorrectEdges,
		visibility.showMissingEdges,
		visibility.showExcessiveEdges,
		visibility.showNeutralEdges,
	]);

	return (
		<div className="w-full h-full relative">
			<div className="absolute bottom-4 right-4 z-10 flex flex-col gap-2">
				<button
					type="button"
					className="size-8 flex items-center justify-center rounded-md border bg-background shadow-sm hover:bg-accent"
					onClick={() => zoomIn()}
					title="Zoom In"
				>
					<ZoomIn className="size-4" />
				</button>
				<button
					type="button"
					className="size-8 flex items-center justify-center rounded-md border bg-background shadow-sm hover:bg-accent"
					onClick={() => zoomOut()}
					title="Zoom Out"
				>
					<ZoomOut className="size-4" />
				</button>
				<button
					type="button"
					className="size-8 flex items-center justify-center rounded-md border bg-background shadow-sm hover:bg-accent"
					onClick={() => fitView()}
					title="Fit View"
				>
					<span className="text-xs font-semibold">Fit</span>
				</button>
			</div>
			<ReactFlow
				nodes={combinedNodes}
				edges={filteredEdges}
				nodeTypes={nodeTypes}
				edgeTypes={edgeTypes}
				nodesDraggable={false}
				nodesConnectable={false}
				elementsSelectable={false}
				panOnDrag
				zoomOnScroll
				fitView
			>
				<MiniMap />
				<Background gap={16} />
			</ReactFlow>
		</div>
	);
}
