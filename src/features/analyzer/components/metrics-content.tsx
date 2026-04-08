import { useRouter } from "@tanstack/react-router";
import { ArrowLeft, BarChart3, TrendingUp } from "lucide-react";
import { useMemo } from "react";
import {
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	Legend,
	Pie,
	PieChart,
	ResponsiveContainer,
	XAxis,
	YAxis,
} from "recharts";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";
import type { LearnerAnalytics } from "@/features/analyzer/lib/analytics-service.core";
import { useRpcQuery } from "@/hooks/use-rpc-query";
import { cn } from "@/lib/utils";
import { AnalyticsRpc } from "@/server/rpc/analytics";

const chartConfig = {
	submitted: {
		label: "Submitted",
		color: "hsl(var(--chart-1))",
	},
	draft: {
		label: "Draft",
		color: "hsl(var(--chart-2))",
	},
	correct: {
		label: "Correct",
		color: "#22c55e",
	},
	missing: {
		label: "Missing",
		color: "#ef4444",
	},
	excessive: {
		label: "Excessive",
		color: "#3b82f6",
	},
} satisfies ChartConfig;

interface MetricsContentProps {
	assignmentId: string;
}

export function MetricsContent({ assignmentId }: MetricsContentProps) {
	const router = useRouter();

	const { data: analyticsData, isLoading } = useRpcQuery({
		...AnalyticsRpc.getAnalyticsForAssignment(assignmentId),
		enabled: !!assignmentId,
		refetchOnWindowFocus: false,
	});

	const metrics = useMemo(() => {
		if (!analyticsData || !("learners" in analyticsData)) {
			return null;
		}

		const { learners } = analyticsData;
		const isSummaryLearner = (learner: LearnerAnalytics) =>
			learner.condition === "summarizing" || learner.score === null;
		const summaryLearners = learners.filter(isSummaryLearner);
		const conceptMapLearners = learners.filter((l) => !isSummaryLearner(l));

		const scoreDistribution = conceptMapLearners
			.filter((l) => l.score !== null)
			.reduce<Record<string, number>>((acc, learner) => {
				const score = learner.score ?? 0;
				if (score < 50) acc["0-49%"] = (acc["0-49%"] || 0) + 1;
				else if (score < 60) acc["50-59%"] = (acc["50-59%"] || 0) + 1;
				else if (score < 70) acc["60-69%"] = (acc["60-69%"] || 0) + 1;
				else if (score < 80) acc["70-79%"] = (acc["70-79%"] || 0) + 1;
				else if (score < 90) acc["80-89%"] = (acc["80-89%"] || 0) + 1;
				else acc["90-100%"] = (acc["90-100%"] || 0) + 1;
				return acc;
			}, {});

		const statusBreakdown = [
			{
				status: "submitted",
				count: conceptMapLearners.filter((l) => l.status === "submitted").length,
				fill: "var(--color-chart-1)",
			},
			{
				status: "draft",
				count: conceptMapLearners.filter((l) => l.status === "draft").length,
				fill: "var(--color-chart-2)",
			},
		];

		const avgEdgeTypes =
			conceptMapLearners.length > 0
				? conceptMapLearners.reduce(
						(acc, learner) => ({
							correct: acc.correct + learner.correct / conceptMapLearners.length,
							missing: acc.missing + learner.missing / conceptMapLearners.length,
							excessive:
								acc.excessive + learner.excessive / conceptMapLearners.length,
						}),
						{ correct: 0, missing: 0, excessive: 0 },
					)
				: { correct: 0, missing: 0, excessive: 0 };

		const edgeTypeData = [
			{
				name: "Correct",
				value: Number.parseFloat(avgEdgeTypes.correct.toFixed(2)),
				fill: "var(--color-edge-correct)",
			},
			{
				name: "Missing",
				value: Number.parseFloat(avgEdgeTypes.missing.toFixed(2)),
				fill: "var(--color-edge-missing)",
			},
			{
				name: "Excessive",
				value: Number.parseFloat(avgEdgeTypes.excessive.toFixed(2)),
				fill: "var(--color-edge-excessive)",
			},
		];

		const attemptDistribution = conceptMapLearners.reduce<Record<string, number>>(
			(acc, learner) => {
				acc[`Attempt ${learner.attempt}`] = (acc[`Attempt ${learner.attempt}`] || 0) + 1;
				return acc;
			},
			{},
		);

		const topLearners = [...conceptMapLearners]
			.sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
			.slice(0, 5);
		const bottomLearners = [...conceptMapLearners]
			.filter((l) => l.score !== null)
			.sort((a, b) => (a.score ?? 0) - (b.score ?? 0))
			.slice(0, 5);

		const conceptMapScores = conceptMapLearners
			.map((l) => l.score)
			.filter((s): s is number => s !== null);
		const summaryScores = summaryLearners
			.map((l) => l.score)
			.filter((s): s is number => s !== null);

		return {
			data: analyticsData,
			conceptMapLearners,
			summaryLearners,
			scoreDistribution,
			statusBreakdown,
			edgeTypeData,
			attemptDistribution,
			topLearners,
			bottomLearners,
			conceptMapStats: {
				total: conceptMapLearners.length,
				submitted: conceptMapLearners.filter((l) => l.status === "submitted").length,
				draft: conceptMapLearners.filter((l) => l.status === "draft").length,
				avgScore:
					conceptMapScores.length > 0
						? conceptMapScores.reduce((a, b) => a + b, 0) / conceptMapScores.length
						: null,
				highestScore: conceptMapScores.length > 0 ? Math.max(...conceptMapScores) : null,
			},
			summaryStats: {
				total: summaryLearners.length,
				submitted: summaryLearners.filter((l) => l.status === "submitted").length,
				draft: summaryLearners.filter((l) => l.status === "draft").length,
				avgScore:
					summaryScores.length > 0
						? summaryScores.reduce((a, b) => a + b, 0) / summaryScores.length
						: null,
			},
		};
	}, [analyticsData]);

	const handleBack = () => {
		void router.navigate({ to: "/dashboard/analytics" });
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-full">
				<div className="text-sm text-muted-foreground">Loading metrics...</div>
			</div>
		);
	}

	if (!metrics) {
		return (
			<div className="flex items-center justify-center h-full">
				<div className="text-sm text-muted-foreground">No metrics data available</div>
			</div>
		);
	}

	return (
		<div className="space-y-6 p-6">
			<div className="flex items-center gap-4">
				<Button variant="outline" size="sm" onClick={handleBack}>
					<ArrowLeft className="mr-2 size-4" />
					Back to Analytics
				</Button>
				<div>
					<h1 className="text-2xl font-bold">Assignment Metrics</h1>
					<p className="text-sm text-muted-foreground">{metrics.data.assignment.title}</p>
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
				<StatCard title="Concept Map Learners" value={metrics.conceptMapStats.total} />
				<StatCard
					title="Concept Map Submitted"
					value={metrics.conceptMapStats.submitted}
					total={metrics.conceptMapStats.total}
				/>
				<StatCard
					title="Concept Map Avg Score"
					value={
						metrics.conceptMapStats.avgScore
							? `${metrics.conceptMapStats.avgScore.toFixed(1)}%`
							: "N/A"
					}
				/>
				<StatCard
					title="Concept Map Highest Score"
					value={
						metrics.conceptMapStats.highestScore !== null
							? `${metrics.conceptMapStats.highestScore}%`
							: "N/A"
					}
				/>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
				<StatCard title="Summary Learners" value={metrics.summaryStats.total} />
				<StatCard
					title="Summary Submitted"
					value={metrics.summaryStats.submitted}
					total={metrics.summaryStats.total}
				/>
				<StatCard title="Summary Drafts" value={metrics.summaryStats.draft} />
				<StatCard
					title="Summary Avg Score"
					value={
						metrics.summaryStats.avgScore
							? `${metrics.summaryStats.avgScore.toFixed(1)}%`
							: "N/A"
					}
				/>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<Card>
					<CardHeader>
						<CardTitle>Score Distribution</CardTitle>
						<CardDescription>Number of learners per score range</CardDescription>
					</CardHeader>
					<CardContent>
						<ChartContainer config={chartConfig} className="h-75">
							<ResponsiveContainer width="100%" height="100%">
								<BarChart
									data={Object.entries(metrics.scoreDistribution).map(
										([range, count]) => ({ range, count }),
									)}
								>
									<CartesianGrid vertical={false} />
									<XAxis dataKey="range" tickLine={false} tickMargin={10} />
									<YAxis tickLine={false} tickMargin={10} />
									<ChartTooltip content={<ChartTooltipContent />} />
									<Bar dataKey="count" radius={4} />
								</BarChart>
							</ResponsiveContainer>
						</ChartContainer>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Submission Status</CardTitle>
						<CardDescription>Submitted vs Draft</CardDescription>
					</CardHeader>
					<CardContent>
						<ChartContainer config={chartConfig} className="h-75">
							<ResponsiveContainer width="100%" height="100%">
								<PieChart>
									<ChartTooltip content={<ChartTooltipContent />} />
									<Pie
										data={metrics.statusBreakdown}
										dataKey="count"
										nameKey="status"
										innerRadius={60}
										outerRadius={80}
										paddingAngle={5}
									>
										{metrics.statusBreakdown.map((entry) => (
											<Cell key={`cell-${entry.status}`} fill={entry.fill} />
										))}
									</Pie>
									<Legend />
								</PieChart>
							</ResponsiveContainer>
						</ChartContainer>
					</CardContent>
				</Card>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<Card>
					<CardHeader>
						<CardTitle>Average Edge Types</CardTitle>
						<CardDescription>
							Average number of each edge type per learner
						</CardDescription>
					</CardHeader>
					<CardContent>
						<ChartContainer config={chartConfig} className="h-75">
							<ResponsiveContainer width="100%" height="100%">
								<BarChart data={metrics.edgeTypeData} layout="vertical">
									<CartesianGrid horizontal={false} />
									<XAxis type="number" tickLine={false} tickMargin={10} />
									<YAxis
										dataKey="name"
										type="category"
										tickLine={false}
										tickMargin={10}
										width={80}
									/>
									<ChartTooltip content={<ChartTooltipContent />} />
									<Bar dataKey="value" radius={4} />
								</BarChart>
							</ResponsiveContainer>
						</ChartContainer>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Attempt Distribution</CardTitle>
						<CardDescription>Number of learners by attempt count</CardDescription>
					</CardHeader>
					<CardContent>
						<ChartContainer config={chartConfig} className="h-75">
							<ResponsiveContainer width="100%" height="100%">
								<BarChart
									data={Object.entries(metrics.attemptDistribution).map(
										([attempt, count]) => ({
											attempt,
											count,
										}),
									)}
								>
									<CartesianGrid vertical={false} />
									<XAxis dataKey="attempt" tickLine={false} tickMargin={10} />
									<YAxis tickLine={false} tickMargin={10} />
									<ChartTooltip content={<ChartTooltipContent />} />
									<Bar dataKey="count" radius={4} />
								</BarChart>
							</ResponsiveContainer>
						</ChartContainer>
					</CardContent>
				</Card>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<TrendingUp className="size-4" />
							Top 5 Concept Map Performers
						</CardTitle>
						<CardDescription>Learners with highest concept map scores</CardDescription>
					</CardHeader>
					<CardContent>
						<PerformanceList learners={metrics.topLearners} />
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<BarChart3 className="size-4" />
							Bottom 5 Concept Map Performers
						</CardTitle>
						<CardDescription>Learners needing improvement</CardDescription>
					</CardHeader>
					<CardContent>
						<PerformanceList learners={metrics.bottomLearners} />
					</CardContent>
				</Card>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Summarizing Learners</CardTitle>
					<CardDescription>
						Dedicated summary condition view (not grouped with concept map)
					</CardDescription>
				</CardHeader>
				<CardContent>
					<PerformanceList learners={metrics.summaryLearners} />
				</CardContent>
			</Card>
		</div>
	);
}

interface StatCardProps {
	title: string;
	value: string | number;
	total?: number;
}

function StatCard({ title, value, total }: StatCardProps) {
	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle className="text-sm font-medium">{title}</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="text-2xl font-bold">{value}</div>
				{total !== undefined && (
					<p className="text-xs text-muted-foreground">
						{typeof value === "number" && total > 0
							? `${Number.parseFloat(((value / total) * 100).toFixed(1))}% of total`
							: ""}
					</p>
				)}
			</CardContent>
		</Card>
	);
}

interface PerformanceListProps {
	learners: LearnerAnalytics[];
}

function PerformanceList({ learners }: PerformanceListProps) {
	return (
		<div className="space-y-2">
			{learners.map((learner, index) => (
				<div
					key={learner.learnerMapId}
					className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
				>
					<div className="flex items-center gap-3">
						<span className="text-sm font-semibold text-muted-foreground">
							#{index + 1}
						</span>
						<span className="text-sm font-medium">{learner.userName}</span>
					</div>
					<div className="flex items-center gap-4 text-sm">
						<span
							className={cn(
								"font-semibold tabular-nums",
								getScoreColor(learner.score),
							)}
						>
							{learner.score !== null ? `${learner.score}%` : "N/A"}
						</span>
					</div>
				</div>
			))}
			{learners.length === 0 && (
				<div className="text-center text-sm text-muted-foreground py-4">
					No data available
				</div>
			)}
		</div>
	);
}

function getScoreColor(score: number | null) {
	if (score === null) return "text-muted-foreground";
	if (score >= 90) return "text-green-600";
	if (score >= 70) return "text-blue-600";
	if (score >= 50) return "text-yellow-600";
	return "text-red-600";
}
