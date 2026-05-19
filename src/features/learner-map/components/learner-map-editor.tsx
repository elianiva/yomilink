import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, getRouteApi } from "@tanstack/react-router";
import type { Connection, NodeMouseHandler } from "@xyflow/react";
import { ReactFlowProvider, useReactFlow } from "@xyflow/react";

import "@xyflow/react/dist/style.css";
import { useAtom, useSetAtom } from "jotai";
import { AlertCircle, BookOpenIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { ConceptMapCanvas } from "@/features/kit/components/concept-map-canvas";
import { SearchNodesPanel } from "@/features/kit/components/search-nodes-panel";
import { getLayoutedElements } from "@/features/kit/lib/layout";
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
	searchOpenAtom,
	submissionStatusAtom,
} from "@/features/learner-map/lib/atoms";
import { arrangeNodesByType } from "@/features/learner-map/lib/grid-layout";
import { useGraphChangeHandlers } from "@/hooks/use-graph-change-handlers";
import { useHistory } from "@/hooks/use-history";
import { useRpcMutation, useRpcQuery } from "@/hooks/use-rpc-query";
import { toast } from "@/lib/error-toast";
import { areNodesConnected, isValidConnection } from "@/lib/react-flow-types";
import { LearnerMapRpc } from "@/server/rpc/learner-map";

const routeApi = getRouteApi("/dashboard/learner-map/$assignmentId/");

type ConnectionParams = { source: string; target: string };

type AssignmentSummaryData = {
	assignment: {
		id: string;
		title: string;
		description: string | null;
		readingMaterial: string | null;
		timeLimitMinutes: number | null;
		goalMapId: string;
		kitId: string;
		dueAt: number | undefined;
		preTestFormId: string | null;
		postTestFormId: string | null;
		delayedPostTestFormId: string | null;
		delayedPostTestDelayDays: number | null;
		tamFormId: string | null;
	};
	learnerMap: {
		id: string;
		nodes: readonly unknown[];
		edges: readonly unknown[];
		status: string;
		attempt: number;
		controlText: string | null;
	} | null;
	kit: { id: string; nodes: readonly unknown[]; edges: readonly unknown[] };
	materialText: string | null;
	studyGroup: string | null;
};

type SummarizingEditorProps = {
	assignmentId: string;
	assignmentData: AssignmentSummaryData | null;
	isSubmitted: boolean;
	setStatus: (value: "draft" | "submitted" | "not_started" | "graded") => void;
	lastSavedSnapshot: string | null;
	setLastSavedSnapshot: (s: string) => void;
};

export function LearnerMapEditor() {
	const { assignmentId } = routeApi.useParams();
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { zoomIn: rfZoomIn, zoomOut: rfZoomOut, fitView } = useReactFlow();

	const [nodes, setNodes] = useAtom(learnerNodesAtom);
	const [edges, setEdges] = useAtom(learnerEdgesAtom);
	const [searchOpen, setSearchOpen] = useAtom(searchOpenAtom);
	const [materialOpen, setMaterialOpen] = useAtom(materialDialogOpenAtom);
	const [, setContextMenu] = useAtom(contextMenuAtom);
	const [lastSavedSnapshot, setLastSavedSnapshot] = useAtom(lastSavedSnapshotAtom);
	const setAssignment = useSetAtom(assignmentAtom);
	const setLearnerMapId = useSetAtom(learnerMapIdAtom);
	const [status, setStatus] = useAtom(submissionStatusAtom);
	const [attempt, setAttempt] = useAtom(attemptAtom);

	const [submitDialogOpen, setSubmitDialogOpen] = useState(false);

	const isSubmitted = status === "submitted";

	const { onNodesChange: onNodesChangeBase, onEdgesChange } = useGraphChangeHandlers(
		setNodes,
		setEdges,
		{
			disabled: isSubmitted,
		},
	);

	// Filter out select changes to prevent node edit/delete toolbar — students should not edit/delete nodes
	const onNodesChange: typeof onNodesChangeBase = useCallback(
		(changes) => {
			onNodesChangeBase(
				changes.filter((c): c is (typeof changes)[number] => c.type !== "select"),
			);
		},
		[onNodesChangeBase],
	);

	const { undo, redo, canUndo, canRedo } = useHistory(nodes, edges, {
		maxSnapshots: 50,
		disabled: isSubmitted,
	});

	const { data: assignmentData, isLoading } = useRpcQuery(
		LearnerMapRpc.getAssignmentForStudent({ assignmentId }),
	);

	const condition =
		assignmentData?.studyGroup === "experiment"
			? "concept_map"
			: assignmentData?.studyGroup === "control"
				? "summarizing"
				: null;

	const saveMutation = useRpcMutation(LearnerMapRpc.saveLearnerMap(), {
		operation: "save learner map",
	});
	const submitMutation = useRpcMutation(LearnerMapRpc.submitLearnerMap(), {
		operation: "submit learner map",
	});

	useEffect(() => {
		if (assignmentData) {
			setAssignment(assignmentData.assignment);
		}
	}, [assignmentData, setAssignment]);

	useEffect(() => {
		if (!assignmentData) return;

		if (assignmentData.learnerMap) {
			setNodes([...assignmentData.learnerMap.nodes]);
			setEdges([...assignmentData.learnerMap.edges]);
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
			const arrangedNodes = arrangeNodesByType([...assignmentData.kit.nodes]);
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
	}, [
		assignmentData,
		condition,
		setNodes,
		setEdges,
		setLearnerMapId,
		setStatus,
		setAttempt,
		setLastSavedSnapshot,
	]);

	useEffect(() => {
		if (isSubmitted) return;

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
		}, 3000);
		return () => clearTimeout(timer);
	}, [
		nodes,
		edges,
		assignmentId,
		isSubmitted,
		lastSavedSnapshot,
		saveMutation,
		setLastSavedSnapshot,
	]);

	const onNodeClick: NodeMouseHandler = useCallback((_event, _node) => {
		// Node edit/delete is reserved for teachers
	}, []);

	const onPaneClick = useCallback(() => {
		setContextMenu(null);
	}, [setContextMenu]);

	const onConnect = useCallback(
		(params: Connection) => {
			if (isSubmitted) return;
			const sourceNode = nodes.find((n) => n.id === params.source);
			const targetNode = nodes.find((n) => n.id === params.target);

			if (
				!isValidConnection(sourceNode?.type, targetNode?.type, params.source, params.target)
			)
				return;
			if (areNodesConnected(edges, params.source, params.target)) return;

			const newEdge = {
				id: `e-${params.source}-${params.target}`,
				source: params.source!,
				target: params.target!,
				type: "floating" as const,
				style: { stroke: "#16a34a", strokeWidth: 3 },
			};

			setEdges((eds) => [...eds, newEdge]);
		},
		[nodes, edges, setEdges, isSubmitted],
	);

	const onConnectEnd = useCallback(() => {
		setContextMenu(null);
	}, [setContextMenu]);

	const isValidConnectionHandler = useCallback(
		(params: ConnectionParams) => {
			if (isSubmitted) return false;
			if (params.source === params.target) return false;
			if (areNodesConnected(edges, params.source, params.target)) return false;
			const sourceNode = nodes.find((n) => n.id === params.source);
			const targetNode = nodes.find((n) => n.id === params.target);
			return isValidConnection(sourceNode?.type, targetNode?.type);
		},
		[nodes, edges, isSubmitted],
	);

	const zoomIn = () => void rfZoomIn();
	const zoomOut = () => void rfZoomOut();
	const fit = () => void fitView({ padding: 0.2 });

	const autoLayout = () => {
		if (isSubmitted) return;
		const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
			nodes,
			edges,
			"LR",
		);
		setNodes(layoutedNodes);
		setEdges(layoutedEdges);
		setTimeout(() => void fitView({ padding: 0.2 }), 50);
	};

	const selectNode = (nodeId: string) => {
		const node = nodes.find((n) => n.id === nodeId);
		if (node) {
			void fitView({
				nodes: [node],
				padding: 0.5,
				duration: 500,
			});
		}
		setSearchOpen(false);
	};

	const handleSubmit = async () => {
		const saveResult = await saveMutation.mutateAsync({
			assignmentId,
			nodes: JSON.stringify(nodes),
			edges: JSON.stringify(edges),
		});

		if (!saveResult.success) return;

		const submitResult = await submitMutation.mutateAsync({ assignmentId });

		if (submitResult.success) {
			setSubmitDialogOpen(false);
			setStatus("submitted");
			void queryClient.invalidateQueries({
				queryKey: LearnerMapRpc.learnerMaps(),
			});
			void navigate({
				to: `/dashboard/learner-map/${assignmentId}/result`,
			});
			toast.success("Map submitted successfully");
		}
	};

	if (isLoading) {
		return (
			<div className="h-full flex items-center justify-center">
				<div className="text-muted-foreground">Loading assignment…</div>
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

	if (!condition) {
		return (
			<div className="h-full flex items-center justify-center">
				<div className="text-muted-foreground">Assignment group not assigned</div>
			</div>
		);
	}

	if (condition === "summarizing") {
		return (
			<SummarizingEditor
				assignmentId={assignmentId}
				assignmentData={assignmentData}
				isSubmitted={isSubmitted}
				setStatus={setStatus}
				lastSavedSnapshot={lastSavedSnapshot}
				setLastSavedSnapshot={setLastSavedSnapshot}
			/>
		);
	}

	return (
		<div className="h-full relative">
			<div className="absolute top-3 -left-2 z-10 bg-card/70 backdrop-blur-lg border rounded-md px-4 py-2">
				<h2 className="font-medium">{assignmentData.assignment.title}</h2>
				{assignmentData.assignment.description && (
					<p className="text-sm text-muted-foreground">
						{assignmentData.assignment.description}
					</p>
				)}
				{attempt > 0 && (
					<p className="text-xs text-muted-foreground mt-1">Attempt {attempt}</p>
				)}
			</div>
			{!isSubmitted && (
				<div className="absolute top-3 -right-3 z-10 bg-card/70 backdrop-blur-lg border rounded-md px-4 py-2 w-48">
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
			<MaterialDialog
				open={materialOpen}
				onOpenChange={setMaterialOpen}
				content={assignmentData.materialText || ""}
			/>
			<AlertDialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Submit your concept map?</AlertDialogTitle>
						<AlertDialogDescription>
							Your concept map will be compared against the teacher&apos;s goal map.
							You&apos;ll see your results immediately after submission.
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
			<div className="bg-card relative h-full overflow-hidden -mx-6 border-t-[0.5px]">
				<ConceptMapCanvas
					nodes={nodes}
					edges={edges}
					onNodesChange={onNodesChange}
					onEdgesChange={onEdgesChange}
					onConnect={onConnect}
					onConnectEnd={onConnectEnd}
					isValidConnection={isValidConnectionHandler}
					onNodeClick={onNodeClick}
					onPaneClick={onPaneClick}
					readOnly={isSubmitted}
				>
					<SearchNodesPanel
						open={searchOpen}
						nodes={nodes}
						onClose={() => setSearchOpen(false)}
						onSelectNode={selectNode}
					/>
				</ConceptMapCanvas>
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
					hasMaterial={!!assignmentData.materialText}
				/>
			</div>
		</div>
	);
}

function SummarizingEditor({
	assignmentId,
	assignmentData,
	isSubmitted,
	setStatus,
	lastSavedSnapshot,
	setLastSavedSnapshot,
}: SummarizingEditorProps) {
	if (!assignmentData) return null;

	const queryClient = useQueryClient();
	const [controlText, setControlText] = useState(assignmentData.learnerMap?.controlText || "");

	const materialText = assignmentData.materialText || "";

	const saveMutation = useRpcMutation(LearnerMapRpc.saveLearnerMap(), {
		operation: "save summary draft",
	});
	const submitControlTextMutation = useRpcMutation(LearnerMapRpc.submitControlText(), {
		operation: "submit summary",
		showSuccess: true,
	});

	useEffect(() => {
		if (isSubmitted) return;
		if (controlText !== lastSavedSnapshot) {
			const timer = setTimeout(() => {
				saveMutation.mutate({ assignmentId, controlText: controlText });
				setLastSavedSnapshot(controlText);
			}, 3000);
			return () => clearTimeout(timer);
		}
	}, [
		controlText,
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
			void queryClient.invalidateQueries({
				queryKey: LearnerMapRpc.learnerMaps(),
			});
		}
	};

	return (
		<div className="h-full flex flex-col">
			{/* Header */}
			<div className="px-6 py-4 border-b">
				<h1 className="font-medium text-lg">{assignmentData.assignment.title}</h1>
				{assignmentData.assignment.description && (
					<p className="text-sm text-muted-foreground">
						{assignmentData.assignment.description}
					</p>
				)}
			</div>
			{/* Split View */}
			<div className="flex-1 flex overflow-hidden">
				{/* Left - Editor */}
				<div className="flex-1 flex flex-col min-w-0">
					<div className="px-6 py-3 border-b bg-muted/30">
						<h2 className="text-sm font-medium">Your Summary</h2>
					</div>
					<div className="flex-1 overflow-y-auto">
						{materialText && (
							<Alert className="mb-4">
								<AlertCircle className="size-4" />
								<AlertTitle>Summary Task</AlertTitle>
								<AlertDescription className="text-sm">
									Write a comprehensive summary of the reading material shown on
									the right. Include key concepts and their relationships.
								</AlertDescription>
							</Alert>
						)}
						<textarea
							className="w-full h-[calc(100%-80px)] p-4 rounded-lg resize-none outline-none disabled:opacity-50"
							placeholder={
								materialText
									? "Write your summary here..."
									: "No reading material provided. Write your response here..."
							}
							value={controlText}
							onChange={(e) => setControlText(e.target.value)}
							disabled={isSubmitted || submitControlTextMutation.isPending}
						/>
					</div>
					<div className="px-6 py-4 border-t flex justify-end gap-3">
						<Button
							onClick={handleSummarySubmit}
							disabled={
								isSubmitted ||
								submitControlTextMutation.isPending ||
								!controlText.trim()
							}
						>
							{submitControlTextMutation.isPending
								? "Submitting..."
								: isSubmitted
									? "Submitted"
									: "Submit Summary"}
						</Button>
					</div>
				</div>
				{/* Right - Reading Material */}
				<div className="w-[45%] min-w-[350px] flex flex-col border-l bg-muted/10">
					<div className="px-6 py-3 border-b bg-muted/30 flex items-center gap-2">
						<BookOpenIcon className="size-4" />
						<h2 className="text-sm font-medium">Reading Material</h2>
					</div>
					<div className="flex-1 overflow-y-auto p-6 space-y-4">
						{materialText ? (
							<div
								className="prose prose-sm max-w-none dark:prose-invert prose-p:my-2 prose-headings:my-2 prose-ul:my-2 prose-ol:my-2 prose-blockquote:my-2 prose-li:my-0.5 prose-pre:bg-muted prose-pre:text-foreground prose-pre:border prose-pre:border-border prose-pre:rounded-md prose-pre:p-3 prose-pre:my-2 prose-code:bg-muted/50 prose-code:text-foreground prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:before:content-none prose-code:after:content-none prose-headings:font-medium prose-headings:text-foreground prose-h1:text-xl prose-h2:text-lg prose-h3:text-base prose-h4:text-base prose-strong:font-semibold prose-b:font-semibold prose-ul:list-disc prose-ol:list-decimal prose-ul:pl-5 prose-ol:pl-5 prose-ul:marker:text-foreground prose-ol:marker:text-foreground prose-a:text-primary prose-a:no-underline hover:prose-a:underline"
								dangerouslySetInnerHTML={{ __html: materialText }}
							/>
						) : (
							<div className="flex items-center justify-center h-full text-muted-foreground text-sm">
								No reading material provided.
							</div>
						)}
					</div>
				</div>
			</div>
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
