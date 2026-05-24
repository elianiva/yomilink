import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, getRouteApi } from "@tanstack/react-router";
import { useMachine } from "@xstate/react";
import type { Connection, NodeMouseHandler } from "@xyflow/react";
import { applyNodeChanges, applyEdgeChanges, ReactFlowProvider, useReactFlow } from "@xyflow/react";

import "@xyflow/react/dist/style.css";
import type { EdgeChange, NodeChange } from "@xyflow/react";
import { AlertCircle, BookOpenIcon, InfoIcon, X } from "lucide-react";
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
import { filterSelectChanges } from "@/features/kit/lib/graph-machine";
import { getLayoutedElements } from "@/features/kit/lib/layout";
import { CanvasOnboardingDialog } from "@/features/learner-map/components/canvas-onboarding-dialog";
import { LearnerToolbar } from "@/features/learner-map/components/learner-toolbar";
import { MaterialDialog } from "@/features/learner-map/components/material-dialog";
import type { Node, Edge } from "@/features/learner-map/lib/comparator";
import { useRpcMutation, useRpcQuery } from "@/hooks/use-rpc-query";
import { useStableSerializedValue } from "@/hooks/use-stable-serialized-value";
import { toast } from "@/lib/error-toast";
import { areNodesConnected, isValidConnection } from "@/lib/react-flow-types";
import { learnerMapMachine } from "@/machines/learner-map.machine";
import type { Condition } from "@/machines/learner-map.machine";
import { LearnerMapRpc } from "@/server/rpc/learner-map";

const routeApi = getRouteApi("/dashboard/learner-map/$assignmentId/");

const noop = () => {};

export function LearnerMapEditor() {
	const { assignmentId } = routeApi.useParams();
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { zoomIn: rfZoomIn, zoomOut: rfZoomOut, fitView } = useReactFlow();

	const [snapshot, send] = useMachine(learnerMapMachine);

	const isSubmitted =
		snapshot.matches({ conceptMap: "submitted" }) ||
		snapshot.matches({ summarizing: "submitted" });

	const { data: assignmentData, isLoading } = useRpcQuery(
		LearnerMapRpc.getAssignmentForStudent({ assignmentId }),
	);

	const condition: Condition =
		assignmentData?.studyGroup === "experiment"
			? "concept_map"
			: assignmentData?.studyGroup === "control"
				? "summarizing"
				: null;

	useEffect(() => {
		if (assignmentData) {
			send({ type: "LOADED", data: assignmentData, condition });
		}
	}, [assignmentData, condition, send]);

	const saveMutation = useRpcMutation(LearnerMapRpc.saveLearnerMap(), {
		operation: "save learner map",
	});
	const submitMutation = useRpcMutation(LearnerMapRpc.submitLearnerMap(), {
		operation: "submit learner map",
	});

	const context = snapshot.context;

	const nodes = useStableSerializedValue(context.nodes);
	const edges = useStableSerializedValue(context.edges);

	const [onboardingOpen, setOnboardingOpen] = useState(false);

	useEffect(() => {
		if (assignmentData && condition === "concept_map" && !isSubmitted) {
			const key = `canvas-onboarding-${assignmentId}`;
			if (!localStorage.getItem(key)) {
				setOnboardingOpen(true);
				localStorage.setItem(key, "1");
			}
		}
	}, [assignmentData, assignmentId, condition, isSubmitted]);

	// Debounced auto-save: saves 3s after the last change.
	const isConceptMapDrafting = snapshot.matches({ conceptMap: "drafting" });
	useEffect(() => {
		if (!isConceptMapDrafting) return;

		const currentSnapshot = JSON.stringify({ nodes, edges });
		if (currentSnapshot === context.lastSavedSnapshot) return;

		const timer = setTimeout(() => {
			saveMutation.mutate({
				assignmentId,
				nodes: JSON.stringify(nodes),
				edges: JSON.stringify(edges),
			});
			send({ type: "SAVE" });
		}, 3000);
		return () => clearTimeout(timer);
	}, [
		nodes,
		edges,
		assignmentId,
		isConceptMapDrafting,
		context.lastSavedSnapshot,
		saveMutation,
		send,
	]);

	const handleSaveThenSubmit = useCallback(async () => {
		const saveResult = await saveMutation.mutateAsync({
			assignmentId,
			nodes: JSON.stringify(nodes),
			edges: JSON.stringify(edges),
		});

		if (!saveResult.success) return;
		send({ type: "SAVE" });

		const submitResult = await submitMutation.mutateAsync({ assignmentId });

		if (submitResult.success) {
			send({ type: "SUBMIT_DONE" });
			void queryClient.invalidateQueries({ queryKey: LearnerMapRpc.learnerMaps() });
			void navigate({ to: `/dashboard/learner-map/${assignmentId}/result` });
			toast.success("Map submitted successfully");
		} else {
			send({ type: "SUBMIT_ERROR" });
		}
	}, [nodes, edges, assignmentId, saveMutation, submitMutation, queryClient, navigate, send]);

	const onNodesChange = useCallback(
		(changes: NodeChange<Node>[]) => {
			if (isSubmitted) return;
			const next = applyNodeChanges(filterSelectChanges(changes), nodes);
			send({ type: "SET_NODES", nodes: next });
		},
		[nodes, isSubmitted, send],
	);

	const onEdgesChange = useCallback(
		(changes: EdgeChange<Edge>[]) => {
			if (isSubmitted) return;
			const next = applyEdgeChanges(changes, edges);
			send({ type: "SET_EDGES", edges: next });
		},
		[edges, isSubmitted, send],
	);

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

			send({ type: "SET_EDGES", edges: [...edges, newEdge] });
		},
		[nodes, edges, isSubmitted, send],
	);

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

	const handleUndo = useCallback(() => send({ type: "UNDO" }), [send]);
	const handleRedo = useCallback(() => send({ type: "REDO" }), [send]);

	const canUndo = context.pointer > 0;
	const canRedo = context.pointer < context.history.length - 1;

	const zoomIn = useCallback(() => void rfZoomIn(), [rfZoomIn]);
	const zoomOut = useCallback(() => void rfZoomOut(), [rfZoomOut]);
	const fit = useCallback(() => void fitView({ padding: 0.2 }), [fitView]);

	const autoLayout = useCallback(() => {
		if (isSubmitted) return;
		const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
			nodes,
			edges,
			"LR",
		);
		send({ type: "SET_NODES", nodes: layoutedNodes });
		send({ type: "SET_EDGES", edges: layoutedEdges });
		setTimeout(() => void fitView({ padding: 0.2 }), 50);
	}, [nodes, edges, isSubmitted, send, fitView]);

	const selectNode = useCallback(
		(nodeId: string) => {
			const node = nodes.find((n) => n.id === nodeId);
			if (node) {
				void fitView({ nodes: [node], padding: 0.5, duration: 500 });
			}
		},
		[nodes, fitView],
	);

	const [infoOpen, setInfoOpen] = useState(false);
	const [searchOpen, setSearchOpen] = useState(false);
	const [materialOpen, setMaterialOpen] = useState(false);
	const [submitDialogOpen, setSubmitDialogOpen] = useState(false);

	const onNodeClick: NodeMouseHandler = useCallback(() => {}, []);
	const onPaneClick = useCallback(() => {}, []);

	const handleSearchOpen = useCallback(() => setSearchOpen(true), []);
	const handleSearchClose = useCallback(() => setSearchOpen(false), []);
	const handleMaterialOpen = useCallback(() => setMaterialOpen(true), []);
	const handleSubmitOpen = useCallback(() => setSubmitDialogOpen(true), []);

	const handleControlTextChange = useCallback(
		(text: string) => send({ type: "SET_CONTROL_TEXT", text }),
		[send],
	);
	const handleSummarizingSubmitDone = useCallback(() => {
		send({ type: "CONTROL_SUBMIT_DONE" });
		void queryClient.invalidateQueries({ queryKey: LearnerMapRpc.learnerMaps() });
	}, [send, queryClient]);

	const handleToggleInfo = useCallback(() => setInfoOpen((v) => !v), []);

	if (isLoading || snapshot.matches("loading")) {
		return (
			<div className="h-full flex items-center justify-center">
				<div className="text-muted-foreground">Loading assignment…</div>
			</div>
		);
	}

	if (snapshot.matches("error") || !assignmentData || !condition) {
		return (
			<div className="h-full flex items-center justify-center">
				<div className="text-muted-foreground">
					{!condition ? "Assignment group not assigned" : "Assignment not found"}
				</div>
			</div>
		);
	}

	if (snapshot.matches("summarizing")) {
		return (
			<SummarizingEditor
				assignmentId={assignmentId}
				controlText={context.controlText}
				isSubmitted={isSubmitted}
				isSubmitting={snapshot.matches({ summarizing: "submitting" })}
				lastSavedSnapshot={context.lastSavedSnapshot}
				assignmentTitle={assignmentData.assignment.title}
				assignmentDescription={assignmentData.assignment.description}
				materialText={assignmentData.materialText || ""}
				onControlTextChange={handleControlTextChange}
				onSubmitDone={handleSummarizingSubmitDone}
			/>
		);
	}

	return (
		<div key={assignmentId} className="h-full relative">
			{!infoOpen && (
				<Button
					variant="outline"
					size="icon"
					onClick={handleToggleInfo}
					className="absolute top-3 right-3 z-20 animate-in fade-in"
					title="Show info"
				>
					<InfoIcon className="size-4" />
				</Button>
			)}
			{infoOpen && (
				<div className="absolute top-3 right-3 z-20 bg-card/70 backdrop-blur-lg border rounded-md px-4 py-2 w-56 space-y-2 animate-in fade-in">
					<div className="flex items-start justify-between gap-2">
						<div className="min-w-0 flex-1">
							<h2 className="font-medium text-sm leading-tight truncate">
								{assignmentData.assignment.title}
							</h2>
							{assignmentData.assignment.description && (
								<p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
									{assignmentData.assignment.description}
								</p>
							)}
							{context.attempt > 0 && (
								<p className="text-xs text-muted-foreground mt-0.5">
									Attempt {context.attempt}
								</p>
							)}
						</div>
						<Button
							variant="ghost"
							size="icon"
							onClick={handleToggleInfo}
							className="size-5"
							title="Hide info"
						>
							<X className="size-3" />
						</Button>
					</div>
					{!isSubmitted && (
						<>
							<hr className="border-t" />
							<div>
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
						</>
					)}
				</div>
			)}
			<MaterialDialog
				open={materialOpen}
				onOpenChange={setMaterialOpen}
				content={assignmentData.materialText || ""}
			/>
			<CanvasOnboardingDialog open={onboardingOpen} onOpenChange={setOnboardingOpen} />

			<AlertDialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Submit your concept map?</AlertDialogTitle>
						<AlertDialogDescription>
							Your concept map will be compared against the teacher&apos;s goal map.
							You&apos;ll see your results immediately after submission.
							{context.attempt > 0 &&
								" You can try again after viewing your results."}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleSaveThenSubmit}
							disabled={submitMutation.isPending}
						>
							{submitMutation.isPending ? "Submitting..." : "Submit"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
			<div className="bg-card relative h-full overflow-hidden -mx-6">
				<ConceptMapCanvas
					nodes={nodes}
					edges={edges}
					onNodesChange={onNodesChange}
					onEdgesChange={onEdgesChange}
					onConnect={onConnect}
					onConnectEnd={noop}
					isValidConnection={isValidConnectionHandler}
					onNodeClick={onNodeClick}
					onPaneClick={onPaneClick}
					readOnly={isSubmitted}
				>
					<SearchNodesPanel
						open={searchOpen}
						nodes={nodes}
						onClose={handleSearchClose}
						onSelectNode={selectNode}
					/>
				</ConceptMapCanvas>
				<LearnerToolbar
					onUndo={handleUndo}
					onRedo={handleRedo}
					onZoomIn={zoomIn}
					onZoomOut={zoomOut}
					onFit={fit}
					onSearch={handleSearchOpen}
					onMaterial={handleMaterialOpen}
					onAutoLayout={autoLayout}
					onSubmit={handleSubmitOpen}
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

interface SummarizingEditorProps {
	assignmentId: string;
	controlText: string;
	isSubmitted: boolean;
	isSubmitting: boolean;
	lastSavedSnapshot: string | null;
	assignmentTitle: string;
	assignmentDescription: string | null;
	materialText: string;
	onControlTextChange: (text: string) => void;
	onSubmitDone: () => void;
}

function SummarizingEditor({
	assignmentId,
	controlText,
	isSubmitted,
	isSubmitting,
	lastSavedSnapshot,
	assignmentTitle,
	assignmentDescription,
	materialText,
	onControlTextChange,
	onSubmitDone,
}: SummarizingEditorProps) {
	const queryClient = useQueryClient();

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
				saveMutation.mutate({ assignmentId, controlText });
			}, 3000);
			return () => clearTimeout(timer);
		}
	}, [controlText, isSubmitted, lastSavedSnapshot, saveMutation, assignmentId]);

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
			onSubmitDone();
			void queryClient.invalidateQueries({ queryKey: LearnerMapRpc.learnerMaps() });
		}
	};

	return (
		<div className="h-full flex flex-col">
			<div className="px-6 py-4 border-b">
				<h1 className="font-medium text-lg">{assignmentTitle}</h1>
				{assignmentDescription && (
					<p className="text-sm text-muted-foreground">{assignmentDescription}</p>
				)}
			</div>
			<div className="flex-1 flex overflow-hidden">
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
							onChange={(e) => onControlTextChange(e.target.value)}
							disabled={isSubmitted || isSubmitting}
						/>
					</div>
					<div className="px-6 py-4 border-t flex justify-end gap-3">
						<Button
							onClick={handleSummarySubmit}
							disabled={isSubmitted || isSubmitting || !controlText.trim()}
						>
							{isSubmitting
								? "Submitting..."
								: isSubmitted
									? "Submitted"
									: "Submit Summary"}
						</Button>
					</div>
				</div>
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
