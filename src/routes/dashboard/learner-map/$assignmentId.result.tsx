import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import type { Edge, MarkerType, Node } from "@xyflow/react";
import { Background, MiniMap, ReactFlow } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { ArrowLeftIcon, RefreshCwIcon } from "lucide-react";
import { useMemo } from "react";
import { Guard } from "@/components/auth/Guard";
import { Button } from "@/components/ui/button";
import { ConnectorNode } from "@/features/kitbuild/components/connector-node";
import { FloatingEdge } from "@/features/kitbuild/components/floating-edge";
import { TextNode } from "@/features/kitbuild/components/text-node";
import { DiagnosisStats } from "@/features/learner-map/components/diagnosis/diagnosis-stats";
import { getEdgeStyleByType } from "@/lib/learnermap-comparator";
import { LearnerMapRpc } from "@/server/rpc/learner-map";

export const Route = createFileRoute(
	"/dashboard/learner-map/$assignmentId/result",
)({
	component: () => (
		<Guard roles={["student"]}>
			<ResultPage />
		</Guard>
	),
});

function ResultPage() {
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

	const { data, isLoading } = useQuery(
		LearnerMapRpc.getDiagnosis(assignmentId),
	);

	const { data: peerStats } = useQuery(
		LearnerMapRpc.getPeerStats(assignmentId),
	);

	const newAttemptMutation = useMutation(LearnerMapRpc.startNewAttempt());

	const handleTryAgain = async () => {
		const result = await newAttemptMutation.mutateAsync(assignmentId);
		if (result.success) {
			queryClient.invalidateQueries({
				queryKey: LearnerMapRpc.learnerMaps(),
			});
			navigate({
				to: `/dashboard/learner-map/${assignmentId}` as any,
			});
		}
	};

	// Process edges for visualization
	const processedEdges = useMemo(() => {
		if (!data?.diagnosis || !data?.learnerMap) return [];

		const correctSet = new Set(
			data.diagnosis.correct.map(
				(e: { source: string; target: string }) => `${e.source}-${e.target}`,
			),
		);
		const excessiveSet = new Set(
			data.diagnosis.excessive.map(
				(e: { source: string; target: string }) => `${e.source}-${e.target}`,
			),
		);

		// Color-code learner edges
		const coloredEdges: Edge[] = data.learnerMap.edges.map((edge: Edge) => {
			const key = `${edge.source}-${edge.target}`;
			let edgeType: "correct" | "excessive" | "neutral" = "neutral";

			if (correctSet.has(key)) {
				edgeType = "correct";
			} else if (excessiveSet.has(key)) {
				edgeType = "excessive";
			}

			const style = getEdgeStyleByType(edgeType);

			return {
				...edge,
				type: "floating",
				style,
				markerEnd: {
					type: "arrowclosed" as MarkerType,
					color: style.stroke,
				},
			};
		});

		// Add missing edges as dashed lines
		const missingEdges: Edge[] = data.diagnosis.missing.map(
			(missing: { source: string; target: string }, index: number) => {
				const style = getEdgeStyleByType("missing");
				return {
					id: `missing-${index}`,
					source: missing.source,
					target: missing.target,
					type: "floating",
					style,
					animated: true,
					markerEnd: {
						type: "arrowclosed" as MarkerType,
						color: style.stroke,
					},
				};
			},
		);

		return [...coloredEdges, ...missingEdges];
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
						<Link to="/dashboard/assignments">Back to Assignments</Link>
					</Button>
				</div>
			</div>
		);
	}

	const { learnerMap, diagnosis } = data;

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
						<Link to="/dashboard/assignments">
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

					{/* Legend */}
					<div className="bg-card border rounded-lg p-4 space-y-3">
						<h3 className="font-medium">Legend</h3>
						<div className="space-y-2 text-sm">
							<div className="flex items-center gap-2">
								<div className="w-8 h-1 bg-green-500 rounded" />
								<span>Correct connections</span>
							</div>
							<div className="flex items-center gap-2">
								<div className="w-8 h-1 bg-red-500 rounded" />
								<span>Excessive (wrong) connections</span>
							</div>
							<div className="flex items-center gap-2">
								<div
									className="w-8 h-1 rounded"
									style={{
										backgroundImage:
											"repeating-linear-gradient(90deg, #f59e0b 0, #f59e0b 4px, transparent 4px, transparent 8px)",
									}}
								/>
								<span>Missing connections</span>
							</div>
						</div>
					</div>

					{diagnosis.summary && (
						<div className="bg-card border rounded-lg p-4">
							<h3 className="font-medium mb-2">Summary</h3>
							<p className="text-sm text-muted-foreground">
								{diagnosis.summary}
							</p>
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
				</div>

				{/* Map visualization */}
				<div className="flex-1 relative">
					<ReactFlow
						nodes={learnerMap.nodes as Node[]}
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
