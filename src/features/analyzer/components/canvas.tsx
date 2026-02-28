import type { Edge, MarkerType, Node } from "@xyflow/react";
import { Background, MiniMap, ReactFlow, ReactFlowProvider, useReactFlow } from "@xyflow/react";
import { ZoomIn, ZoomOut } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { ConnectorNode } from "@/features/kitbuild/components/connector-node";
import { FloatingEdge } from "@/features/kitbuild/components/floating-edge";
import { TextNode } from "@/features/kitbuild/components/text-node";
import { useGraphChangeHandlers } from "@/hooks/use-graph-change-handlers";

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
	}>;
	allEdgeClassifications?: ReadonlyArray<{
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
	isMultiView?: boolean;
}

const nodeTypes = {
	text: TextNode,
	connector: ConnectorNode,
};

const edgeTypes = {
	floating: FloatingEdge,
};

function getEdgeStyleByType(type: "correct" | "missing" | "excessive" | "neutral") {
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
}: AnalyticsCanvasProps) {
	const { zoomIn, zoomOut, fitView } = useReactFlow();

	// Local state for nodes to enable dragging (session-only, resets on refresh)
	const [nodes, setNodes] = useState<Node[]>([]);

	// Use the shared graph change handlers
	const { onNodesChange } = useGraphChangeHandlers(setNodes, () => {});

	// Use single learner map or multiple learner maps
	const currentLearnerMaps = useMemo(
		() => (isMultiView ? learnerMaps || [] : learnerMap ? [learnerMap] : []),
		[isMultiView, learnerMaps, learnerMap],
	);
	const currentEdgeClassifications = useMemo(
		() => (isMultiView ? allEdgeClassifications || [] : edgeClassifications || []),
		[isMultiView, allEdgeClassifications, edgeClassifications],
	);

	// Compute merged nodes from goal map and all learner maps
	const mergedNodes = useMemo(() => {
		const nodeMap = new Map<string, Node>();

		// First, add all goal map nodes with their positions
		for (const node of goalMap.nodes) {
			nodeMap.set(node.id, {
				...node,
				data: {
					...node.data,
				},
			});
		}

		// Then merge all learner map nodes, keeping goal map position if exists
		for (const lm of currentLearnerMaps) {
			for (const node of lm.nodes) {
				const existingNode = nodeMap.get(node.id);
				if (existingNode) {
					// Node exists in goal map, keep goal map position
					nodeMap.set(node.id, {
						...node,
						position: existingNode.position,
					});
				} else {
					// Node only in learner map, add it
					nodeMap.set(node.id, node);
				}
			}
		}

		return Array.from(nodeMap.values());
	}, [goalMap.nodes, currentLearnerMaps]);

	// Initialize nodes when merged nodes change (e.g., when selecting different learner)
	useEffect(() => {
		setNodes(mergedNodes);
	}, [mergedNodes]);

	const { showGoalMap, showLearnerMap } = visibility;

	const displayEdges = useMemo(() => {
		const edgesToDisplay: Edge[] = [];

		if (showGoalMap && showLearnerMap) {
			if (isMultiView) {
				// Multi-view: Aggregate edges and create separate edges per type with badges
				const edgeCounts = new Map<
					string,
					{
						correct: number;
						missing: number;
						excessive: number;
						neutral: number;
					}
				>();

				// Count edge classifications per edge key
				for (const classification of currentEdgeClassifications) {
					const key = `${classification.edge.source}-${classification.edge.target}`;
					const counts = edgeCounts.get(key) || {
						correct: 0,
						missing: 0,
						excessive: 0,
						neutral: 0,
					};
					counts[classification.type]++;
					edgeCounts.set(key, counts);
				}

				// Create separate edges for each type with different curves
				for (const [key, counts] of edgeCounts.entries()) {
					const [source, target] = key.split("-");
					const types: Array<"correct" | "missing" | "excessive" | "neutral"> = [
						"correct",
						"missing",
						"excessive",
						"neutral",
					];
					let curveOffset = 0;

					for (const type of types) {
						const count = counts[type];
						if (count === 0) continue;

						let shouldShow = false;
						switch (type) {
							case "correct":
								shouldShow = visibility.showCorrectEdges;
								break;
							case "missing":
								shouldShow = visibility.showMissingEdges;
								break;
							case "excessive":
								shouldShow = visibility.showExcessiveEdges;
								break;
							case "neutral":
								shouldShow = visibility.showNeutralEdges;
								break;
						}

						if (shouldShow) {
							const style = getEdgeStyleByType(type);
							edgesToDisplay.push({
								id: `${key}-${type}`,
								source,
								target,
								type: "floating",
								style,
								animated: type === "missing",
								markerEnd: {
									type: "arrowclosed" as MarkerType,
									color: style.stroke,
								},
								data: {
									badge: count.toString(),
									curveOffset,
								},
							});
							curveOffset += 30; // Offset for next edge type
						}
					}
				}
			} else {
				// Single learner: Show merged edges from edgeClassifications
				for (const classification of currentEdgeClassifications) {
					let shouldShow = false;
					switch (classification.type) {
						case "correct":
							shouldShow = visibility.showCorrectEdges;
							break;
						case "missing":
							shouldShow = visibility.showMissingEdges;
							break;
						case "excessive":
							shouldShow = visibility.showExcessiveEdges;
							break;
						case "neutral":
							shouldShow = visibility.showNeutralEdges;
							break;
					}
					if (shouldShow) {
						const style = getEdgeStyleByType(classification.type);
						edgesToDisplay.push({
							...classification.edge,
							type: "floating",
							style,
							animated: classification.type === "missing",
							markerEnd: {
								type: "arrowclosed" as MarkerType,
								color: style.stroke,
							},
						});
					}
				}
			}
		} else if (showGoalMap) {
			// Show only goal map edges (uniform reference style)
			for (const edge of goalMap.edges) {
				edgesToDisplay.push({
					...edge,
					type: "floating",
					style: {
						stroke: "#64748b",
						strokeWidth: 2,
					},
					markerEnd: {
						type: "arrowclosed" as MarkerType,
						color: "#64748b",
					},
				});
			}
		} else if (showLearnerMap) {
			if (isMultiView) {
				// Multi-view: Show aggregated edges without missing
				const edgeCounts = new Map<
					string,
					{
						correct: number;
						excessive: number;
						neutral: number;
					}
				>();

				// Count edge classifications per edge key
				for (const classification of currentEdgeClassifications) {
					if (classification.type === "missing") continue;

					const key = `${classification.edge.source}-${classification.edge.target}`;
					const counts = edgeCounts.get(key) || {
						correct: 0,
						excessive: 0,
						neutral: 0,
					};
					counts[classification.type as "correct" | "excessive" | "neutral"]++;
					edgeCounts.set(key, counts);
				}

				// Create separate edges for each type with different curves
				for (const [key, counts] of edgeCounts.entries()) {
					const [source, target] = key.split("-");
					const types: Array<"correct" | "excessive" | "neutral"> = [
						"correct",
						"excessive",
						"neutral",
					];
					let curveOffset = 0;

					for (const type of types) {
						const count = counts[type];
						if (count === 0) continue;

						let shouldShow = false;
						switch (type) {
							case "correct":
								shouldShow = visibility.showCorrectEdges;
								break;
							case "excessive":
								shouldShow = visibility.showExcessiveEdges;
								break;
							case "neutral":
								shouldShow = visibility.showNeutralEdges;
								break;
						}

						if (shouldShow) {
							const style = getEdgeStyleByType(type);
							edgesToDisplay.push({
								id: `${key}-${type}`,
								source,
								target,
								type: "floating",
								style,
								markerEnd: {
									type: "arrowclosed" as MarkerType,
									color: style.stroke,
								},
								data: {
									badge: count.toString(),
									curveOffset,
								},
							});
							curveOffset += 30;
						}
					}
				}
			} else {
				// Single learner: Show only learner map edges (correct/excessive/neutral, no missing)
				for (const classification of currentEdgeClassifications) {
					if (classification.type === "missing") continue;

					let shouldShow = false;
					switch (classification.type) {
						case "correct":
							shouldShow = visibility.showCorrectEdges;
							break;
						case "excessive":
							shouldShow = visibility.showExcessiveEdges;
							break;
						case "neutral":
							shouldShow = visibility.showNeutralEdges;
							break;
					}
					if (shouldShow) {
						const style = getEdgeStyleByType(classification.type);
						edgesToDisplay.push({
							...classification.edge,
							type: "floating",
							style,
							markerEnd: {
								type: "arrowclosed" as MarkerType,
								color: style.stroke,
							},
						});
					}
				}
			}
		}

		return edgesToDisplay;
	}, [
		showGoalMap,
		showLearnerMap,
		isMultiView,
		currentEdgeClassifications,
		goalMap.edges,
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
				nodes={nodes}
				edges={displayEdges}
				nodeTypes={nodeTypes}
				edgeTypes={edgeTypes}
				onNodesChange={onNodesChange}
				nodesDraggable={true}
				nodesConnectable={false}
				elementsSelectable={true}
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
