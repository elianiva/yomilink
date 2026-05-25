import { useQueryClient } from "@tanstack/react-query";
import { Link, getRouteApi, useNavigate } from "@tanstack/react-router";
import { ArrowLeftIcon, BarChart3Icon, RefreshCwIcon, SlidersHorizontalIcon } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { ToolbarButton } from "@/components/toolbar/toolbar-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { createTooltipHandle, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { AnalyticsControls } from "@/features/analyzer/components/analytics-controls";
import { AnalyticsCanvas } from "@/features/analyzer/components/canvas";
import { classifyEdges } from "@/features/learner-map/lib/comparator";
import type { VisibilityState } from "@/features/learner-map/lib/visibility";
import { useRpcMutation, useRpcQuery } from "@/hooks/use-rpc-query";
import { AnalyticsRpc } from "@/server/rpc/analytics";
import { FormRpc } from "@/server/rpc/form";
import { LearnerMapRpc } from "@/server/rpc/learner-map";

import { ResultControlsPanel } from "./result-controls-panel";
import { ResultMobileOverlay } from "./result-mobile-overlay";
import { ResultSidePanel } from "./result-side-panel";

const routeApi = getRouteApi("/dashboard/learner-map/$assignmentId/result");

export function LearnerMapResult() {
	const { assignmentId } = routeApi.useParams();
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const tooltipHandle = createTooltipHandle();

	const [visibility, setVisibility] = useState<VisibilityState>({
		showGoalMap: true,
		showLearnerMap: true,
		showCorrectEdges: true,
		showMissingEdges: true,
		showExcessiveEdges: true,
		showNeutralEdges: true,
		consolidatedView: true,
		showNamesOnHover: true,
	});

	const [mobileSidePanelOpen, setMobileSidePanelOpen] = useState(false);
	const [mobileControlsOpen, setMobileControlsOpen] = useState(false);

	const handleVisibilityChange = useCallback((updates: Partial<VisibilityState>) => {
		setVisibility((prev) => ({ ...prev, ...updates }));
	}, []);

	const { data, isLoading, rpcError } = useRpcQuery(LearnerMapRpc.getDiagnosis({ assignmentId }));
	const { data: studentForms } = useRpcQuery(FormRpc.getStudentForms());
	const learnerMapId = data?.learnerMap.id ?? null;
	const { data: analyticsData } = useRpcQuery({
		...AnalyticsRpc.getLearnerMapForAnalytics(learnerMapId ?? ""),
		enabled: learnerMapId !== null,
	});

	const newAttemptMutation = useRpcMutation(LearnerMapRpc.startNewAttempt(), {
		operation: "start new attempt",
		showSuccess: true,
		successMessage: "New attempt started successfully",
	});

	const edgeClassifications = useMemo(() => {
		if (analyticsData) return analyticsData.edgeClassifications ?? [];
		if (!data) return [];
		return classifyEdges(data.goalMap.edges, data.learnerMap.edges);
	}, [analyticsData, data]);

	const postTestForm = studentForms?.find((form) => form.id === data?.assignment.postTestFormId);
	const postTestCompleted = postTestForm?.unlockStatus === "completed";
	const postTestButtonLabel = postTestCompleted ? "View post-test result" : "Take Post-Test";
	const postTestDescription = postTestCompleted
		? "You've completed this assignment. Review your submission before leaving."
		: "Complete the post-test flow before leaving the assignment.";

	const handleTryAgain = async () => {
		const result = await newAttemptMutation.mutateAsync({ assignmentId });

		if (!result.success) return;

		void queryClient.invalidateQueries({
			queryKey: LearnerMapRpc.learnerMaps(),
		});
		void navigate({
			to: `/dashboard/learner-map/${assignmentId}`,
		});
	};

	if (isLoading) {
		return (
			<div className="h-full flex items-center justify-center">
				<div className="text-muted-foreground">Loading results…</div>
			</div>
		);
	}

	if (rpcError) {
		return (
			<div className="h-full flex items-center justify-center">
				<div className="text-center space-y-4">
					<p className="text-muted-foreground">{rpcError}</p>
					<Button asChild variant="outline">
						<Link to="/dashboard/assignments" preload="intent">
							Back to Assignments
						</Link>
					</Button>
				</div>
			</div>
		);
	}

	if (!data) {
		return (
			<div className="h-full flex items-center justify-center">
				<div className="text-center space-y-4">
					<p className="text-muted-foreground">Results not found</p>
					<Button asChild variant="outline">
						<Link to="/dashboard/assignments" preload="intent">
							Back to Assignments
						</Link>
					</Button>
				</div>
			</div>
		);
	}

	const { assignment, learnerMap, goalMap, diagnosis } = data;

	if (!diagnosis) {
		return (
			<div className="h-full flex items-center justify-center">
				<div className="text-center space-y-4">
					<p className="text-muted-foreground">
						No diagnosis available. Submit your map first.
					</p>
					<Button asChild>
						<Link
							to="/dashboard/learner-map/$assignmentId"
							params={{ assignmentId }}
							preload="intent"
						>
							Go to Editor
						</Link>
					</Button>
				</div>
			</div>
		);
	}

	const correctEdges = diagnosis.correct ?? [];
	const missingEdges = diagnosis.missing ?? [];
	const excessiveEdges = diagnosis.excessive ?? [];
	const totalGoalEdges = correctEdges.length + missingEdges.length;
	const hasEdgeDetails = totalGoalEdges > 0 || correctEdges.length + excessiveEdges.length > 0;

	const postTestLinkProps = {
		to: "/dashboard/forms/take" as const,
		search: {
			formId: assignment.postTestFormId!,
			redirectBack: `/dashboard/assignments/${assignmentId}`,
		},
	};

	return (
		<TooltipProvider delay={300}>
			<section className="relative h-full overflow-hidden -mx-4 md:-mx-6">
				<div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(0,0,0,0.03),transparent_55%)]">
					<AnalyticsCanvas
						goalMap={{
							id: goalMap.id,
							title: goalMap.title,
							nodes: goalMap.nodes,
							edges: goalMap.edges,
							direction: goalMap.direction as "bi" | "uni" | "multi",
						}}
						learnerMap={{
							...learnerMap,
							userId: learnerMap.userId,
							userName: "You",
						}}
						edgeClassifications={edgeClassifications}
						visibility={visibility}
						isMultiView={false}
					/>
				</div>

				<div className="absolute inset-0 z-10 pointer-events-none">
					{/* Top toolbar */}
					<div className="border-b-[0.5px] pointer-events-auto bg-background/70 backdrop-blur supports-backdrop-filter:bg-background/50">
						<div className="h-12 px-3 flex items-center gap-2">
							<h1 className="text-sm font-medium truncate">
								{assignment.title || "Assignment Results"}
							</h1>
							<Badge variant="outline" className="text-[11px] h-5 px-1.5 shrink-0">
								Attempt {learnerMap.attempt}
							</Badge>
							<Badge className="bg-emerald-600 text-white text-[11px] h-5 px-1.5 shrink-0">
								Submitted
							</Badge>
							<div className="ml-auto flex items-center gap-1.5 shrink-0">
								<ToolbarButton
									icon={ArrowLeftIcon}
									label="Back to assignments"
									onClick={() => navigate({ to: "/dashboard/assignments" })}
									handle={tooltipHandle}
								/>
								<Button
									onClick={handleTryAgain}
									disabled={newAttemptMutation.isPending}
									size="sm"
									className="h-8 gap-1"
								>
									<RefreshCwIcon className="size-4" />
									{newAttemptMutation.isPending ? "Starting..." : "Try Again"}
								</Button>
							</div>
						</div>
					</div>

					{/* Desktop panels */}
					<div className="hidden sm:block">
						<div className="absolute bottom-3 left-3 pointer-events-auto">
							<ResultControlsPanel
								visibility={visibility}
								onChange={handleVisibilityChange}
							/>
						</div>
						<div className="absolute top-14 right-3 pointer-events-auto">
							<ResultSidePanel
								correctEdges={correctEdges.length}
								missingEdges={missingEdges.length}
								excessiveEdges={excessiveEdges.length}
								totalGoalEdges={totalGoalEdges}
								score={diagnosis.score ?? 0}
								hasEdgeDetails={hasEdgeDetails}
								postTestFormId={assignment.postTestFormId}
								postTestCompleted={postTestCompleted}
								postTestButtonLabel={postTestButtonLabel}
								postTestDescription={postTestDescription}
								postTestLinkProps={postTestLinkProps}
							/>
						</div>
					</div>

					{/* Mobile floating action buttons */}
					<div className="sm:hidden absolute bottom-3 inset-x-0 flex items-center justify-center pointer-events-auto">
						<ButtonGroup>
							<Button variant="floating" onClick={() => setMobileControlsOpen(true)}>
								<SlidersHorizontalIcon className="size-4" />
								<span className="text-xs">Controls</span>
							</Button>
							<Button variant="floating" onClick={() => setMobileSidePanelOpen(true)}>
								<BarChart3Icon className="size-4" />
								<span className="text-xs">Results</span>
							</Button>
						</ButtonGroup>
					</div>
				</div>
			</section>

			{/* Mobile overlay: controls */}
			<ResultMobileOverlay
				open={mobileControlsOpen}
				onClose={() => setMobileControlsOpen(false)}
				title="Visibility Controls"
			>
				<AnalyticsControls
					visibility={visibility}
					onChange={handleVisibilityChange}
					showDisplayOptions={false}
				/>
			</ResultMobileOverlay>

			{/* Mobile overlay: side panel */}
			<ResultMobileOverlay
				open={mobileSidePanelOpen}
				onClose={() => setMobileSidePanelOpen(false)}
				title="Results &amp; Details"
			>
				<ResultSidePanel
					correctEdges={correctEdges.length}
					missingEdges={missingEdges.length}
					excessiveEdges={excessiveEdges.length}
					totalGoalEdges={totalGoalEdges}
					score={diagnosis.score ?? 0}
					hasEdgeDetails={hasEdgeDetails}
					postTestFormId={assignment.postTestFormId}
					postTestCompleted={postTestCompleted}
					postTestButtonLabel={postTestButtonLabel}
					postTestDescription={postTestDescription}
					postTestLinkProps={postTestLinkProps}
				/>
			</ResultMobileOverlay>

			<TooltipContent handle={tooltipHandle} />
		</TooltipProvider>
	);
}
