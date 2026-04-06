import type { Edge, MarkerType, Node } from "@xyflow/react";
import {
	Background,
	ConnectionMode,
	MiniMap,
	ReactFlow,
	ReactFlowProvider,
	useReactFlow,
} from "@xyflow/react";
import { ZoomIn, ZoomOut } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import "@xyflow/react/dist/style.css";
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
				stroke: "var(--edge-correct)",
				strokeWidth: 3,
			};
		case "excessive":
			return {
				stroke: "var(--edge-excessive)",
				strokeWidth: 3,
				strokeDasharray: "5,5",
			};
		case "missing":
			return {
				stroke: "var(--edge-missing)",
				strokeWidth: 2,
				strokeDasharray: "5,5",
			};
		case "neutral":
			return {
				stroke: "var(--edge-neutral)",
				strokeWidth: 2,
			};
	}
}

function getSymmetricCurveOffset(index: number, total: number, gap = 44) {
	if (total <= 1) return 0;
	return (index - (total - 1) / 2) * gap;
}

function getBadgeT(index: number, total: number) {
	if (total <= 1) return 0.5;
	const centered = index - (total - 1) / 2;
	return Math.max(0.3, Math.min(0.7, 0.5 + centered * 0.08));
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

	const edgeKeyFor = (edge: Pick<Edge, "source" | "target">) =>
		JSON.stringify([edge.source, edge.target]);

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
		const { consolidatedView, showNamesOnHover } = visibility;

		if (showGoalMap && showLearnerMap) {
			if (isMultiView) {
				if (consolidatedView) {
					// Multi-view consolidated: Aggregate edges and create separate edges per type with badges
					// Track counts and creators per edge key and per type
					const edgeData = new Map<
						string,
						{
							correct: { count: number; creators: Set<string> };
							missing: { count: number; creators: Set<string> };
							excessive: { count: number; creators: Set<string> };
							neutral: { count: number; creators: Set<string> };
						}
					>();

					// Count edge classifications per edge key and track creators per type
					for (const classification of currentEdgeClassifications) {
						const key = edgeKeyFor(classification.edge);
						const data = edgeData.get(key) || {
							correct: { count: 0, creators: new Set<string>() },
							missing: { count: 0, creators: new Set<string>() },
							excessive: { count: 0, creators: new Set<string>() },
							neutral: { count: 0, creators: new Set<string>() },
						};
						data[classification.type].count++;
						const creator = classification.createdBy;
						if (creator) {
							data[classification.type].creators.add(creator);
						}
						edgeData.set(key, data);
					}

					// Create separate edges for each type with symmetric curves
					for (const [key, data] of edgeData.entries()) {
						const [source, target] = JSON.parse(key) as [string, string];
						const types: Array<"correct" | "missing" | "excessive" | "neutral"> = [
							"correct",
							"missing",
							"excessive",
							"neutral",
						];

						const visibleTypes = types.filter((type) => {
							if (data[type].count === 0) return false;
							switch (type) {
								case "correct":
									return visibility.showCorrectEdges;
								case "missing":
									return visibility.showMissingEdges;
								case "excessive":
									return visibility.showExcessiveEdges;
								case "neutral":
									return visibility.showNeutralEdges;
							}
						});

						for (const [index, type] of visibleTypes.entries()) {
							const style = getEdgeStyleByType(type);
							const creatorList = Array.from(data[type].creators).sort().join("\n");
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
									badge: data[type].count.toString(),
									curveOffset: getSymmetricCurveOffset(
										index,
										visibleTypes.length,
									),
									badgeT: getBadgeT(index, visibleTypes.length),
									useCurvedPath: true,
									createdBy: creatorList || undefined,
									showNamesOnHover,
								},
							});
						}
					}
				} else {
					// Multi-view all lines: Show individual edges for each learner with unique curve offsets
					// Group classifications by edge key and type to assign curve offsets
					const edgeGroups = new Map<
						string,
						Array<{
							classification: (typeof currentEdgeClassifications)[number];
							learnerIndex: number;
						}>
					>();

					// Get unique learners in order for consistent curve offsets
					const uniqueLearners = Array.from(
						new Set(currentEdgeClassifications.map((c) => c.createdBy).filter(Boolean)),
					);
					const learnerIndexMap = new Map(uniqueLearners.map((l, i) => [l, i]));

					// Group by edge key + type
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
						if (!shouldShow) continue;

						const key = `${edgeKeyFor(classification.edge)}-${classification.type}`;
						const group = edgeGroups.get(key) || [];
						group.push({
							classification,
							learnerIndex: learnerIndexMap.get(classification.createdBy || "") ?? 0,
						});
						edgeGroups.set(key, group);
					}

					// Create individual edges with curve offsets
					for (const [key, group] of edgeGroups.entries()) {
						for (const [index, item] of group.entries()) {
							const { classification } = item;
							const style = getEdgeStyleByType(classification.type);
							edgesToDisplay.push({
								id: `${key}-${index}`,
								source: classification.edge.source,
								target: classification.edge.target,
								sourceHandle: "right",
								targetHandle: "left",
								type: "floating",
								style,
								animated: classification.type === "missing",
								markerEnd: {
									type: "arrowclosed" as MarkerType,
									color: style.stroke,
								},
								data: {
									curveOffset: getSymmetricCurveOffset(index, group.length),
									useCurvedPath: true,
									createdBy: classification.createdBy || undefined,
									showNamesOnHover,
								},
							});
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
							sourceHandle: "right",
							targetHandle: "left",
							type: "floating",
							style,
							animated: classification.type === "missing",
							markerEnd: {
								type: "arrowclosed" as MarkerType,
								color: style.stroke,
							},
							data: {
								...classification.edge.data,
								createdBy:
									classification.createdBy ?? currentLearnerMaps[0]?.userName,
								showNamesOnHover,
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
					sourceHandle: "right",
					targetHandle: "left",
					type: "floating",
					style: {
						stroke: "var(--edge-neutral)",
						strokeWidth: 2,
					},
					markerEnd: {
						type: "arrowclosed" as MarkerType,
						color: "var(--edge-neutral)",
					},
				});
			}
		} else if (showLearnerMap) {
			if (isMultiView) {
				if (consolidatedView) {
					// Multi-view consolidated: Show aggregated edges without missing
					// Track counts and creators per edge key and per type
					const edgeData = new Map<
						string,
						{
							correct: { count: number; creators: Set<string> };
							excessive: { count: number; creators: Set<string> };
							neutral: { count: number; creators: Set<string> };
						}
					>();

					// Count edge classifications per edge key and track creators per type
					for (const classification of currentEdgeClassifications) {
						if (classification.type === "missing") continue;

						const key = edgeKeyFor(classification.edge);
						const data = edgeData.get(key) || {
							correct: { count: 0, creators: new Set<string>() },
							excessive: { count: 0, creators: new Set<string>() },
							neutral: { count: 0, creators: new Set<string>() },
						};
						const type = classification.type as "correct" | "excessive" | "neutral";
						data[type].count++;
						const creator = classification.createdBy;
						if (creator) {
							data[type].creators.add(creator);
						}
						edgeData.set(key, data);
					}

					// Create separate edges for each type with symmetric curves
					for (const [key, data] of edgeData.entries()) {
						const [source, target] = JSON.parse(key) as [string, string];
						const types: Array<"correct" | "excessive" | "neutral"> = [
							"correct",
							"excessive",
							"neutral",
						];

						const visibleTypes = types.filter((type) => {
							if (data[type].count === 0) return false;
							switch (type) {
								case "correct":
									return visibility.showCorrectEdges;
								case "excessive":
									return visibility.showExcessiveEdges;
								case "neutral":
									return visibility.showNeutralEdges;
							}
						});

						for (const [index, type] of visibleTypes.entries()) {
							const style = getEdgeStyleByType(type);
							const creatorList = Array.from(data[type].creators).sort().join("\n");
							edgesToDisplay.push({
								id: `${key}-${type}`,
								source,
								target,
								sourceHandle: "right",
								targetHandle: "left",
								type: "floating",
								style,
								markerEnd: {
									type: "arrowclosed" as MarkerType,
									color: style.stroke,
								},
								data: {
									badge: data[type].count.toString(),
									curveOffset: getSymmetricCurveOffset(
										index,
										visibleTypes.length,
									),
									badgeT: getBadgeT(index, visibleTypes.length),
									useCurvedPath: true,
									createdBy: creatorList || undefined,
									showNamesOnHover,
								},
							});
						}
					}
				} else {
					// Multi-view all lines: Show individual edges for each learner with unique curve offsets
					const edgeGroups = new Map<
						string,
						Array<{
							classification: (typeof currentEdgeClassifications)[number];
							learnerIndex: number;
						}>
					>();

					// Get unique learners in order for consistent curve offsets
					const uniqueLearners = Array.from(
						new Set(currentEdgeClassifications.map((c) => c.createdBy).filter(Boolean)),
					);
					const learnerIndexMap = new Map(uniqueLearners.map((l, i) => [l, i]));

					// Group by edge key + type
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
						if (!shouldShow) continue;

						const key = `${edgeKeyFor(classification.edge)}-${classification.type}`;
						const group = edgeGroups.get(key) || [];
						group.push({
							classification,
							learnerIndex: learnerIndexMap.get(classification.createdBy || "") ?? 0,
						});
						edgeGroups.set(key, group);
					}

					// Create individual edges with curve offsets
					for (const [key, group] of edgeGroups.entries()) {
						for (const [index, item] of group.entries()) {
							const { classification } = item;
							const style = getEdgeStyleByType(classification.type);
							edgesToDisplay.push({
								id: `${key}-${index}`,
								source: classification.edge.source,
								target: classification.edge.target,
								sourceHandle: "right",
								targetHandle: "left",
								type: "floating",
								style,
								markerEnd: {
									type: "arrowclosed" as MarkerType,
									color: style.stroke,
								},
								data: {
									curveOffset: getSymmetricCurveOffset(index, group.length),
									useCurvedPath: true,
									createdBy: classification.createdBy || undefined,
									showNamesOnHover,
								},
							});
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
							sourceHandle: "right",
							targetHandle: "left",
							type: "floating",
							style,
							markerEnd: {
								type: "arrowclosed" as MarkerType,
								color: style.stroke,
							},
							data: {
								...classification.edge.data,
								createdBy:
									classification.createdBy ?? currentLearnerMaps[0]?.userName,
								showNamesOnHover,
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
		currentLearnerMaps,
		goalMap.edges,
		visibility.showCorrectEdges,
		visibility.showMissingEdges,
		visibility.showExcessiveEdges,
		visibility.showNeutralEdges,
		visibility.consolidatedView,
		visibility.showNamesOnHover,
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
				connectionMode={ConnectionMode.Loose}
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
