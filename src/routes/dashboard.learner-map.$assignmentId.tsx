import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type {
	Connection,
	EdgeChange,
	MarkerType,
	NodeChange,
	NodeMouseHandler,
} from "@xyflow/react";
import { addEdge, Background, MiniMap, ReactFlow } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Guard } from "@/components/auth/Guard";
import { useRpcMutation, useRpcQuery } from "@/hooks/use-rpc-query";
import { toast } from "@/lib/error-toast";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ConnectorNode } from "@/features/kitbuild/components/connector-node";
import { FloatingConnectionLine } from "@/features/kitbuild/components/floating-connection-line";
import { FloatingEdge } from "@/features/kitbuild/components/floating-edge";
import { SearchNodesPanel } from "@/features/kitbuild/components/search-nodes-panel";
import { TextNode } from "@/features/kitbuild/components/text-node";
import { getLayoutedElements } from "@/features/kitbuild/lib/layout";
import { LearnerToolbar } from "@/features/learner-map/components/learner-toolbar";
import { MaterialDialog } from "@/features/learner-map/components/material-dialog";
import {
	assignmentAtom,
	attemptAtom,
	connectionModeAtom,
	contextMenuAtom,
	historyAtom,
	historyPointerAtom,
	isApplyingHistoryAtom,
	lastSavedSnapshotAtom,
	learnerEdgesAtom,
	learnerMapIdAtom,
	learnerNodesAtom,
	materialDialogOpenAtom,
	materialTextAtom,
	rfInstanceAtom,
	searchOpenAtom,
	submissionStatusAtom,
} from "@/features/learner-map/lib/atoms";
import type {
	Edge as MapEdge,
	Node as MapNode,
} from "@/features/learner-map/lib/comparator";
import { arrangeNodesByType } from "@/features/learner-map/lib/grid-layout";
import { cn } from "@/lib/utils";
import { LearnerMapRpc } from "@/server/rpc/learner-map";

export const Route = createFileRoute("/dashboard/learner-map/$assignmentId")({
	component: () => (
		<Guard roles={["student"]}>
			<LearnerMapEditor />
		</Guard>
	),
});

function LearnerMapEditor() {
	const { assignmentId } = Route.useParams();
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	const nodeTypes = useMemo(
		() => ({
			text: TextNode,
			connector: ConnectorNode,
		}),
		[],
	);

	const edgeTypes = useMemo(
		() => ({
			floating: FloatingEdge,
		}),
		[],
	);

	// Atom state
	const [nodes, setNodes] = useAtom(learnerNodesAtom);
	const [edges, setEdges] = useAtom(learnerEdgesAtom);
	const [rfInstance, setRfInstance] = useAtom(rfInstanceAtom);
	const [searchOpen, setSearchOpen] = useAtom(searchOpenAtom);
	const [materialOpen, setMaterialOpen] = useAtom(materialDialogOpenAtom);
	const [connectionMode, setConnectionMode] = useAtom(connectionModeAtom);
	const [contextMenu, setContextMenu] = useAtom(contextMenuAtom);
	const [history, setHistory] = useAtom(historyAtom);
	const [historyPointer, setHistoryPointer] = useAtom(historyPointerAtom);
	const [isApplying, setIsApplying] = useAtom(isApplyingHistoryAtom);
	const [lastSavedSnapshot, setLastSavedSnapshot] = useAtom(
		lastSavedSnapshotAtom,
	);
	const materialText = useAtomValue(materialTextAtom);
	const setMaterialText = useSetAtom(materialTextAtom);
	const setAssignment = useSetAtom(assignmentAtom);
	const setLearnerMapId = useSetAtom(learnerMapIdAtom);
	const [status, setStatus] = useAtom(submissionStatusAtom);
	const [attempt, setAttempt] = useAtom(attemptAtom);

	// Local state
	const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
	const [isHydrated, setIsHydrated] = useState(false);
	const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

	const { data: assignmentData, isLoading } = useRpcQuery(
		LearnerMapRpc.getAssignmentForStudent({ assignmentId }),
	);

	// Mutations
	const saveMutation = useRpcMutation(LearnerMapRpc.saveLearnerMap(), {
		operation: "save learner map",
	});
	const submitMutation = useRpcMutation(LearnerMapRpc.submitLearnerMap(), {
		operation: "submit learner map",
	});

	// Initialize from query data
	useEffect(() => {
		if (assignmentData && !isHydrated) {
			setAssignment(assignmentData.assignment);
			setMaterialText(assignmentData.materialText || "");

			// Initialize timer if time limit exists
			if (
				assignmentData.assignment.timeLimitMinutes &&
				status === "not_started"
			) {
				setTimeRemaining(assignmentData.assignment.timeLimitMinutes * 60);
			}

			if (assignmentData.learnerMap) {
				// Continue from existing learner map
				setNodes(assignmentData.learnerMap.nodes);
				setEdges(assignmentData.learnerMap.edges);
				setLearnerMapId(assignmentData.learnerMap.id);
				setStatus(assignmentData.learnerMap.status);
				setAttempt(assignmentData.learnerMap.attempt);
				setLastSavedSnapshot(
					JSON.stringify({
						nodes: assignmentData.learnerMap.nodes,
						edges: assignmentData.learnerMap.edges,
					}),
				);
			} else {
				// New learner map - arrange kit nodes in grid
				const arrangedNodes = arrangeNodesByType(assignmentData.kit.nodes);
				setNodes(arrangedNodes);
				setEdges([]);
				setStatus("not_started");
				setAttempt(0);
				setLastSavedSnapshot(
					JSON.stringify({ nodes: arrangedNodes, edges: [] }),
				);
			}

			// Initialize history
			setHistory([{ nodes, edges }]);
			setHistoryPointer(0);
			setIsHydrated(true);
		}
	}, [
		assignmentData,
		isHydrated,
		setAssignment,
		setMaterialText,
		setNodes,
		setEdges,
		setLearnerMapId,
		setStatus,
		setAttempt,
		setLastSavedSnapshot,
		setHistory,
		setHistoryPointer,
		nodes,
		edges,
		status,
	]);

	// History tracking
	useEffect(() => {
		if (isApplying || !isHydrated) return;

		const timer = setTimeout(() => {
			const snapshot = { nodes, edges };
			const lastSnapshot = history[historyPointer];

			if (
				lastSnapshot &&
				JSON.stringify(snapshot) === JSON.stringify(lastSnapshot)
			) {
				return;
			}

			const newHistory = history.slice(0, historyPointer + 1);
			newHistory.push(snapshot);
			if (newHistory.length > 50) newHistory.shift();
			setHistory(newHistory);
			setHistoryPointer(newHistory.length - 1);
		}, 300);

		return () => clearTimeout(timer);
	}, [
		nodes,
		edges,
		isApplying,
		isHydrated,
		history,
		historyPointer,
		setHistory,
		setHistoryPointer,
	]);

	// Helper to get node styling based on connection mode
	const getNodeClassName = useCallback(
		(node: (typeof nodes)[0]) => {
			if (!connectionMode?.active) return "";

			if (node.id === connectionMode.linkNodeId) {
				return "ring-4 ring-blue-500 scale-105 shadow-lg";
			}

			if (node.type === "text") {
				return "ring-2 ring-blue-300 animate-pulse cursor-pointer";
			}

			if (node.type === "connector") {
				return "opacity-40";
			}

			return "";
		},
		[connectionMode],
	);

	// Apply connection mode styling to nodes
	const styledNodes = useMemo(
		() =>
			nodes.map((node) => ({
				...node,
				className: getNodeClassName(node),
			})),
		[nodes, getNodeClassName],
	);

	useEffect(() => {
		if (!isHydrated || status === "submitted") return;

		const timer = setTimeout(() => {
			const currentSnapshot = JSON.stringify({ nodes, edges });
			if (currentSnapshot !== lastSavedSnapshot) {
				saveMutation.mutate({
					assignmentId,
					nodes: JSON.stringify(nodes),
					edges: JSON.stringify(edges),
				});
				setLastSavedSnapshot(currentSnapshot);
			}
		}, 3000); // Debounce to 3 seconds
		return () => clearTimeout(timer);
	}, [
		nodes,
		edges,
		assignmentId,
		isHydrated,
		status,
		lastSavedSnapshot,
		saveMutation,
		setLastSavedSnapshot,
	]);

	// Timer countdown
	useEffect(() => {
		if (timeRemaining === null || timeRemaining <= 0 || status === "submitted")
			return;

		const timer = setInterval(() => {
			setTimeRemaining((prev) => (prev !== null ? prev - 1 : null));
		}, 1000);

		return () => clearInterval(timer);
	}, [timeRemaining, status]);

	// Format time as MM:SS
	const formatTime = (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, "0")}`;
	};

	// Handle node click - show context menu or complete connection
	const onNodeClick: NodeMouseHandler = useCallback(
		(_event, node) => {
			if (status === "submitted") return;

			// If in connection mode, try to complete the connection
			if (connectionMode?.active) {
				const clickedType = node.type;

				// Only allow connecting to concept (text) nodes
				if (clickedType !== "text") {
					return;
				}

				// Create the edge based on direction
				const newEdge = {
					id: `e-${connectionMode.linkNodeId}-${node.id}`,
					source:
						connectionMode.direction === "to"
							? connectionMode.linkNodeId
							: node.id,
					target:
						connectionMode.direction === "to"
							? node.id
							: connectionMode.linkNodeId,
					type: "floating",
					style: { stroke: "#16a34a", strokeWidth: 3 },
					markerEnd: { type: "arrowclosed" as MarkerType, color: "#16a34a" },
				};

				setEdges((eds) => [...eds, newEdge]);
				setConnectionMode(null);
				return;
			}

			// Show context menu for connector nodes
			if (node.type === "connector") {
				const target = _event.target as HTMLElement;
				const nodeElement = target.closest(
					".react-flow__node",
				) as HTMLElement | null;

				if (nodeElement) {
					const rect = nodeElement.getBoundingClientRect();
					setContextMenu({
						nodeId: node.id,
						nodeType: "connector",
						position: {
							x: rect.left + rect.width / 2,
							y: rect.top,
						},
					});
				}
			}
		},
		[connectionMode, setEdges, setConnectionMode, setContextMenu, status],
	);

	const onPaneClick = useCallback(() => {
		setContextMenu(null);
		setConnectionMode(null);
	}, [setContextMenu, setConnectionMode]);

	// Context menu actions
	const handleConnectTo = useCallback(() => {
		if (!contextMenu || contextMenu.nodeType !== "connector") return;
		setConnectionMode({
			active: true,
			linkNodeId: contextMenu.nodeId,
			direction: "to",
		});
		setContextMenu(null);
	}, [contextMenu, setConnectionMode, setContextMenu]);

	const handleConnectFrom = useCallback(() => {
		if (!contextMenu || contextMenu.nodeType !== "connector") return;
		setConnectionMode({
			active: true,
			linkNodeId: contextMenu.nodeId,
			direction: "from",
		});
		setContextMenu(null);
	}, [contextMenu, setConnectionMode, setContextMenu]);

	// Undo/redo
	const undo = useCallback(() => {
		if (historyPointer <= 0 || status === "submitted") return;
		const newPointer = historyPointer - 1;
		setHistoryPointer(newPointer);
		const snap = history[newPointer];
		setIsApplying(true);
		setNodes(snap.nodes);
		setEdges(snap.edges);
		requestAnimationFrame(() => setIsApplying(false));
	}, [
		history,
		historyPointer,
		setHistoryPointer,
		setIsApplying,
		setNodes,
		setEdges,
		status,
	]);

	const redo = useCallback(() => {
		if (historyPointer >= history.length - 1 || status === "submitted") return;
		const newPointer = historyPointer + 1;
		setHistoryPointer(newPointer);
		const snap = history[newPointer];
		setIsApplying(true);
		setNodes(snap.nodes);
		setEdges(snap.edges);
		requestAnimationFrame(() => setIsApplying(false));
	}, [
		history,
		historyPointer,
		setHistoryPointer,
		setIsApplying,
		setNodes,
		setEdges,
		status,
	]);

	// Node/edge change handlers
	const onNodesChange = useCallback(
		(changes: NodeChange<MapNode>[]) => {
			if (status === "submitted") return;
			setNodes((nds) => {
				return changes.reduce((acc, change) => {
					if (change.type === "position") {
						return acc.map((n) =>
							n.id === change.id
								? { ...n, position: change.position || n.position }
								: n,
						);
					}
					if (change.type === "select") {
						return acc.map((n) =>
							n.id === change.id ? { ...n, selected: change.selected } : n,
						);
					}
					if (change.type === "dimensions") {
						return acc.map((n) =>
							n.id === change.id && change.dimensions
								? {
										...n,
										measured: {
											width: change.dimensions.width,
											height: change.dimensions.height,
										},
									}
								: n,
						);
					}
					return acc;
				}, nds);
			});
		},
		[setNodes, status],
	);

	const onEdgesChange = useCallback(
		(changes: EdgeChange<MapEdge>[]) => {
			if (status === "submitted") return;
			setEdges((eds) => {
				return changes.reduce((acc, change) => {
					if (change.type === "remove") {
						return acc.filter((e) => e.id !== change.id);
					}
					if (change.type === "select") {
						return acc.map((e) =>
							e.id === change.id ? { ...e, selected: change.selected } : e,
						);
					}
					return acc;
				}, eds);
			});
		},
		[setEdges, status],
	);

	const onConnect = useCallback(
		(params: Connection) => {
			if (status === "submitted") return;
			const sourceNode = nodes.find((n) => n.id === params.source);
			const targetNode = nodes.find((n) => n.id === params.target);

			// Only allow: concept -> connector or connector -> concept
			const sType = sourceNode?.type;
			const tType = targetNode?.type;
			const ok =
				(sType === "text" && tType === "connector") ||
				(sType === "connector" && tType === "text");
			if (!ok) return;

			setEdges((eds) => addEdge(params, eds));
		},
		[nodes, setEdges, status],
	);

	// Toolbar actions
	const zoomIn = () => rfInstance?.zoomIn?.();
	const zoomOut = () => rfInstance?.zoomOut?.();
	const fit = () => rfInstance?.fitView?.({ padding: 0.2 });

	const autoLayout = () => {
		if (status === "submitted") return;
		const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
			nodes,
			edges,
			"LR",
		);
		setNodes(layoutedNodes);
		setEdges(layoutedEdges);
		setTimeout(() => rfInstance?.fitView?.({ padding: 0.2 }), 50);
	};

	const selectNode = (nodeId: string) => {
		const node = nodes.find((n) => n.id === nodeId);
		if (node && rfInstance) {
			rfInstance.fitView({
				nodes: [node],
				padding: 0.5,
				duration: 500,
			});
		}
		setSearchOpen(false);
	};

	// Submit handler
	const handleSubmit = async () => {
		// Save first
		const saveResult = await saveMutation.mutateAsync({
			assignmentId,
			nodes: JSON.stringify(nodes),
			edges: JSON.stringify(edges),
		});

		if (!saveResult.success) return;

		// Then submit
		const submitResult = await submitMutation.mutateAsync({ assignmentId });

		if (submitResult.success) {
			setSubmitDialogOpen(false);
			setStatus("submitted");
			queryClient.invalidateQueries({
				queryKey: LearnerMapRpc.learnerMaps(),
			});
			// Navigate to result page
			navigate({
				to: `/dashboard/learner-map/${assignmentId}/result`,
			});
			toast.success("Map submitted successfully");
		}
	};

	// Edge options
	const edgeOptions = useMemo(
		() => ({
			type: "floating",
			style: { stroke: "#16a34a", strokeWidth: 3 },
			markerEnd: { type: "arrowclosed" as MarkerType, color: "#16a34a" },
		}),
		[],
	);

	if (isLoading) {
		return (
			<div className="h-full flex items-center justify-center">
				<div className="text-muted-foreground">Loading assignment...</div>
			</div>
		);
	}

	if (!assignmentData) {
		return (
			<div className="h-full flex items-center justify-center">
				<div className="text-muted-foreground">Assignment not found</div>
			</div>
		);
	}

	return (
		<div className="h-full relative">
			{/* Header */}
			<div className="absolute top-4 left-4 z-10 bg-background/80 backdrop-blur-sm border rounded-lg px-4 py-2">
				<h2 className="font-medium">{assignmentData?.assignment.title}</h2>
				{assignmentData?.assignment.description && (
					<p className="text-sm text-muted-foreground">
						{assignmentData.assignment.description}
					</p>
				)}
				{attempt > 0 && (
					<p className="text-xs text-muted-foreground mt-1">
						Attempt {attempt}
					</p>
				)}
			</div>

			{/* Timer */}
			{timeRemaining !== null && status !== "submitted" && (
				<div
					className={cn(
						"absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-background/80 backdrop-blur-sm border rounded-lg px-4 py-2 font-mono font-medium",
						timeRemaining < 60 && "text-red-600 border-red-200 animate-pulse",
					)}
				>
					⏱ {formatTime(timeRemaining)}
				</div>
			)}

			{/* Progress Indicator */}
			{status !== "submitted" && (
				<div className="absolute top-4 right-4 z-10 bg-background/80 backdrop-blur-sm border rounded-lg px-4 py-2 w-48">
					<div className="flex items-center justify-between text-xs mb-1">
						<span className="text-muted-foreground">Progress</span>
						<span className="font-medium">{edges.length} connections</span>
					</div>
					<div className="w-full h-2 bg-muted rounded-full overflow-hidden">
						<div
							className="h-full bg-primary transition-all duration-300"
							style={{
								width: `${Math.min((edges.length / 10) * 100, 100)}%`,
							}}
						/>
					</div>
				</div>
			)}

			{/* Material Dialog */}
			<MaterialDialog
				open={materialOpen}
				onOpenChange={setMaterialOpen}
				content={materialText}
			/>

			{/* Submit Confirmation Dialog */}
			<AlertDialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Submit your concept map?</AlertDialogTitle>
						<AlertDialogDescription>
							Your concept map will be compared against the teacher's goal map.
							You'll see your results immediately after submission.
							{attempt > 0 && " You can try again after viewing your results."}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleSubmit}
							disabled={submitMutation.isPending}
						>
							{submitMutation.isPending ? "Submitting..." : "Submit"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Canvas */}
			<div
				className={cn(
					"rounded-xl border bg-card relative h-full overflow-hidden",
					connectionMode?.active && "ring-2 ring-blue-500/50",
				)}
			>
				<ReactFlow
					nodes={styledNodes}
					edges={edges}
					nodeTypes={nodeTypes}
					edgeTypes={edgeTypes}
					onNodesChange={onNodesChange}
					onEdgesChange={onEdgesChange}
					onConnect={onConnect}
					onNodeClick={onNodeClick}
					onPaneClick={onPaneClick}
					defaultEdgeOptions={edgeOptions}
					connectionLineComponent={FloatingConnectionLine}
					onInit={(instance) => setRfInstance(instance)}
					fitView
					nodesDraggable={status !== "submitted"}
					nodesConnectable={status !== "submitted"}
					elementsSelectable={status !== "submitted"}
				>
					<MiniMap />
					<Background gap={16} />
					<SearchNodesPanel
						open={searchOpen}
						nodes={nodes}
						onClose={() => setSearchOpen(false)}
						onSelectNode={selectNode}
					/>
				</ReactFlow>

				{/* Toolbar */}
				<LearnerToolbar
					onUndo={undo}
					onRedo={redo}
					onZoomIn={zoomIn}
					onZoomOut={zoomOut}
					onFit={fit}
					onSearch={() => setSearchOpen(true)}
					onMaterial={() => setMaterialOpen(true)}
					onAutoLayout={autoLayout}
					onSubmit={() => setSubmitDialogOpen(true)}
					canUndo={historyPointer > 0}
					canRedo={historyPointer < history.length - 1}
					isSubmitting={submitMutation.isPending}
					isSubmitted={status === "submitted"}
					hasMaterial={!!materialText}
				/>

				{/* Dark overlay when context menu is open */}
				{contextMenu && (
					<div
						className="absolute inset-0 bg-black/30 z-40 pointer-events-none animate-in fade-in duration-150"
						aria-hidden="true"
					/>
				)}

				{/* Simple Context Menu for Connectors */}
				{contextMenu && contextMenu.nodeType === "connector" && (
					<div
						className="absolute z-50 bg-background border rounded-lg shadow-lg p-1 min-w-30"
						style={{
							left: contextMenu.position.x,
							top: contextMenu.position.y - 80,
							transform: "translateX(-50%)",
						}}
					>
						<button
							type="button"
							className="w-full px-3 py-1.5 text-sm text-left hover:bg-accent rounded"
							onClick={handleConnectTo}
						>
							Connect To...
						</button>
						<button
							type="button"
							className="w-full px-3 py-1.5 text-sm text-left hover:bg-accent rounded"
							onClick={handleConnectFrom}
						>
							Connect From...
						</button>
						<button
							type="button"
							className="w-full px-3 py-1.5 text-sm text-left text-muted-foreground hover:bg-accent rounded"
							onClick={() => setContextMenu(null)}
						>
							Cancel
						</button>
					</div>
				)}

				{/* Connection Mode Indicator */}
				{connectionMode?.active && (
					<div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 bg-blue-500 text-white border border-blue-600 rounded-lg px-3 py-1.5 shadow-lg text-sm flex items-center gap-2">
						<span>
							Click a concept to connect{" "}
							{connectionMode.direction === "to" ? "to" : "from"}
						</span>
						<button
							type="button"
							onClick={() => setConnectionMode(null)}
							className="text-xs text-white/80 hover:text-white underline"
						>
							Cancel
						</button>
					</div>
				)}
			</div>
		</div>
	);
}
