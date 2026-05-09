import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, BarChart3, Loader2, TrendingUp } from "lucide-react";
import { useMemo } from "react";
import {
	Bar,
	BarChart,
	CartesianGrid,
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
import type { LearnerAnalytics } from "@/features/analyzer/lib/analytics-service.shared";
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
		color: "#7eb87a",
	},
	missing: {
		label: "Missing",
		color: "#d47876",
	},
	excessive: {
		label: "Excessive",
		color: "#7ba9c9",
	},
} satisfies ChartConfig;

interface MetricsContentProps {
	assignmentId: string;
}

export function MetricsContent({ assignmentId }: MetricsContentProps) {
	const navigate = useNavigate();

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
		const isSummaryLearner = (learner: LearnerAnalytics): boolean =>
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
				fill: "#7eb87a",
			},
			{
				name: "Missing",
				value: Number.parseFloat(avgEdgeTypes.missing.toFixed(2)),
				fill: "#d47876",
			},
			{
				name: "Excessive",
				value: Number.parseFloat(avgEdgeTypes.excessive.toFixed(2)),
				fill: "#7ba9c9",
			},
		];

		const attemptDistribution = conceptMapLearners.reduce<Record<string, number>>(
			(acc, learner) => {
				acc[`Attempt ${learner.attempt}`] = (acc[`Attempt ${learner.attempt}`] || 0) + 1;
				return acc;
			},
			{},
		);

		const topLearners = conceptMapLearners
			.slice()
			.sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
			.slice(0, 5);
		const bottomLearners = [...conceptMapLearners]
			.filter((l) => l.score !== null)
			.sort((a, b) => (a.score ?? 0) - (b.score ?? 0))
			.slice(0, 5);

		const conceptMapScores: number[] = [];
		for (const l of conceptMapLearners) {
			if (l.score !== null) conceptMapScores.push(l.score);
		}
		const summaryScores: number[] = [];
		for (const l of summaryLearners) {
			if (l.score !== null) summaryScores.push(l.score);
		}

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
		void navigate({ to: "/dashboard/analytics" });
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-12">
				<Loader2 className="size-6 animate-spin text-muted-foreground" />
			</div>
		);
	}

	if (!metrics) {
		return (
			<div className="flex flex-col items-center justify-center py-12">
				<p className="text-muted-foreground">No metrics data available</p>
			</div>
		);
	}

	return (
		<div className="space-y-5">
			<div className="flex items-center gap-3">
				<Button
					variant="outline"
					size="sm"
					onClick={handleBack}
					className="active:scale-[0.97] transition-transform"
				>
					<ArrowLeft className="mr-1.5 size-4" />
					Back
				</Button>
				<div>
					<h1 className="text-2xl font-medium tracking-tight">Assignment Metrics</h1>
					<p className="text-sm text-muted-foreground">{metrics.data.assignment.title}</p>
				</div>
			</div>

			<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
				<StatCard title="Concept Map Learners" value={metrics.conceptMapStats.total} />
				<StatCard
					title="Submitted"
					value={metrics.conceptMapStats.submitted}
					total={metrics.conceptMapStats.total}
				/>
				<StatCard
					title="Avg Score"
					value={
						metrics.conceptMapStats.avgScore
							? `${metrics.conceptMapStats.avgScore.toFixed(1)}%`
							: "N/A"
					}
				/>
				<StatCard
					title="Highest Score"
					value={
						metrics.conceptMapStats.highestScore !== null
							? `${metrics.conceptMapStats.highestScore}%`
							: "N/A"
					}
				/>
			</div>

			<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
				<StatCard title="Summary Learners" value={metrics.summaryStats.total} />
				<StatCard
					title="Submitted"
					value={metrics.summaryStats.submitted}
					total={metrics.summaryStats.total}
				/>
				<StatCard title="Drafts" value={metrics.summaryStats.draft} />
				<StatCard
					title="Avg Score"
					value={
						metrics.summaryStats.avgScore
							? `${metrics.summaryStats.avgScore.toFixed(1)}%`
							: "N/A"
					}
				/>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="tracking-tight">Score Distribution</CardTitle>
						<CardDescription>Learners per score range</CardDescription>
					</CardHeader>
					<CardContent>
						<ChartContainer config={chartConfig} className="h-[260px]">
							<ResponsiveContainer width="100%" height="100%">
								<BarChart
									data={Object.entries(metrics.scoreDistribution).map(
										([range, count]) => ({ range, count }),
									)}
								>
									<CartesianGrid vertical={false} strokeDasharray="3 3" />
									<XAxis dataKey="range" tickLine={false} tickMargin={8} />
									<YAxis tickLine={false} tickMargin={8} width={30} />
									<ChartTooltip content={<ChartTooltipContent />} />
									<Bar
										dataKey="count"
										radius={[4, 4, 0, 0]}
										fill="hsl(var(--chart-1))"
									/>
								</BarChart>
							</ResponsiveContainer>
						</ChartContainer>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="tracking-tight">Submission Status</CardTitle>
						<CardDescription>Submitted vs Draft</CardDescription>
					</CardHeader>
					<CardContent>
						<ChartContainer config={chartConfig} className="h-[260px]">
							<ResponsiveContainer width="100%" height="100%">
								<PieChart>
									<ChartTooltip content={<ChartTooltipContent />} />
									<Pie
										data={metrics.statusBreakdown}
										dataKey="count"
										nameKey="status"
										innerRadius={60}
										outerRadius={90}
										paddingAngle={4}
									/>
									<Legend />
								</PieChart>
							</ResponsiveContainer>
						</ChartContainer>
					</CardContent>
				</Card>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="tracking-tight">Average Edge Types</CardTitle>
						<CardDescription>Per learner</CardDescription>
					</CardHeader>
					<CardContent>
						<ChartContainer config={chartConfig} className="h-[260px]">
							<ResponsiveContainer width="100%" height="100%">
								<BarChart data={metrics.edgeTypeData} layout="vertical">
									<CartesianGrid horizontal={false} strokeDasharray="3 3" />
									<XAxis type="number" tickLine={false} tickMargin={8} />
									<YAxis
										dataKey="name"
										type="category"
										tickLine={false}
										tickMargin={8}
										width={70}
									/>
									<ChartTooltip content={<ChartTooltipContent />} />
									<Bar
										dataKey="value"
										radius={[0, 4, 4, 0]}
										fill="hsl(var(--chart-2))"
									/>
								</BarChart>
							</ResponsiveContainer>
						</ChartContainer>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="tracking-tight">Attempt Distribution</CardTitle>
						<CardDescription>By attempt count</CardDescription>
					</CardHeader>
					<CardContent>
						<ChartContainer config={chartConfig} className="h-[260px]">
							<ResponsiveContainer width="100%" height="100%">
								<BarChart
									data={Object.entries(metrics.attemptDistribution).map(
										([attempt, count]) => ({
											attempt,
											count,
										}),
									)}
								>
									<CartesianGrid vertical={false} strokeDasharray="3 3" />
									<XAxis dataKey="attempt" tickLine={false} tickMargin={8} />
									<YAxis tickLine={false} tickMargin={8} width={30} />
									<ChartTooltip content={<ChartTooltipContent />} />
									<Bar
										dataKey="count"
										radius={[4, 4, 0, 0]}
										fill="hsl(var(--chart-3))"
									/>
								</BarChart>
							</ResponsiveContainer>
						</ChartContainer>
					</CardContent>
				</Card>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="flex items-center gap-2 text-base tracking-tight">
							<TrendingUp className="size-4 text-muted-foreground" />
							Top 5 Performers
						</CardTitle>
						<CardDescription>Highest concept map scores</CardDescription>
					</CardHeader>
					<CardContent>
						<PerformanceList learners={metrics.topLearners} />
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="flex items-center gap-2 text-base tracking-tight">
							<BarChart3 className="size-4 text-muted-foreground" />
							Bottom 5 Performers
						</CardTitle>
						<CardDescription>Needing improvement</CardDescription>
					</CardHeader>
					<CardContent>
						<PerformanceList learners={metrics.bottomLearners} />
					</CardContent>
				</Card>
			</div>

			<Card>
				<CardHeader className="pb-3">
					<CardTitle className="text-base tracking-tight">Summarizing Learners</CardTitle>
					<CardDescription>Summary condition only</CardDescription>
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
		<Card className="transition-all duration-200">
			<CardHeader>
				<CardTitle>{title}</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="flex items-center justify-between gap-2">
					<p className="text-2xl font-medium tracking-tight mt-1.5">{value}</p>
					{total !== undefined && (
						<p className="text-[11px] text-muted-foreground mt-0.5">
							{typeof value === "number" && total > 0
								? `${((value / total) * 100).toFixed(1)}%`
								: "0%"}
						</p>
					)}
				</div>
			</CardContent>
		</Card>
	);
}

interface PerformanceListProps {
	learners: LearnerAnalytics[];
}

function PerformanceList({ learners }: PerformanceListProps) {
	if (learners.length === 0) {
		return (
			<div className="text-center text-sm text-muted-foreground py-6">No data available</div>
		);
	}

	return (
		<div className="space-y-1">
			{learners.map((learner, index) => (
				<div
					key={learner.learnerMapId}
					className="flex items-center justify-between px-3 py-2 rounded-md border bg-[#F9F9F8] hover:bg-white transition-all duration-200"
				>
					<div className="flex items-center gap-2.5">
						<span className="text-xs font-medium text-[#787774] tabular-nums w-4">
							{index + 1}
						</span>
						<span className="text-sm text-[#2F3437]">{learner.userName}</span>
					</div>
					<span
						className={cn(
							"text-xs font-medium tabular-nums px-2 py-0.5 rounded-full",
							getScorePill(learner.score),
						)}
					>
						{learner.score !== null ? `${learner.score}%` : "N/A"}
					</span>
				</div>
			))}
		</div>
	);
}

function getScorePill(score: number | null) {
	if (score === null) return "bg-[#F7F6F3] text-[#787774]";
	if (score >= 90) return "bg-[#EDF3EC] text-[#346538]";
	if (score >= 70) return "bg-[#E1F3FE] text-[#1F6C9F]";
	if (score >= 50) return "bg-[#FBF3DB] text-[#956400]";
	return "bg-[#FDEBEC] text-[#9F2F2D]";
}
