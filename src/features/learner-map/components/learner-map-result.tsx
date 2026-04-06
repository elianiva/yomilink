import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, getRouteApi } from "@tanstack/react-router";
import type { Edge, MarkerType, Node } from "@xyflow/react";
import { Background, MiniMap, ReactFlow } from "@xyflow/react";

import "@xyflow/react/dist/style.css";
import { ArrowLeftIcon, RefreshCwIcon } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ConnectorNode } from "@/features/kitbuild/components/connector-node";
import { FloatingEdge } from "@/features/kitbuild/components/floating-edge";
import { TextNode } from "@/features/kitbuild/components/text-node";
import { DiagnosisStats } from "@/features/learner-map/components/diagnosis/diagnosis-stats";
import { getEdgeStyleByType } from "@/features/learner-map/lib/comparator";
import { useRpcMutation, useRpcQuery } from "@/hooks/use-rpc-query";
import { LearnerMapRpc } from "@/server/rpc/learner-map";

const routeApi = getRouteApi("/dashboard/learner-map/$assignmentId/result");

interface VisibilityState {
	showGoalMap: boolean;
	showLearnerMap: boolean;
	showCorrectEdges: boolean;
	showMissingEdges: boolean;
	showExcessiveEdges: boolean;
}

function LegendDot({ color }: { color: string }) {
	return <span className="inline-block size-3 rounded-full" style={{ backgroundColor: color }} />;
}

function ComparisonControls({
	visibility,
	onChange,
}: {
	visibility: VisibilityState;
	onChange: (updates: Partial<VisibilityState>) => void;
}) {
	return (
		<div className="space-y-3">
			<div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
				Map Visibility
			</div>
			<div className="flex items-center gap-4 flex-wrap">
				<div className="flex items-center gap-2 text-xs">
					<Switch
						checked={visibility.showGoalMap}
						onCheckedChange={(v) => onChange({ showGoalMap: v })}
					/>
					<span>Goal Map</span>
				</div>
				<div className="flex items-center gap-2 text-xs">
					<Switch
						checked={visibility.showLearnerMap}
						onCheckedChange={(v) => onChange({ showLearnerMap: v })}
					/>
					<span>Your Map</span>
				</div>
			</div>

			<div className="text-xs font-medium text-muted-foreground uppercase tracking-wide pt-2 border-t">
				Edge Types
			</div>
			<div className="flex items-center gap-3 flex-wrap">
				<div className="flex items-center gap-1.5 text-xs">
					<Switch
						checked={visibility.showCorrectEdges}
						onCheckedChange={(v) => onChange({ showCorrectEdges: v })}
					/>
					<LegendDot color="#22c55e" />
					<span>Correct</span>
				</div>
				<div className="flex items-center gap-1.5 text-xs">
					<Switch
						checked={visibility.showMissingEdges}
						onCheckedChange={(v) => onChange({ showMissingEdges: v })}
					/>
					<LegendDot color="#f59e0b" />
					<span>Missing</span>
				</div>
				<div className="flex items-center gap-1.5 text-xs">
					<Switch
						checked={visibility.showExcessiveEdges}
						onCheckedChange={(v) => onChange({ showExcessiveEdges: v })}
					/>
					<LegendDot color="#ef4444" />
					<span>Excessive</span>
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
	});

	const handleVisibilityChange = useCallback((updates: Partial<VisibilityState>) => {
		setVisibility((prev) => ({ ...prev, ...updates }));
	}, []);

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

	// Merge nodes from goal map and learner map (goal map positions as source of truth)
	const mergedNodes = useMemo(() => {
		if (!data?.goalMap || !data?.learnerMap) return [];

		const nodeMap = new Map<string, Node>();

		// Add goal map nodes first
		for (const node of data.goalMap.nodes) {
			nodeMap.set(node.id, node);
		}

		// Merge learner map nodes, keeping goal map positions
		for (const node of data.learnerMap.nodes) {
			const existingNode = nodeMap.get(node.id);
			if (existingNode) {
				nodeMap.set(node.id, { ...node, position: existingNode.position });
			} else {
				nodeMap.set(node.id, node);
			}
		}

		return Array.from(nodeMap.values());
	}, [data]);

	// Process edges for visualization based on visibility
	const processedEdges = useMemo(() => {
		if (!data?.diagnosis || !data?.learnerMap || !data?.goalMap) return [];

		const edgesToDisplay: Edge[] = [];
		const { showGoalMap, showLearnerMap, showCorrectEdges, showMissingEdges, showExcessiveEdges } =
			visibility;

		const correctSet = new Set(data.diagnosis.correct.map((e) => `${e.source}-${e.target}`));
		const excessiveSet = new Set(data.diagnosis.excessive.map((e) => `${e.source}-${e.target}`));

		if (showGoalMap && showLearnerMap) {
			// Combined view: classify learner edges and show missing edges
			for (const edge of data.learnerMap.edges) {
				const edgeKey = `${edge.source}-${edge.target}`;
				let edgeType: "correct" | "excessive" | "missing" = "missing";
				if (correctSet.has(edgeKey)) edgeType = "correct";
				else if (excessiveSet.has(edgeKey)) edgeType = "excessive";

				let shouldShow = false;
				switch (edgeType) {
					case "correct":
						shouldShow = showCorrectEdges;
						break;
					case "excessive":
						shouldShow = showExcessiveEdges;
						break;
				}

				if (shouldShow) {
					const style = getEdgeStyleByType(edgeType);
					edgesToDisplay.push({
						...edge,
						type: "floating",
						style,
						markerEnd: {
							type: "arrowclosed" as MarkerType,
							color: style.stroke,
						},
					});
				}
			}

			// Add missing edges from goal map
			if (showMissingEdges) {
				for (const missing of data.diagnosis.missing) {
					const style = getEdgeStyleByType("missing");
					edgesToDisplay.push({
						id: `missing-${missing.source}-${missing.target}`,
						source: missing.source,
						target: missing.target,
						type: "floating",
						style,
						animated: true,
						markerEnd: {
							type: "arrowclosed" as MarkerType,
							color: style.stroke,
						},
					});
				}
			}
		} else if (showGoalMap) {
			// Show only goal map edges
			for (const edge of data.goalMap.edges) {
				edgesToDisplay.push({
					...edge,
					type: "floating",
					style: { stroke: "#64748b", strokeWidth: 2 },
					markerEnd: {
						type: "arrowclosed" as MarkerType,
						color: "#64748b",
					},
				});
			}
		} else if (showLearnerMap) {
			// Show only learner edges (excluding missing)
			for (const edge of data.learnerMap.edges) {
				const edgeKey = `${edge.source}-${edge.target}`;
				let edgeType: "correct" | "excessive" = "excessive";
				if (correctSet.has(edgeKey)) edgeType = "correct";

				let shouldShow = false;
				switch (edgeType) {
					case "correct":
						shouldShow = showCorrectEdges;
						break;
					case "excessive":
						shouldShow = showExcessiveEdges;
						break;
				}

				if (shouldShow) {
					const style = getEdgeStyleByType(edgeType);
					edgesToDisplay.push({
						...edge,
						type: "floating",
						style,
						markerEnd: {
							type: "arrowclosed" as MarkerType,
							color: style.stroke,
						},
					});
				}
			}
		}

		return edgesToDisplay;
	}, [data, visibility]);

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
						<h1 className="font-semibold">Results</h1>
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

					{/* Map Comparison Controls */}
					<div className="bg-card border rounded-lg p-4">
						<ComparisonControls visibility={visibility} onChange={handleVisibilityChange} />
					</div>

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
						<div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-3">
							<h3 className="font-medium text-primary">Next Steps</h3>
							<p className="text-sm text-muted-foreground">
								Please complete the following activities to finish the experiment.
							</p>
							<div className="space-y-2">
								{assignment.postTestFormId && (
									<Button
										asChild
										className="w-full justify-start"
										variant="outline"
									>
										<Link
											to="/dashboard/forms/take"
											search={{ formId: assignment.postTestFormId }}
										>
											Take Post-Test
										</Link>
									</Button>
								)}
								{assignment.tamFormId && (
									<Button
										asChild
										className="w-full justify-start"
										variant="outline"
									>
										<Link
											to="/dashboard/forms/take"
											search={{ formId: assignment.tamFormId }}
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
				<div className="flex-1 relative">
					<ReactFlow
						nodes={mergedNodes}
						edges={processedEdges}
						nodeTypes={nodeTypes}
						edgeTypes={edgeTypes}
						nodesDraggable={false}
						nodesConnectable={false}
						elementsSelectable={false}
						panOnDrag
						zoomOnScroll
						fitView
					>
						<MiniMap />
						<Background gap={16} />
					</ReactFlow>
				</div>
			</div>
		</div>
	);
}
