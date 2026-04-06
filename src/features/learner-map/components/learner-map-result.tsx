import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, getRouteApi } from "@tanstack/react-router";
import type { Edge } from "@xyflow/react";
import { ArrowLeftIcon, ArrowRightIcon, FileTextIcon, RefreshCwIcon } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import "@xyflow/react/dist/style.css";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { AnalyticsCanvas } from "@/features/analyzer/components/canvas";
import { DiagnosisStats } from "@/features/learner-map/components/diagnosis/diagnosis-stats";
import { useRpcMutation, useRpcQuery } from "@/hooks/use-rpc-query";
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

function LegendDot({ color }: { color: string }) {
	return <span className="inline-block size-3 rounded-full" style={{ backgroundColor: color }} />;
}

function ToolbarToggle({
	checked,
	onChange,
	label,
	color,
}: {
	checked: boolean;
	onChange: (v: boolean) => void;
	label: string;
	color?: string;
}) {
	return (
		<div className="flex items-center gap-1.5">
			<Switch checked={checked} onCheckedChange={onChange} />
			{color && <LegendDot color={color} />}
			<span className="text-xs">{label}</span>
		</div>
	);
}

function ComparisonToolbar({
	visibility,
	onChange,
}: {
	visibility: VisibilityState;
	onChange: (updates: Partial<VisibilityState>) => void;
}) {
	return (
		<div className="border-b bg-background/70 backdrop-blur p-3">
			<div className="flex items-center gap-6">
				<div className="flex items-center gap-3">
					<span className="text-xs font-medium text-muted-foreground uppercase">
						Maps
					</span>
					<ToolbarToggle
						checked={visibility.showGoalMap}
						onChange={(v) => onChange({ showGoalMap: v })}
						label="Goal Map"
					/>
					<ToolbarToggle
						checked={visibility.showLearnerMap}
						onChange={(v) => onChange({ showLearnerMap: v })}
						label="Your Map"
					/>
				</div>
				<div className="w-px h-5 bg-border" />
				<div className="flex items-center gap-3">
					<span className="text-xs font-medium text-muted-foreground uppercase">
						Edges
					</span>
					<ToolbarToggle
						checked={visibility.showCorrectEdges}
						onChange={(v) => onChange({ showCorrectEdges: v })}
						label="Correct"
						color="#22c55e"
					/>
					<ToolbarToggle
						checked={visibility.showMissingEdges}
						onChange={(v) => onChange({ showMissingEdges: v })}
						label="Missing"
						color="#f59e0b"
					/>
					<ToolbarToggle
						checked={visibility.showExcessiveEdges}
						onChange={(v) => onChange({ showExcessiveEdges: v })}
						label="Excessive"
						color="#ef4444"
					/>
				</div>
			</div>
		</div>
	);
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
		showNamesOnHover: false,
	});

	const handleVisibilityChange = useCallback((updates: Partial<VisibilityState>) => {
		setVisibility((prev) => ({ ...prev, ...updates }));
	}, []);

	const { data, isLoading } = useRpcQuery(LearnerMapRpc.getDiagnosis({ assignmentId }));

	const { data: peerStats } = useRpcQuery(LearnerMapRpc.getPeerStats({ assignmentId }));

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

	// Build edgeClassifications from diagnosis for AnalyticsCanvas
	// Convert simple {source, target} links to proper Edge objects
	const edgeClassifications = useMemo(() => {
		if (!data?.diagnosis) return [];

		const classifications: Array<{
			edge: Edge;
			type: "correct" | "missing" | "excessive" | "neutral";
		}> = [];

		// Helper to create a proper Edge from a link
		const createEdge = (link: { source: string; target: string }): Edge => ({
			id: `${link.source}-${link.target}`,
			source: link.source,
			target: link.target,
		});

		// Add correct edges
		for (const link of data.diagnosis.correct) {
			classifications.push({ edge: createEdge(link), type: "correct" });
		}

		// Add missing edges
		for (const link of data.diagnosis.missing) {
			classifications.push({ edge: createEdge(link), type: "missing" });
		}

		// Add excessive edges
		for (const link of data.diagnosis.excessive) {
			classifications.push({ edge: createEdge(link), type: "excessive" });
		}

		return classifications;
	}, [data]);

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

	const { learnerMap, diagnosis, assignment } = data;

	if (!diagnosis) {
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

	return (
		<div className="h-full flex flex-col">
			{/* Header */}
			<div className="border-b bg-background p-4 flex items-center justify-between">
				<div className="flex items-center gap-4">
					<Button variant="ghost" size="icon" asChild>
						<Link to="/dashboard/assignments" preload="intent">
							<ArrowLeftIcon className="size-4" />
						</Link>
					</Button>
					<div>
						<h1 className="font-semibold">
							{assignment.title || "Assignment Results"}
						</h1>
						<p className="text-sm text-muted-foreground">
							Attempt {learnerMap.attempt}
						</p>
					</div>
				</div>
				<Button
					onClick={handleTryAgain}
					disabled={newAttemptMutation.isPending}
					className="gap-2"
				>
					<RefreshCwIcon className="size-4" />
					{newAttemptMutation.isPending ? "Starting..." : "Try Again"}
				</Button>
			</div>

			{/* Content */}
			<div className="flex-1 flex overflow-hidden">
				{/* Sidebar with stats */}
				<div className="w-80 border-r p-4 overflow-y-auto space-y-4">
					<DiagnosisStats
						correct={diagnosis.correct.length}
						missing={diagnosis.missing.length}
						excessive={diagnosis.excessive.length}
						total={diagnosis.correct.length + diagnosis.missing.length}
						score={diagnosis.score ?? 0}
					/>

					{diagnosis.summary && (
						<div className="bg-card border rounded-lg p-4">
							<h3 className="font-medium mb-2">Summary</h3>
							<p className="text-sm text-muted-foreground">{diagnosis.summary}</p>
						</div>
					)}

					{/* Peer Comparison */}
					{peerStats && peerStats.count > 0 && (
						<div className="bg-card border rounded-lg p-4">
							<h3 className="font-medium mb-3">Peer Comparison</h3>
							<div className="space-y-2 text-sm">
								<div className="flex justify-between">
									<span className="text-muted-foreground">
										Students Submitted
									</span>
									<span className="font-medium">{peerStats.count}</span>
								</div>
								<div className="flex justify-between">
									<span className="text-muted-foreground">Average Score</span>
									<span className="font-medium">
										{Math.round(peerStats.avgScore! * 100)}%
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-muted-foreground">Median Score</span>
									<span className="font-medium">
										{Math.round(peerStats.medianScore! * 100)}%
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-muted-foreground">Your Ranking</span>
									<span className="font-medium">
										Top {peerStats.userPercentile}%
									</span>
								</div>
							</div>
						</div>
					)}

					{/* Next Steps */}
					{(assignment.postTestFormId || assignment.tamFormId) && (
						<div className="bg-primary/10 border border-primary/30 rounded-lg p-4 space-y-3">
							<div className="flex items-center gap-2">
								<div className="p-1.5 rounded-md bg-primary">
									<FileTextIcon className="h-4 w-4 text-primary-foreground" />
								</div>
								<h3 className="font-semibold text-primary">Next Step Required</h3>
							</div>
							<p className="text-sm text-muted-foreground">
								Please complete the post-test to finish this assignment.
							</p>
							<div className="space-y-2">
								{assignment.postTestFormId && (
									<Button asChild className="w-full" size="lg">
										<Link
											to="/dashboard/forms/take"
											search={{
												formId: assignment.postTestFormId,
												returnTo: `/dashboard/learner-map/${assignmentId}/result`,
											}}
										>
											Take Post-Test
											<ArrowRightIcon className="ml-2 h-4 w-4" />
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
					)}
				</div>

				{/* Map visualization */}
				<div className="flex-1 flex flex-col overflow-hidden">
					<ComparisonToolbar visibility={visibility} onChange={handleVisibilityChange} />
					<div className="flex-1 relative">
						{!data?.goalMap ? (
							<div className="absolute inset-0 flex items-center justify-center bg-muted/30">
								<div className="text-center text-muted-foreground">
									<p className="text-sm">No map data available</p>
									<p className="text-xs mt-1">
										Goal: {data?.goalMap?.nodes?.length ?? 0} nodes
										<br />
										Yours: {data?.learnerMap?.nodes?.length ?? 0} nodes
									</p>
								</div>
							</div>
						) : (
							<AnalyticsCanvas
								goalMap={{
									id: data.goalMap.id,
									title: data.goalMap.title,
									nodes: data.goalMap.nodes,
									edges: data.goalMap.edges,
									direction: data.goalMap.direction as "bi" | "uni" | "multi",
								}}
								learnerMap={{
									...data.learnerMap,
									userId: data.learnerMap.userId,
									userName: "You",
								}}
								edgeClassifications={edgeClassifications}
								visibility={visibility}
								isMultiView={false}
							/>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
