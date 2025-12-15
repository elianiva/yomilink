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
import { Guard } from "@/components/auth/Guard";
import "@xyflow/react/dist/style.css";

import { Maximize2, RotateCcw, RotateCw, ZoomIn, ZoomOut } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ImageNode, {
	type ImageNodeData,
} from "@/features/goalmap/components/ImageNode";
import TextNode, {
	type TextNodeData,
} from "@/features/goalmap/components/TextNode";
import { Button } from "@/components/ui/button";
import { getKit } from "@/server/rpc/kit";

export const Route = createFileRoute("/dashboard/kit/$kitId")({
	component: () => (
		<Guard roles={["student", "teacher", "admin"]}>
			<KitWorkspace />
		</Guard>
	),
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

/* Nodes will be loaded from Convex at runtime for student view */

/* Edges will be loaded from Convex at runtime for student view */

function KitWorkspace() {
	const nodeTypes = useMemo(
		() => ({
			text: TextNode,
			image: ImageNode,
		}),
		[],
	);

	const [nodes, setNodes, onNodesChange] = useNodesState<AnyNode>([]);
	const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([] as Edge[]);

	const rfRef = useRef<ReactFlowInstance<AnyNode, Edge> | null>(null);
	const { kitId } = Route.useParams();
	// For MVP we store kit under goalMapId-compatible id
	const [kit, setKit] = useState<any>(null);

	useEffect(() => {
		let cancelled = false;
		(async () => {
			const data = await getKit({ data: { kitId } });
			if (!cancelled) setKit(data);
		})();
		return () => {
			cancelled = true;
		};
	}, [kitId]);

	const historyRef = useRef<Array<{ nodes: AnyNode[]; edges: Edge[] }>>([
		{ nodes: [], edges: [] },
	]);
	const pointerRef = useRef(0);
	const isApplyingRef = useRef(false);

	// Hydrate nodes/edges from Convex for student view.
	// Only keep concept nodes (text/image) and drop connector nodes.
	useEffect(() => {
		if (!kit) return;
		try {
			const conceptNodes = ((kit as any).nodes ?? []).filter(
				(n: any) => n?.type === "text" || n?.type === "image",
			) as AnyNode[];
			const conceptIds = new Set(conceptNodes.map((n) => n.id));
			const filteredEdges = (((kit as any).edges ?? []) as Edge[]).filter(
				(e: any) => conceptIds.has(e?.source) && conceptIds.has(e?.target),
			) as Edge[];

			setNodes(conceptNodes);
			setEdges(filteredEdges);

			// Reset local history baseline after loading
			historyRef.current = [{ nodes: conceptNodes, edges: filteredEdges }];
			pointerRef.current = 0;
		} catch (e) {
			console.error("kit.load error", e);
		}
	}, [kit, setNodes, setEdges]);

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
		console.log("kit.save (draft)", payload);
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
						Save Draft
					</Button>
					<Button>Submit</Button>
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
