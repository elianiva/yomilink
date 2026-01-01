import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Activity, Download, RefreshCw, Search } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { Guard } from "@/components/auth/Guard";
import { ToolbarButton } from "@/components/toolbar/toolbar-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
	createTooltipHandle,
	TooltipContent,
	TooltipProvider,
} from "@/components/ui/tooltip";
import { AssignmentSelectContent } from "@/features/analyzer/components/assignment-select-content";
import { CanvasContent } from "@/features/analyzer/components/canvas-content";
import { LearnerList } from "@/features/analyzer/components/learner-list";
import {
	AnalyticsRpc,
	exportAnalyticsDataRpc as exportAnalyticsDataFn,
} from "@/server/rpc/analytics";
import type {
	AssignmentAnalytics,
	LearnerAnalytics,
	ExportResult,
} from "@/features/analyzer/lib/analytics-service";

export const Route = createFileRoute("/dashboard/analytics")({
	component: () => (
		<Guard roles={["teacher", "admin"]}>
			<AnalyticsPage />
		</Guard>
	),
});

function LegendDot({ color }: { color: string }) {
	return (
		<span
			className="inline-block size-3 rounded-full"
			style={{ backgroundColor: color }}
		/>
	);
}

function SectionTitle({ children }: { children: React.ReactNode }) {
	return (
		<div className="text-xs font-medium text-muted-foreground uppercase tracking-wide pl-0.5">
			{children}
		</div>
	);
}

function AnalyticsPage() {
	const [selectedAssignmentId, setSelectedAssignmentId] = useState<
		string | null
	>(null);
	const [selectedLearnerMapId, setSelectedLearnerMapId] = useState<
		string | null
	>(null);
	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<
		"All" | "submitted" | "draft"
	>("All");

	const tooltipHandle = createTooltipHandle();

	const navigate = useNavigate();

	const [showGoalMap, setShowGoalMap] = useState(true);
	const [showLearnerMap, setShowLearnerMap] = useState(true);
	const [showCorrectEdges, setShowCorrectEdges] = useState(true);
	const [showMissingEdges, setShowMissingEdges] = useState(true);
	const [showExcessiveEdges, setShowExcessiveEdges] = useState(true);
	const [showNeutralEdges, setShowNeutralEdges] = useState(true);

	// Fetch assignments
	const { data: assignments, isLoading: assignmentsLoading } = useQuery(
		AnalyticsRpc.getTeacherAssignments(),
	);

	// Fetch analytics data for selected assignment
	const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
		...AnalyticsRpc.getAnalyticsForAssignment(selectedAssignmentId ?? ""),
		enabled: !!selectedAssignmentId,
		refetchOnWindowFocus: false,
	});

	// Fetch learner map details for selected learner
	const { data: learnerMapDetails } = useQuery({
		...AnalyticsRpc.getLearnerMapForAnalytics(selectedLearnerMapId ?? ""),
		enabled: !!selectedLearnerMapId,
		refetchOnWindowFocus: false,
	});

	// Filter learners
	const filteredLearners = useMemo(() => {
		if (
			!analyticsData ||
			("success" in analyticsData && !analyticsData.success)
		)
			return [];

		const data = analyticsData as AssignmentAnalytics;
		return data.learners.filter((learner: LearnerAnalytics) => {
			const matchesSearch =
				!searchQuery ||
				learner.userName.toLowerCase().includes(searchQuery.toLowerCase());

			const matchesStatus =
				statusFilter === "All" || learner.status === statusFilter;

			return matchesSearch && matchesStatus;
		});
	}, [analyticsData, searchQuery, statusFilter]);

	// Get selected learner
	const selectedLearner = useMemo(() => {
		if (
			!analyticsData ||
			!("learners" in analyticsData) ||
			!selectedLearnerMapId
		) {
			return null;
		}
		return analyticsData.learners.find(
			(l: LearnerAnalytics) => l.learnerMapId === selectedLearnerMapId,
		);
	}, [analyticsData, selectedLearnerMapId]);

	const handleRefresh = useCallback(() => {
		if (selectedAssignmentId) {
			window.location.reload();
		}
	}, [selectedAssignmentId]);

	const exportMutation = useMutation({
		mutationFn: (format: "csv" | "json") =>
			exportAnalyticsDataFn({
				data: { assignmentId: selectedAssignmentId ?? "", format },
			}),
		onSuccess: (result: ExportResult) => {
			const blob = new Blob([result.data], {
				type: result.contentType,
			});
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = result.filename;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
			toast.success(`Exported ${result.filename}`);
		},
		onError: () => {
			toast.error("Failed to export data");
		},
	});

	const handleExport = useCallback(
		(format: "csv" | "json") => {
			if (!selectedAssignmentId) return;
			exportMutation.mutateAsync(format);
		},
		[selectedAssignmentId, exportMutation],
	);

	return (
		<TooltipProvider delay={300}>
			<div className="h-full grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
				{/* Left sidebar */}
				<aside className="rounded-lg border bg-card">
					<div className="border-b p-3 flex items-center justify-between">
						<h2 className="text-sm font-semibold">Analytics</h2>
						<div className="text-[10px] text-muted-foreground">
							Teacher View
						</div>
					</div>

					<div className="p-3 space-y-4">
						{/* Assignment selector */}
						<div className="space-y-2">
							<SectionTitle>Assignment</SectionTitle>
							<Select
								value={selectedAssignmentId ?? ""}
								onValueChange={setSelectedAssignmentId}
							>
								<SelectTrigger size="sm" className="h-8 w-full">
									<SelectValue placeholder="Select assignment" />
								</SelectTrigger>
								<SelectContent>
									<AssignmentSelectContent
										assignments={assignments}
										isLoading={assignmentsLoading}
									/>
								</SelectContent>
							</Select>
						</div>

						<Separator />

						{/* Summary */}
						{analyticsData && "summary" in analyticsData && (
							<div className="space-y-2">
								<SectionTitle>Summary</SectionTitle>
								<div className="grid grid-cols-2 gap-2 text-xs">
									<div>
										<div className="text-muted-foreground">Learners</div>
										<div className="font-semibold">
											{analyticsData.summary.totalLearners}
										</div>
									</div>
									<div>
										<div className="text-muted-foreground">Submitted</div>
										<div className="font-semibold">
											{analyticsData.summary.submittedCount}
										</div>
									</div>
									<div>
										<div className="text-muted-foreground">Avg Score</div>
										<div className="font-semibold">
											{analyticsData.summary.avgScore
												? `${analyticsData.summary.avgScore.toFixed(1)}%`
												: "N/A"}
										</div>
									</div>
									<div>
										<div className="text-muted-foreground">Drafts</div>
										<div className="font-semibold">
											{analyticsData.summary.draftCount}
										</div>
									</div>
								</div>
							</div>
						)}

						<Separator />

						{/* Learner filter */}
						<div className="space-y-2">
							<SectionTitle>Filter Learners</SectionTitle>

							<Select
								value={statusFilter}
								onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}
							>
								<SelectTrigger size="sm" className="h-8 w-full">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="All">Status: All</SelectItem>
									<SelectItem value="submitted">Submitted</SelectItem>
									<SelectItem value="draft">Draft</SelectItem>
								</SelectContent>
							</Select>

							<div className="relative">
								<Search className="absolute left-2 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
								<Input
									className="pl-8 h-8"
									placeholder="Search learner…"
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
								/>
							</div>

							<div className="max-h-64 overflow-auto rounded-md border">
								<div className="flex items-center justify-between text-xs text-muted-foreground px-3 py-2 border-b">
									<div>Name</div>
									<div>Score</div>
								</div>
								<LearnerList
									learners={filteredLearners}
									isLoading={analyticsLoading}
									selectedLearnerMapId={selectedLearnerMapId}
									onSelectLearner={setSelectedLearnerMapId}
								/>
							</div>
						</div>
					</div>
				</aside>

				{/* Main content area */}
				<section className="rounded-lg border overflow-hidden flex flex-col">
					{/* Top toolbar */}
					<div className="border-b bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/50">
						<div className="h-12 px-3 flex items-center gap-2">
							<div className="font-semibold">Analytics</div>
							<div className="ml-auto flex items-center gap-1.5">
								<ToolbarButton
									icon={RefreshCw}
									label="Refresh"
									onClick={handleRefresh}
									handle={tooltipHandle}
								/>

								<Separator className="h-6" orientation="vertical" />

								<Button
									variant="outline"
									size="sm"
									className="h-8 gap-1"
									onClick={() => handleExport("csv")}
									disabled={!selectedAssignmentId}
								>
									<Download className="size-4" />
									Export CSV
								</Button>
								<Button
									variant="outline"
									size="sm"
									className="h-8 gap-1"
									onClick={() => handleExport("json")}
									disabled={!selectedAssignmentId}
								>
									<Download className="size-4" />
									Export JSON
								</Button>

								<Separator className="h-6" orientation="vertical" />

								<ToolbarButton
									icon={Activity}
									label="Metrics"
									onClick={() => {
										if (!selectedAssignmentId) {
											toast.error("Please select an assignment first");
											return;
										}
										navigate({
											to: "/dashboard/analytics/$assignmentId/metrics",
											params: { assignmentId: selectedAssignmentId },
										});
									}}
									disabled={!selectedAssignmentId}
									handle={tooltipHandle}
								/>
							</div>
						</div>
					</div>

					{/* Visualization controls */}
					<div className="border-b p-3 space-y-3">
						<div className="flex items-center justify-between">
							<SectionTitle>Map Visibility</SectionTitle>
						</div>
						<div className="flex items-center gap-4">
							<div className="flex items-center gap-2 text-xs">
								<Switch
									checked={showGoalMap}
									onCheckedChange={setShowGoalMap}
								/>
								<span>Goal Map</span>
							</div>
							<div className="flex items-center gap-2 text-xs">
								<Switch
									checked={showLearnerMap}
									onCheckedChange={setShowLearnerMap}
								/>
								<span>Learner Map</span>
							</div>
						</div>

						<div className="flex items-center justify-between">
							<SectionTitle>Edge Types</SectionTitle>
						</div>
						<div className="flex items-center gap-4 flex-wrap">
							<div className="flex items-center gap-2 text-xs">
								<Switch
									checked={showCorrectEdges}
									onCheckedChange={setShowCorrectEdges}
								/>
								<LegendDot color="#22c55e" />
								<span>Correct</span>
							</div>
							<div className="flex items-center gap-2 text-xs">
								<Switch
									checked={showMissingEdges}
									onCheckedChange={setShowMissingEdges}
								/>
								<LegendDot color="#ef4444" />
								<span>Missing</span>
							</div>
							<div className="flex items-center gap-2 text-xs">
								<Switch
									checked={showExcessiveEdges}
									onCheckedChange={setShowExcessiveEdges}
								/>
								<LegendDot color="#3b82f6" />
								<span>Excessive</span>
							</div>
							<div className="flex items-center gap-2 text-xs">
								<Switch
									checked={showNeutralEdges}
									onCheckedChange={setShowNeutralEdges}
								/>
								<LegendDot color="#64748b" />
								<span>Neutral</span>
							</div>
						</div>
					</div>

					{/* Selected learner stats */}
					{selectedLearner && (
						<div className="border-b px-3 py-2 flex items-center justify-between bg-muted/30">
							<div className="text-sm font-medium">
								{selectedLearner.userName}
							</div>
							<div className="flex items-center gap-4 text-xs">
								<div className="flex items-center gap-1.5">
									<LegendDot color="#22c55e" />
									<span>{selectedLearner.correct} correct</span>
								</div>
								<div className="flex items-center gap-1.5">
									<LegendDot color="#ef4444" />
									<span>{selectedLearner.missing} missing</span>
								</div>
								<div className="flex items-center gap-1.5">
									<LegendDot color="#3b82f6" />
									<span>{selectedLearner.excessive} excessive</span>
								</div>
								<div className="font-semibold tabular-nums">
									{selectedLearner.score !== null
										? `${selectedLearner.score}%`
										: "N/A"}
								</div>
							</div>
						</div>
					)}

					{/* Canvas */}
					<div className="flex-1 m-3 rounded-md border">
						<CanvasContent
							selectedAssignmentId={selectedAssignmentId}
							selectedLearnerMapId={selectedLearnerMapId}
							analyticsData={analyticsData as AssignmentAnalytics | null}
							learnerMapDetails={learnerMapDetails ?? null}
							visibility={{
								showGoalMap,
								showLearnerMap,
								showCorrectEdges,
								showMissingEdges,
								showExcessiveEdges,
								showNeutralEdges,
							}}
						/>
					</div>
				</section>
			</div>
			<TooltipContent handle={tooltipHandle} />
		</TooltipProvider>
	);
}
