import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, getRouteApi } from "@tanstack/react-router";
import type { Connection, MarkerType, NodeMouseHandler } from "@xyflow/react";
import {
	addEdge,
	Background,
	ConnectionMode,
	MiniMap,
	ReactFlow,
	ReactFlowProvider,
	useReactFlow,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useCallback, useEffect, useMemo, useState } from "react";

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
import { Button } from "@/components/ui/button";
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
	contextMenuAtom,
	lastSavedSnapshotAtom,
	learnerEdgesAtom,
	learnerMapIdAtom,
	learnerNodesAtom,
	materialDialogOpenAtom,
	materialTextAtom,
	searchOpenAtom,
	submissionStatusAtom,
} from "@/features/learner-map/lib/atoms";
import { arrangeNodesByType } from "@/features/learner-map/lib/grid-layout";
import { useGraphChangeHandlers } from "@/hooks/use-graph-change-handlers";
import { useHistory } from "@/hooks/use-history";
import { useRpcMutation, useRpcQuery } from "@/hooks/use-rpc-query";
import { formatDuration } from "@/lib/date-utils";
import { toast } from "@/lib/error-toast";
import { areNodesConnected, isValidConnection } from "@/lib/react-flow-types";
import { cn } from "@/lib/utils";
import { AssignmentRpc } from "@/server/rpc/assignment";
import { LearnerMapRpc } from "@/server/rpc/learner-map";

const routeApi = getRouteApi("/dashboard/learner-map/$assignmentId");

import { AlertCircle } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function LearnerMapEditor() {
	const { assignmentId } = routeApi.useParams();
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
	const { zoomIn: rfZoomIn, zoomOut: rfZoomOut, fitView } = useReactFlow();
	const [searchOpen, setSearchOpen] = useAtom(searchOpenAtom);
	const [materialOpen, setMaterialOpen] = useAtom(materialDialogOpenAtom);
	const [contextMenu, setContextMenu] = useAtom(contextMenuAtom);
	const [lastSavedSnapshot, setLastSavedSnapshot] = useAtom(lastSavedSnapshotAtom);
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

	const isSubmitted = status === "submitted";

	// Use shared hooks for graph changes and history
	const { onNodesChange, onEdgesChange } = useGraphChangeHandlers(setNodes, setEdges, {
		disabled: isSubmitted,
	});

	const { undo, redo, canUndo, canRedo } = useHistory(nodes, edges, {
		maxSnapshots: 50,
		disabled: isSubmitted || !isHydrated,
	});

	const { data: assignmentData, isLoading } = useRpcQuery(
		LearnerMapRpc.getAssignmentForStudent({ assignmentId }),
	);

	const { data: experimentGroup } = useRpcQuery(
		AssignmentRpc.getExperimentCondition(assignmentId),
	);
	const condition =
		experimentGroup && "condition" in experimentGroup
			? experimentGroup.condition
			: "concept_map";

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
			if (assignmentData.assignment.timeLimitMinutes && status === "not_started") {
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
					condition === "summarizing"
						? assignmentData.learnerMap.controlText || ""
						: JSON.stringify({
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
					condition === "summarizing"
						? ""
						: JSON.stringify({ nodes: arrangedNodes, edges: [] }),
				);
			}

			setIsHydrated(true);
		}
	}, [
		assignmentData,
		condition,
		isHydrated,
		setAssignment,
		setMaterialText,
		setNodes,
		setEdges,
		setLearnerMapId,
		setStatus,
		setAttempt,
		setLastSavedSnapshot,
		status,
	]);

	// Auto-save effect
	useEffect(() => {
		if (!isHydrated || isSubmitted) return;

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
		isSubmitted,
		lastSavedSnapshot,
		saveMutation,
		setLastSavedSnapshot,
	]);

	// Timer countdown
	useEffect(() => {
		if (timeRemaining === null || timeRemaining <= 0 || isSubmitted) return;

		const timer = setInterval(() => {
			setTimeRemaining((prev) => (prev !== null ? prev - 1 : null));
		}, 1000);

		return () => clearInterval(timer);
	}, [timeRemaining, isSubmitted]);

	// Handle node click - show context menu for connector nodes
	const onNodeClick: NodeMouseHandler = useCallback(
		(_event, node) => {
			if (isSubmitted) return;

			// Show context menu for connector nodes
			if (node.type === "connector") {
				const target = _event.target as HTMLElement;
				const nodeElement = target.closest(".react-flow__node") as HTMLElement | null;

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
		[setContextMenu, isSubmitted],
	);

	const onPaneClick = useCallback(() => {
		setContextMenu(null);
	}, [setContextMenu]);

	const onConnect = useCallback(
		(params: Connection) => {
			if (isSubmitted) return;
			const sourceNode = nodes.find((n) => n.id === params.source);
			const targetNode = nodes.find((n) => n.id === params.target);

			// Only allow: concept -> connector or connector -> concept
			// Also prevent connecting to the same node
			if (!isValidConnection(sourceNode?.type, targetNode?.type, params.source, params.target))
				return;
			// Prevent duplicate edges between same pair of nodes
			if (areNodesConnected(edges, params.source, params.target)) return;

			setEdges((eds) => addEdge(params, eds));
		},
		[nodes, edges, setEdges, isSubmitted],
	);

	// Handle connection drag end without valid target - close context menu to clean up
	const onConnectEnd = useCallback(() => {
		setContextMenu(null);
	}, [setContextMenu]);

	// Validate connection during drag (prevents visual feedback for invalid connections)
	const isValidConnectionHandler = useCallback(
		(params: { source: string; target: string }) => {
			if (isSubmitted) return false;
			if (params.source === params.target) return false;
			if (areNodesConnected(edges, params.source, params.target)) return false;
			const sourceNode = nodes.find((n) => n.id === params.source);
			const targetNode = nodes.find((n) => n.id === params.target);
			return isValidConnection(sourceNode?.type, targetNode?.type);
		},
		[nodes, edges, isSubmitted],
	);

	// Toolbar actions
	const zoomIn = () => rfZoomIn();
	const zoomOut = () => rfZoomOut();
	const fit = () => fitView({ padding: 0.2 });

	const autoLayout = () => {
		if (isSubmitted) return;
		const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
			nodes,
			edges,
			"LR",
		);
		setNodes(layoutedNodes);
		setEdges(layoutedEdges);
		setTimeout(() => fitView({ padding: 0.2 }), 50);
	};

	const selectNode = (nodeId: string) => {
		const node = nodes.find((n) => n.id === nodeId);
		if (node) {
			fitView({
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

	if (condition === "summarizing") {
		return (
			<SummarizingEditor
				assignmentId={assignmentId}
				assignmentData={assignmentData}
				isHydrated={isHydrated}
				isSubmitted={isSubmitted}
				setStatus={setStatus}
				materialOpen={materialOpen}
				setMaterialOpen={setMaterialOpen}
				materialText={materialText}
				lastSavedSnapshot={lastSavedSnapshot}
				setLastSavedSnapshot={setLastSavedSnapshot}
			/>
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
					<p className="text-xs text-muted-foreground mt-1">Attempt {attempt}</p>
				)}
			</div>
			{/* Timer */}
			{timeRemaining !== null && !isSubmitted && (
				<div
					className={cn(
						"absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-background/80 backdrop-blur-sm border rounded-lg px-4 py-2 font-mono font-medium",
						timeRemaining < 60 && "text-red-600 border-red-200 animate-pulse",
					)}
				>
					⏱ {formatDuration(timeRemaining)}
				</div>
			)}
			{/* Progress Indicator */}
			{!isSubmitted && (
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
							Your concept map will be compared against the teacher's goal map. You'll
							see your results immediately after submission.
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
			<div className="rounded-xl border bg-card relative h-full overflow-hidden">
				<ReactFlow
					nodes={nodes}
					edges={edges}
					nodeTypes={nodeTypes}
					edgeTypes={edgeTypes}
					onNodesChange={onNodesChange}
					onEdgesChange={onEdgesChange}
					onConnect={onConnect}
					onConnectEnd={onConnectEnd}
					isValidConnection={isValidConnectionHandler}
					onNodeClick={onNodeClick}
					onPaneClick={onPaneClick}
					defaultEdgeOptions={edgeOptions}
					connectionLineComponent={FloatingConnectionLine}
					connectionRadius={80}
					connectionMode={ConnectionMode.Loose}
					fitView
					nodesDraggable={!isSubmitted}
					nodesConnectable={!isSubmitted}
					elementsSelectable={!isSubmitted}
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
					canUndo={canUndo}
					canRedo={canRedo}
					isSubmitting={submitMutation.isPending}
					isSubmitted={isSubmitted}
					hasMaterial={!!materialText}
				/>

				{/* Simple Context Menu for Connectors */}
				{contextMenu && contextMenu.nodeType === "connector" && (
					<div
						className="absolute z-50 bg-background border rounded-lg shadow-lg p-1 min-w-30"
						style={{
							left: contextMenu.position.x,
							top: contextMenu.position.y - 40,
							transform: "translateX(-50%)",
						}}
					>
						<button
							type="button"
							className="w-full px-3 py-1.5 text-sm text-left text-muted-foreground hover:bg-accent rounded"
							onClick={() => setContextMenu(null)}
						>
							Cancel
						</button>
					</div>
				)}
			</div>
		</div>
	);
}

function SummarizingEditor({
	assignmentId,
	assignmentData,
	isHydrated,
	isSubmitted,
	setStatus,
	materialOpen,
	setMaterialOpen,
	materialText,
	lastSavedSnapshot,
	setLastSavedSnapshot,
}: {
	assignmentId: string;
	assignmentData: any;
	isHydrated: boolean;
	isSubmitted: boolean;
	setStatus: (s: any) => void;
	materialOpen: boolean;
	setMaterialOpen: (o: boolean) => void;
	materialText: string;
	lastSavedSnapshot: string | null;
	setLastSavedSnapshot: (s: string) => void;
}) {
	const queryClient = useQueryClient();
	const [controlText, setControlText] = useState(assignmentData.learnerMap?.controlText || "");
	const saveMutation = useRpcMutation(LearnerMapRpc.saveLearnerMap(), {
		operation: "save summary draft",
	});
	const submitControlTextMutation = useRpcMutation(LearnerMapRpc.submitControlText(), {
		operation: "submit summary",
		showSuccess: true,
	});

	// Auto-save summary with debounce
	useEffect(() => {
		if (!isHydrated || isSubmitted) return;
		if (controlText !== lastSavedSnapshot) {
			const timer = setTimeout(() => {
				saveMutation.mutate({
					assignmentId,
					controlText: controlText,
				});
				setLastSavedSnapshot(controlText);
			}, 3000);
			return () => clearTimeout(timer);
		}
	}, [
		controlText,
		isHydrated,
		isSubmitted,
		lastSavedSnapshot,
		saveMutation,
		assignmentId,
		setLastSavedSnapshot,
	]);
	const handleSummarySubmit = async () => {
		if (!controlText.trim()) {
			toast.error("Please enter a summary");
			return;
		}
		const result = await submitControlTextMutation.mutateAsync({
			assignmentId,
			text: controlText,
		});
		if (result.success) {
			setLastSavedSnapshot(controlText);
			setStatus("submitted");
			queryClient.invalidateQueries({
				queryKey: LearnerMapRpc.learnerMaps(),
			});
		}
	};
	return (
		<div className="h-full flex flex-col p-6 space-y-6 max-w-4xl mx-auto overflow-y-auto">
			<div className="space-y-2">
				<h1 className="text-2xl font-bold">{assignmentData.assignment.title}</h1>
				<p className="text-muted-foreground">{assignmentData.assignment.description}</p>
			</div>
			<div className="flex-1 flex flex-col space-y-4">
				<div className="flex items-center justify-between">
					<h2 className="text-lg font-semibold">Summarizing Activity</h2>
					<Button onClick={() => setMaterialOpen(true)} variant="outline">
						View Reading Material
					</Button>
				</div>
				<Alert variant="warning">
					<AlertCircle className="h-4 w-4" />
					<AlertTitle>Summary Task</AlertTitle>
					<AlertDescription>
						Please read the provided material and write a comprehensive summary covering
						the key concepts and their relationships.
					</AlertDescription>
				</Alert>
				<textarea
					className="flex-1 w-full min-h-[300px] p-4 rounded-lg border bg-background resize-none focus:ring-2 focus:ring-primary outline-none disabled:opacity-50"
					placeholder="Write your summary here..."
					value={controlText}
					onChange={(e) => setControlText(e.target.value)}
					disabled={isSubmitted || submitControlTextMutation.isPending}
				/>
				<div className="flex justify-end gap-3">
					<Button
						onClick={handleSummarySubmit}
						disabled={
							isSubmitted ||
							submitControlTextMutation.isPending ||
							!controlText.trim()
						}
						className="px-8"
					>
						{submitControlTextMutation.isPending
							? "Submitting..."
							: isSubmitted
								? "Submitted"
								: "Submit Summary"}
					</Button>
				</div>
			</div>

			<MaterialDialog
				open={materialOpen}
				onOpenChange={setMaterialOpen}
				content={materialText}
			/>
		</div>
	);
}

export function LearnerMapEditorWrapper() {
	return (
		<ReactFlowProvider>
			<LearnerMapEditor />
		</ReactFlowProvider>
	);
}
