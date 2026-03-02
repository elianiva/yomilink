import type {
	Connection,
	EdgeChange,
	NodeChange,
	NodeMouseHandler,
} from "@xyflow/react";
import {
	Background,
	ConnectionMode,
	MiniMap,
	ReactFlow,
	useReactFlow,
} from "@xyflow/react";
import { useCallback, useMemo } from "react";

import type { Node, Edge } from "@/features/learner-map/lib/comparator";

import { ConnectorNode } from "./connector-node";
import { FloatingConnectionLine } from "./floating-connection-line";
import { FloatingEdge } from "./floating-edge";
import { TextNode } from "./text-node";

export type ConceptMapCanvasProps = {
	/** Current nodes in the graph */
	nodes: Node[];
	/** Current edges in the graph */
	edges: Edge[];
	/** Called when nodes change (move, select, delete, resize) */
	onNodesChange: (changes: NodeChange<Node>[]) => void;
	/** Called when edges change (select, delete) */
	onEdgesChange: (changes: EdgeChange<Edge>[]) => void;
	/** Called when a new connection/edge is created */
	onConnect: (params: Connection) => void;
	/** Called when connection drag ends (successfully or not) */
	onConnectEnd?: () => void;
	/** Called when a node is clicked */
	onNodeClick?: NodeMouseHandler;
	/** Called when the canvas/pane is clicked */
	onPaneClick?: () => void;
	/** Validates if a connection is allowed during drag */
	isValidConnection?: (params: { source: string; target: string }) => boolean;
	/** When true, disables all interactions (read-only mode) */
	readOnly?: boolean;
	/** Children rendered inside ReactFlow (SearchNodesPanel, etc.) */
	children?: React.ReactNode;
};

const NODE_TYPES = {
	text: TextNode,
	connector: ConnectorNode,
};

const EDGE_TYPES = {
	floating: FloatingEdge,
};

/**
 * Unified concept map canvas used by both GoalMapEditor and LearnerMapEditor.
 *
 * Handles:
 * - Rendering nodes (text and connector types)
 * - Rendering edges (floating type with arrows)
 * - Connection validation
 * - Read-only mode support
 * - Shared styling and behavior
 */
export function ConceptMapCanvas({
	nodes,
	edges,
	onNodesChange,
	onEdgesChange,
	onConnect,
	onConnectEnd,
	onNodeClick,
	onPaneClick,
	isValidConnection,
	readOnly,
	children,
}: ConceptMapCanvasProps) {
	const { fitView } = useReactFlow();

	// Always show edge direction markers (simplified from goal-map's toggle)
	const defaultEdgeOptions = useMemo(
		() => ({
			type: "floating",
			style: { stroke: "#16a34a", strokeWidth: 3 },
			markerEnd: { type: "arrowclosed" as const, color: "#16a34a" },
		}),
		[],
	);

	// Wrapper to handle read-only state
	const handleNodesChange = useCallback(
		(changes: NodeChange<Node>[]) => {
			if (readOnly) return;
			onNodesChange(changes);
		},
		[onNodesChange, readOnly],
	);

	const handleEdgesChange = useCallback(
		(changes: EdgeChange<Edge>[]) => {
			if (readOnly) return;
			onEdgesChange(changes);
		},
		[onEdgesChange, readOnly],
	);

	const handleConnect = useCallback(
		(params: Connection) => {
			if (readOnly) return;
			onConnect(params);
		},
		[onConnect, readOnly],
	);

	const handleNodeClick: NodeMouseHandler = useCallback(
		(event, node) => {
			if (readOnly) return;
			onNodeClick?.(event, node);
		},
		[onNodeClick, readOnly],
	);

	const handlePaneClick = useCallback(() => {
		if (readOnly) return;
		onPaneClick?.();
	}, [onPaneClick, readOnly]);

	// Fit view on mount
	const refCallback = useCallback(
		(node: HTMLDivElement | null) => {
			if (node) {
				// Small delay to ensure nodes are measured
				setTimeout(() => fitView({ padding: 0.2 }), 50);
			}
		},
		[fitView],
	);

	return (
		<ReactFlow
			ref={refCallback}
			nodes={nodes}
			edges={edges}
			nodeTypes={NODE_TYPES}
			edgeTypes={EDGE_TYPES}
			defaultEdgeOptions={defaultEdgeOptions}
			connectionLineComponent={FloatingConnectionLine}
			onNodesChange={handleNodesChange}
			onEdgesChange={handleEdgesChange}
			onConnect={handleConnect}
			onConnectEnd={onConnectEnd}
			isValidConnection={isValidConnection}
			onNodeClick={handleNodeClick}
			onPaneClick={handlePaneClick}
			connectionRadius={80}
			connectionMode={ConnectionMode.Loose}
			nodesDraggable={!readOnly}
			nodesConnectable={!readOnly}
			elementsSelectable={!readOnly}
			fitView
		>
			<MiniMap />
			<Background gap={16} />
			{children}
		</ReactFlow>
	);
}
