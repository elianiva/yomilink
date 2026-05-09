import { useQueryClient } from "@tanstack/react-query";
import { Link, getRouteApi, useNavigate } from "@tanstack/react-router";
import { ArrowLeftIcon, FileTextIcon, RefreshCwIcon, XIcon } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { ToolbarButton } from "@/components/toolbar/toolbar-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { createTooltipHandle, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { AnalyticsControls } from "@/features/analyzer/components/analytics-controls";
import { AnalyticsCanvas } from "@/features/analyzer/components/canvas";
import { DiagnosisStats } from "@/features/learner-map/components/diagnosis/diagnosis-stats";
import { classifyEdges } from "@/features/learner-map/lib/comparator";
import { useRpcMutation, useRpcQuery } from "@/hooks/use-rpc-query";
import { AnalyticsRpc } from "@/server/rpc/analytics";
import { FormRpc } from "@/server/rpc/form";
import { LearnerMapRpc } from "@/server/rpc/learner-map";

const routeApi = getRouteApi("/dashboard/learner-map/$assignmentId/result");

interface VisibilityState {
	showGoalMap: boolean;
	showLearnerMap: boolean;
	showCorrectEdges: boolean;
	showMissingEdges: boolean;
	showExcessiveEdges: boolean;
	showNeutralEdges: boolean;
	consolidatedView: boolean;
	showNamesOnHover: boolean;
}

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

	const handleVisibilityChange = useCallback((updates: Partial<VisibilityState>) => {
		setVisibility((prev) => ({ ...prev, ...updates }));
	}, []);

	const { data, isLoading, rpcError } = useRpcQuery(LearnerMapRpc.getDiagnosis({ assignmentId }));
	// const { data: peerStats } = useRpcQuery(LearnerMapRpc.getPeerStats({ assignmentId }));
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
				<div className="text-muted-foreground">Loading results...</div>
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
	const scorePercentage = totalGoalEdges > 0 ? Math.round((diagnosis.score ?? 0) * 100) : 0;

	return (
		<TooltipProvider delay={300}>
			<section className="relative h-full overflow-hidden">
				{/* Canvas layer — fills everything */}
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

				{/* Floating UI layer */}
				<div className="absolute inset-0 z-10 pointer-events-none">
					{/* Top toolbar bar */}
					<div className="border-b-[0.5px] pointer-events-auto bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/50">
						<div className="h-12 px-3 flex items-center gap-2">
							<h1 className="text-sm font-medium">
								{assignment.title || "Assignment Results"}
							</h1>
							<Badge variant="outline" className="text-[11px] h-5 px-1.5">
								Attempt {learnerMap.attempt}
							</Badge>
							<Badge className="bg-emerald-600 text-white text-[11px] h-5 px-1.5">
								Submitted
							</Badge>
							<div className="ml-auto flex items-center gap-1.5">
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

					{/* Controls floating bottom-left */}
					<div className="absolute bottom-3 left-3 pointer-events-auto bg-card/30 backdrop-blur-lg border rounded-lg shadow-lg max-w-64">
						<AnalyticsControls
							visibility={visibility}
							onChange={handleVisibilityChange}
							showDisplayOptions={false}
						/>
					</div>

					{/* Floating sidebar — always visible */}
					<div className="absolute top-14 right-3 w-80 bg-card/30 backdrop-blur-lg border rounded-lg shadow-sm pointer-events-auto max-h-[calc(100vh-8rem)] overflow-y-auto">
						<div className="border-b-[0.5px] px-3 py-2.5 flex items-center gap-2 sticky top-0 bg-inherit">
							<div className="flex items-center gap-1.5 text-sm">
								<span className="text-muted-foreground">Score</span>
								<span className="font-semibold">{scorePercentage}%</span>
							</div>
							<Separator orientation="vertical" className="h-4" />
							<div className="flex items-center gap-2 text-xs">
								<span className="inline-flex items-center gap-1 text-muted-foreground">
									<span className="size-2 rounded-full bg-[var(--edge-correct)]" />
									{correctEdges.length}
								</span>
								<span className="inline-flex items-center gap-1 text-muted-foreground">
									<span className="size-2 rounded-full bg-[var(--edge-missing)]" />
									{missingEdges.length}
								</span>
								<span className="inline-flex items-center gap-1 text-muted-foreground">
									<span className="size-2 rounded-full bg-[var(--edge-excessive)]" />
									{excessiveEdges.length}
								</span>
							</div>
						</div>
						<div className="p-3">
							<DiagnosisStats
								correct={correctEdges.length}
								missing={missingEdges.length}
								excessive={excessiveEdges.length}
								total={totalGoalEdges}
								score={diagnosis.score ?? 0}
							/>
						</div>
						{!hasEdgeDetails && (
							<>
								<Separator />
								<div className="p-3 text-sm text-muted-foreground">
									No edge-level data came through for this result. If this should
									show a map, the source data may be empty or malformed.
								</div>
							</>
						)}
						{"summary" in diagnosis && diagnosis.summary && (
							<>
								<Separator />
								<div className="p-3 space-y-2">
									<p className="text-sm font-medium">Summary</p>
									<p className="text-sm text-muted-foreground">
										{diagnosis.summary}
									</p>
								</div>
							</>
						)}
						{/* {peerStats && peerStats.count > 0 && ( */}
						{/* 	<> */}
						{/* 		<Separator /> */}
						{/* 		<div className="p-3 space-y-2 text-sm"> */}
						{/* 			<p className="text-sm font-medium">Peer comparison</p> */}
						{/* 			<div className="flex items-center justify-between gap-3"> */}
						{/* 				<span className="text-muted-foreground"> */}
						{/* 					Students submitted */}
						{/* 				</span> */}
						{/* 				<span className="font-medium">{peerStats.count}</span> */}
						{/* 			</div> */}
						{/* 			<div className="flex items-center justify-between gap-3"> */}
						{/* 				<span className="text-muted-foreground">Average score</span> */}
						{/* 				<span className="font-medium"> */}
						{/* 					{Math.round((peerStats.avgScore ?? 0) * 100)}% */}
						{/* 				</span> */}
						{/* 			</div> */}
						{/* 			<div className="flex items-center justify-between gap-3"> */}
						{/* 				<span className="text-muted-foreground">Median score</span> */}
						{/* 				<span className="font-medium"> */}
						{/* 					{Math.round((peerStats.medianScore ?? 0) * 100)}% */}
						{/* 				</span> */}
						{/* 			</div> */}
						{/* 		</div> */}
						{/* 	</> */}
						{/* )} */}
						{assignment.postTestFormId && (
							<>
								<Separator />
								<div className="p-3 space-y-2.5">
									<div className="flex items-center gap-2">
										<div className="rounded-md bg-primary p-1.5">
											<FileTextIcon className="size-4 text-primary-foreground" />
										</div>
										<p className="text-sm font-medium text-foreground">
											{postTestCompleted ? "Completed" : "Next step required"}
										</p>
										{postTestCompleted && (
											<Badge className="bg-emerald-600 text-white">
												Done
											</Badge>
										)}
									</div>
									<p className="text-sm text-muted-foreground">
										{postTestDescription}
									</p>
									<Button asChild className="w-full gap-2" size="lg">
										<Link
											to="/dashboard/forms/take"
											search={{
												formId: assignment.postTestFormId,
											}}
										>
											{postTestButtonLabel}
										</Link>
									</Button>
								</div>
							</>
						)}
					</div>
				</div>
			</section>
			<TooltipContent handle={tooltipHandle} />
		</TooltipProvider>
	);
}
