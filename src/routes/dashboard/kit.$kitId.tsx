import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactFlowInstance } from "@xyflow/react";
import {
	addEdge,
	Background,
	type Connection,
	type Edge,
	MiniMap,
	type Node,
	ReactFlow,
	useEdgesState,
	useNodesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { Maximize2, RotateCcw, RotateCw, ZoomIn, ZoomOut } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef } from "react";
import ImageNode, {
	type ImageNodeData,
} from "@/components/kit/nodes/ImageNode";
import TextNode, { type TextNodeData } from "@/components/kit/nodes/TextNode";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/dashboard/kit/$kitId")({
	component: KitWorkspace,
});

type AnyNode = Node<TextNodeData | ImageNodeData>;

type KitDocument = {
	kitId: string;
	nodes: AnyNode[];
	edges: Edge[];
	viewport: { x: number; y: number; zoom: number };
	updatedAt: number;
	version: number;
};

const initialNodes: AnyNode[] = [
	{
		id: "n1",
		type: "text",
		position: { x: 120, y: 80 },
		data: { label: "(1-1) use", variant: "green" },
	},
	{
		id: "n2",
		type: "text",
		position: { x: 380, y: 200 },
		data: { label: "(2-2) move", variant: "green" },
	},
	{
		id: "n3",
		type: "text",
		position: { x: 680, y: 120 },
		data: { label: "(5-1) is called", variant: "green" },
	},
	{
		id: "n4",
		type: "text",
		position: { x: 220, y: 320 },
		data: { label: "subject" },
	},
	{
		id: "n5",
		type: "image",
		position: { x: 620, y: 300 },
		data: {
			url: "/logo512.png",
			caption: "Sample image node",
			width: 160,
			height: 110,
		},
	},
];

const initialEdges: Edge[] = [
	{
		id: "e1-2",
		source: "n1",
		target: "n2",
		style: { stroke: "#16a34a", strokeWidth: 1.5 },
	},
	{
		id: "e2-3",
		source: "n2",
		target: "n3",
		style: { stroke: "#16a34a", strokeWidth: 1.5 },
	},
	{
		id: "e2-4",
		source: "n2",
		target: "n4",
		style: { stroke: "#16a34a", strokeWidth: 1.5 },
	},
];

function KitWorkspace() {
	const nodeTypes = useMemo(
		() => ({
			text: TextNode,
			image: ImageNode,
		}),
		[],
	);

	const [nodes, setNodes, onNodesChange] = useNodesState<AnyNode>(initialNodes);
	const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

	const rfRef = useRef<ReactFlowInstance<AnyNode, Edge> | null>(null);
	const { kitId } = Route.useParams();

	const historyRef = useRef<Array<{ nodes: AnyNode[]; edges: Edge[] }>>([
		{ nodes: initialNodes, edges: initialEdges },
	]);
	const pointerRef = useRef(0);
	const isApplyingRef = useRef(false);

	useEffect(() => {
		if (isApplyingRef.current) return;
		const current = { nodes, edges };
		const last = historyRef.current[pointerRef.current];
		const same =
			JSON.stringify(current.nodes) === JSON.stringify(last.nodes) &&
			JSON.stringify(current.edges) === JSON.stringify(last.edges);
		if (same) return;
		historyRef.current = historyRef.current.slice(0, pointerRef.current + 1);
		historyRef.current.push({
			nodes: JSON.parse(JSON.stringify(nodes)),
			edges: JSON.parse(JSON.stringify(edges)),
		});
		pointerRef.current++;
	}, [nodes, edges]);

	const undo = () => {
		if (pointerRef.current <= 0) return;
		pointerRef.current--;
		const snap = historyRef.current[pointerRef.current];
		isApplyingRef.current = true;
		setNodes(snap.nodes);
		setEdges(snap.edges);
		requestAnimationFrame(() => {
			isApplyingRef.current = false;
		});
	};

	const redo = () => {
		if (pointerRef.current >= historyRef.current.length - 1) return;
		pointerRef.current++;
		const snap = historyRef.current[pointerRef.current];
		isApplyingRef.current = true;
		setNodes(snap.nodes);
		setEdges(snap.edges);
		requestAnimationFrame(() => {
			isApplyingRef.current = false;
		});
	};

	const handleSave = () => {
		const viewport = rfRef.current?.getViewport?.() ?? { x: 0, y: 0, zoom: 1 };
		const payload: KitDocument = {
			kitId,
			nodes,
			edges,
			viewport,
			updatedAt: Date.now(),
			version: 1,
		};
		// TODO: integrate Convex mutation to persist payload
		console.log("kit.save", payload);
	};

	const zoomIn = () => rfRef.current?.zoomIn?.();
	const zoomOut = () => rfRef.current?.zoomOut?.();
	const fit = () => rfRef.current?.fitView?.({ padding: 0.2 });

	const onConnect = useCallback(
		(params: Connection) => {
			setEdges((eds) =>
				addEdge(
					{
						...params,
						style: { stroke: "#16a34a", strokeWidth: 1.5 },
					},
					eds,
				),
			);
		},
		[setEdges],
	);

	return (
		<div className="space-y-3">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<Button asChild variant="outline" size="sm">
						<Link to="/dashboard">Back</Link>
					</Button>
					<h2 className="text-lg font-semibold">Kit Workspace</h2>
				</div>
				<div className="flex items-center gap-2">
					<div className="inline-flex items-center gap-1 rounded-md border p-1">
						<Button size="default" variant="ghost" onClick={undo} title="Undo">
							<RotateCcw className="size-4" />
						</Button>
						<Button size="default" variant="ghost" onClick={redo} title="Redo">
							<RotateCw className="size-4" />
						</Button>
						<div className="mx-1 h-5 w-px bg-border" />
						<Button
							size="default"
							variant="ghost"
							onClick={zoomOut}
							title="Zoom out"
						>
							<ZoomOut className="size-4" />
						</Button>
						<Button
							size="default"
							variant="ghost"
							onClick={zoomIn}
							title="Zoom in"
						>
							<ZoomIn className="size-4" />
						</Button>
						<Button
							size="default"
							variant="ghost"
							onClick={fit}
							title="Fit view"
						>
							<Maximize2 className="size-4" />
						</Button>
					</div>
					<Button variant="outline" onClick={handleSave}>
						Save
					</Button>
					<Button>Publish</Button>
				</div>
			</div>

			<div className="h-[calc(100vh-12rem)] rounded-xl border bg-card">
				<ReactFlow
					nodes={nodes}
					edges={edges}
					nodeTypes={nodeTypes}
					onNodesChange={onNodesChange}
					onEdgesChange={onEdgesChange}
					onConnect={onConnect}
					onInit={(instance) => {
						rfRef.current = instance;
					}}
					fitView
				>
					<MiniMap />
					<Background gap={16} />
				</ReactFlow>
			</div>
		</div>
	);
}
