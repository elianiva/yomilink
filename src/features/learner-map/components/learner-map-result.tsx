import { useQueryClient } from "@tanstack/react-query";
import { Link, getRouteApi, useNavigate } from "@tanstack/react-router";
import { ArrowLeftIcon, ArrowRightIcon, FileTextIcon, RefreshCwIcon } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import "@xyflow/react/dist/style.css";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { AnalyticsControls } from "@/features/analyzer/components/analytics-controls";
import { AnalyticsCanvas } from "@/features/analyzer/components/canvas";
import { DiagnosisStats } from "@/features/learner-map/components/diagnosis/diagnosis-stats";
import { classifyEdges } from "@/features/learner-map/lib/comparator";
import { useRpcMutation, useRpcQuery } from "@/hooks/use-rpc-query";
import { AnalyticsRpc } from "@/server/rpc/analytics";
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

	const { data, isLoading } = useRpcQuery(LearnerMapRpc.getDiagnosis({ assignmentId }));
	const { data: peerStats } = useRpcQuery(LearnerMapRpc.getPeerStats({ assignmentId }));
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

	const handleTryAgain = async () => {
		const result = await newAttemptMutation.mutateAsync({ assignmentId });

		if (result.success) {
			void queryClient.invalidateQueries({
				queryKey: LearnerMapRpc.learnerMaps(),
			});
			void navigate({
				to: `/dashboard/learner-map/${assignmentId}`,
			});
		}
	};

	const { assignment } = data;
	const resultData = analyticsData ?? data;
	const learnerMap = resultData?.learnerMap;
	const goalMap = resultData?.goalMap;
	const diagnosis = resultData?.diagnosis;
	const edgeClassifications = useMemo(() => {
		if (analyticsData) return analyticsData.edgeClassifications ?? [];
		return classifyEdges(data.goalMap.edges, data.learnerMap.edges);
	}, [analyticsData, data.goalMap.edges, data.learnerMap.edges]);

	if (!diagnosis || !learnerMap || !goalMap) {
		return (
			<div className="h-full flex items-center justify-center">
				<div className="text-center space-y-4">
					<p className="text-muted-foreground">
						No diagnosis available. Submit your map first.
					</p>
					<Button asChild>
						<a href={`/dashboard/learner-map/${assignmentId}`}>Go to Editor</a>
					</Button>
				</div>
			</div>
		);
	}

	const correctEdges = diagnosis.correct ?? [];
	const missingEdges = diagnosis.missing ?? [];
	const excessiveEdges = diagnosis.excessive ?? [];
	const totalGoalEdges =
		"totalGoalEdges" in diagnosis
			? (diagnosis.totalGoalEdges ?? 0)
			: correctEdges.length + missingEdges.length;
	const totalLearnerEdges = correctEdges.length + excessiveEdges.length;
	const hasEdgeDetails = totalGoalEdges > 0 || totalLearnerEdges > 0;
	const scorePercentage = totalGoalEdges > 0 ? Math.round((diagnosis.score ?? 0) * 100) : 0;

	if (isLoading) {
		return (
			<div className="h-full flex items-center justify-center">
				<div className="text-muted-foreground">Loading results...</div>
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

	return (
		<div className="flex h-full min-h-0 flex-col gap-3">
			<header className="rounded-2xl border border-border/60 bg-card/95 p-4 shadow-sm">
				<div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
					<div className="space-y-2">
						<div className="flex items-start gap-3">
							<Button variant="ghost" size="icon" asChild className="-ml-2 mt-0">
								<Link to="/dashboard/assignments" preload="intent">
									<ArrowLeftIcon className="size-4" />
								</Link>
							</Button>
							<div className="space-y-2">
								<div className="flex flex-wrap items-center gap-2">
									<h1 className="text-xl font-semibold tracking-tight">
										{assignment.title || "Assignment Results"}
									</h1>
									<Badge variant="outline">Attempt {learnerMap.attempt}</Badge>
									<Badge className="bg-emerald-600 text-white">Submitted</Badge>
								</div>
								<p className="max-w-2xl text-sm text-muted-foreground">
									Side-by-side map review with edge-level breakdown, peer context,
									and a cleaner diagnostic canvas.
								</p>
							</div>
						</div>

						<div className="flex flex-wrap gap-2">
							<Badge
								variant="outline"
								className="rounded-full px-2.5 py-0.5 text-[11px]"
							>
								{scorePercentage}% score
							</Badge>
							<Badge
								variant="outline"
								className="rounded-full px-2.5 py-0.5 text-[11px]"
							>
								{correctEdges.length} correct
							</Badge>
							<Badge
								variant="outline"
								className="rounded-full px-2.5 py-0.5 text-[11px]"
							>
								{missingEdges.length} missing
							</Badge>
							<Badge
								variant="outline"
								className="rounded-full px-2.5 py-0.5 text-[11px]"
							>
								{excessiveEdges.length} excessive
							</Badge>
						</div>
					</div>

					<div className="flex flex-wrap items-center gap-2">
						<Button variant="outline" asChild>
							<Link to="/dashboard/assignments" preload="intent">
								Back to assignments
							</Link>
						</Button>
						<Button
							onClick={handleTryAgain}
							disabled={newAttemptMutation.isPending}
							className="gap-2"
						>
							<RefreshCwIcon className="size-4" />
							{newAttemptMutation.isPending ? "Starting..." : "Try Again"}
						</Button>
					</div>
				</div>
			</header>

			<div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[21rem_minmax(0,1fr)]">
				<aside className="min-h-0">
					<ScrollArea className="h-full pr-2">
						<div className="overflow-hidden rounded-xl border border-border/60 bg-card/90 shadow-sm">
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
										No edge-level data came through for this result. If this
										should show a map, the source data may be empty or
										malformed.
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
							{peerStats && peerStats.count > 0 && (
								<>
									<Separator />
									<div className="p-3 space-y-2 text-sm">
										<p className="text-sm font-medium">Peer comparison</p>
										<div className="flex items-center justify-between gap-3">
											<span className="text-muted-foreground">
												Students submitted
											</span>
											<span className="font-medium">{peerStats.count}</span>
										</div>
										<div className="flex items-center justify-between gap-3">
											<span className="text-muted-foreground">
												Average score
											</span>
											<span className="font-medium">
												{Math.round((peerStats.avgScore ?? 0) * 100)}%
											</span>
										</div>
										<div className="flex items-center justify-between gap-3">
											<span className="text-muted-foreground">
												Median score
											</span>
											<span className="font-medium">
												{Math.round((peerStats.medianScore ?? 0) * 100)}%
											</span>
										</div>
										<div className="flex items-center justify-between gap-3">
											<span className="text-muted-foreground">
												Your ranking
											</span>
											<span className="font-medium">
												Top {peerStats.userPercentile}%
											</span>
										</div>
									</div>
								</>
							)}
							{(assignment.postTestFormId || assignment.tamFormId) && (
								<>
									<Separator />
									<div className="p-3 space-y-2.5">
										<div className="flex items-center gap-2">
											<div className="rounded-md bg-primary p-1.5">
												<FileTextIcon className="size-4 text-primary-foreground" />
											</div>
											<p className="text-sm font-medium text-foreground">
												Next step required
											</p>
										</div>
										<p className="text-sm text-muted-foreground">
											Complete the post-test flow before leaving the
											assignment.
										</p>
										<div className="space-y-2">
											{assignment.postTestFormId && (
												<Button asChild className="w-full gap-2" size="lg">
													<Link
														to="/dashboard/forms/take"
														search={{
															formId: assignment.postTestFormId,
															returnTo: `/dashboard/learner-map/${assignmentId}/result`,
														}}
													>
														Take Post-Test
														<ArrowRightIcon className="size-4" />
													</Link>
												</Button>
											)}
											{assignment.tamFormId && (
												<Button
													asChild
													variant="outline"
													className="w-full justify-start"
												>
													<Link
														to="/dashboard/forms/take"
														search={{
															formId: assignment.tamFormId,
															returnTo: `/dashboard/learner-map/${assignmentId}/result`,
														}}
													>
														Take TAM Survey
													</Link>
												</Button>
											)}
										</div>
									</div>
								</>
							)}
						</div>
					</ScrollArea>
				</aside>

				<section className="min-h-0 flex flex-col gap-3">
					<div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border/60 bg-card/90 shadow-sm">
						<div className="flex flex-col gap-3 border-b border-border/60 bg-muted/20 px-4 py-3 xl:flex-row xl:items-center xl:justify-between">
							<div className="space-y-1">
								<p className="text-sm font-medium">Comparison canvas</p>
								<p className="text-xs text-muted-foreground">
									Goal map on top of your submission. Toggle layers and edge types
									below.
								</p>
							</div>
							<div className="flex flex-wrap gap-2">
								<Badge
									variant="outline"
									className="h-6 rounded-full px-2 text-[11px]"
								>
									Goal map
								</Badge>
								<Badge
									variant="outline"
									className="h-6 rounded-full px-2 text-[11px]"
								>
									Your map
								</Badge>
								<Badge
									variant="outline"
									className="h-6 rounded-full px-2 text-[11px]"
								>
									Names on hover
								</Badge>
							</div>
						</div>
						<AnalyticsControls
							visibility={visibility}
							onChange={handleVisibilityChange}
							showDisplayOptions={false}
						/>
						<Separator />
						<div className="relative min-h-130 flex-1 bg-[radial-gradient(circle_at_top,rgba(0,0,0,0.03),transparent_55%)]">
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
					</div>
				</section>
			</div>
		</div>
	);
}
