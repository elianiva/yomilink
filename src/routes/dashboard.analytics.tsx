import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Activity, Download, RefreshCw, Search } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { Guard } from "@/components/auth/Guard";
import { ToolbarButton } from "@/components/toolbar/toolbar-button";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ErrorCard } from "@/components/ui/error-card";
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
import { createTooltipHandle, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { AssignmentSelectContent } from "@/features/analyzer/components/assignment-select-content";
import { CanvasContent } from "@/features/analyzer/components/canvas-content";
import { LearnerList } from "@/features/analyzer/components/learner-list";
import type {
	AssignmentAnalytics,
	LearnerAnalytics,
} from "@/features/analyzer/lib/analytics-service";
import { isErrorResponse } from "@/hooks/use-rpc-error";
import { useRpcMutation } from "@/hooks/use-rpc-query";
import { useRpcQuery } from "@/hooks/use-rpc-query";
import { toast } from "@/lib/error-toast";
import { AnalyticsRpc } from "@/server/rpc/analytics";

export const Route = createFileRoute("/dashboard/analytics")({
	component: () => (
		<Guard roles={["teacher", "admin"]}>
			<AnalyticsPage />
		</Guard>
	),
});

function LegendDot({ color }: { color: string }) {
	return <span className="inline-block size-3 rounded-full" style={{ backgroundColor: color }} />;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
	return (
		<div className="text-xs font-medium text-muted-foreground uppercase tracking-wide pl-0.5">
			{children}
		</div>
	);
}

function AnalyticsPage() {
	const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);
	const [selectedLearnerMapIds, setSelectedLearnerMapIds] = useState<Set<string>>(new Set());
	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<"All" | "submitted" | "draft">("All");

	const tooltipHandle = createTooltipHandle();

	const navigate = useNavigate();

	const [showGoalMap, setShowGoalMap] = useState(true);
	const [showLearnerMap, setShowLearnerMap] = useState(true);
	const [showCorrectEdges, setShowCorrectEdges] = useState(true);
	const [showMissingEdges, setShowMissingEdges] = useState(true);
	const [showExcessiveEdges, setShowExcessiveEdges] = useState(true);
	const [showNeutralEdges, setShowNeutralEdges] = useState(true);

	const visibility = useMemo(
		() => ({
			showGoalMap,
			showLearnerMap,
			showCorrectEdges,
			showMissingEdges,
			showExcessiveEdges,
			showNeutralEdges,
		}),
		[
			showGoalMap,
			showLearnerMap,
			showCorrectEdges,
			showMissingEdges,
			showExcessiveEdges,
			showNeutralEdges,
		],
	);

	// Fetch assignments
	const { data: assignments, isLoading: assignmentsLoading } = useRpcQuery(
		AnalyticsRpc.getTeacherAssignments(),
	);

	// Fetch analytics data for selected assignment
	const {
		data: analyticsData,
		isLoading: analyticsLoading,
		refetch: refetchAnalytics,
		isRefetching: isRefetchingAnalytics,
		rpcError: analyticsError,
	} = useRpcQuery({
		...AnalyticsRpc.getAnalyticsForAssignment(selectedAssignmentId ?? ""),
		enabled: !!selectedAssignmentId,
		refetchOnWindowFocus: false,
	});

	// Fetch learner map details for selected learners
	const {
		data: multipleLearnerMapDetails,
		isLoading: multipleLearnerMapsLoading,
		isRefetching: isRefetchingMultipleLearnerMaps,
		rpcError: multipleLearnerMapsError,
		refetch: refetchMultipleLearnerMaps,
	} = useRpcQuery({
		...AnalyticsRpc.getMultipleLearnerMaps(Array.from(selectedLearnerMapIds)),
		enabled: selectedLearnerMapIds.size > 0,
		refetchOnWindowFocus: false,
	});

	// Filter learners
	const filteredLearners = useMemo(() => {
		if (!analyticsData) return [];

		return analyticsData.learners.filter((learner: LearnerAnalytics) => {
			const matchesSearch =
				!searchQuery || learner.userName.toLowerCase().includes(searchQuery.toLowerCase());

			const matchesStatus = statusFilter === "All" || learner.status === statusFilter;

			return matchesSearch && matchesStatus;
		});
	}, [analyticsData, searchQuery, statusFilter]);

	// Get selected learners
	const selectedLearners = useMemo(() => {
		if (!analyticsData) {
			return [];
		}
		return analyticsData.learners.filter((l: LearnerAnalytics) =>
			selectedLearnerMapIds.has(l.learnerMapId),
		);
	}, [analyticsData, selectedLearnerMapIds]);

	const handleRefresh = useCallback(() => {
		if (selectedAssignmentId) {
			window.location.reload();
		}
	}, [selectedAssignmentId]);

	const handleToggleLearner = useCallback((learnerMapId: string) => {
		setSelectedLearnerMapIds((prev) => {
			const next = new Set(prev);
			if (next.has(learnerMapId)) {
				next.delete(learnerMapId);
			} else {
				next.add(learnerMapId);
			}
			return next;
		});
	}, []);

	const handleToggleAll = useCallback(
		(checked: boolean) => {
			if (!analyticsData) return;
			setSelectedLearnerMapIds(
				checked ? new Set(filteredLearners.map((l) => l.learnerMapId)) : new Set(),
			);
		},
		[analyticsData, filteredLearners],
	);

	const selectAllState = useMemo(() => {
		if (filteredLearners.length === 0) return { checked: false, indeterminate: false };
		if (selectedLearnerMapIds.size === 0) return { checked: false, indeterminate: false };
		if (selectedLearnerMapIds.size === filteredLearners.length)
			return { checked: true, indeterminate: false };
		return { checked: false, indeterminate: true };
	}, [filteredLearners.length, selectedLearnerMapIds.size]);

	const exportMutation = useRpcMutation(
		{
			...AnalyticsRpc.exportAnalyticsData(),
			onSuccess: (result) => {
				if (isErrorResponse(result)) {
					return;
				}
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
		},
		{
			operation: "export analytics",
			showSuccess: false,
		},
	);

	const handleExport = useCallback(
		(format: "csv" | "json") => {
			if (!selectedAssignmentId || !analyticsData) return;
			exportMutation.mutate({ analytics: analyticsData, format });
		},
		[selectedAssignmentId, exportMutation, analyticsData],
	);

	return (
		<TooltipProvider delay={300}>
			<div className="h-full grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
				{/* Left sidebar */}
				<aside className="rounded-lg border bg-card">
					<div className="border-b p-3 flex items-center justify-between">
						<h2 className="text-sm font-semibold">Analytics</h2>
						<div className="text-[10px] text-muted-foreground">Teacher View</div>
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
										assignments={assignments ?? undefined}
										isLoading={assignmentsLoading}
									/>
								</SelectContent>
							</Select>
						</div>

						<Separator />

						{/* Summary */}
						{analyticsData && (
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
									<div className="flex items-center gap-2">
										<Checkbox
											checked={selectAllState.checked}
											indeterminate={selectAllState.indeterminate}
											onCheckedChange={handleToggleAll}
										/>
										<div className="text-xs">
											{selectedLearnerMapIds.size} of{" "}
											{filteredLearners.length} selected
										</div>
									</div>
									<div>Score</div>
								</div>
								<LearnerList
									learners={filteredLearners}
									isLoading={analyticsLoading}
									selectedLearnerMapIds={selectedLearnerMapIds}
									onToggleLearner={handleToggleLearner}
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
									disabled={!selectedAssignmentId || exportMutation.isPending}
								>
									<Download className="size-4" />
									Export CSV
								</Button>
								<Button
									variant="outline"
									size="sm"
									className="h-8 gap-1"
									onClick={() => handleExport("json")}
									disabled={!selectedAssignmentId || exportMutation.isPending}
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
											toast.warning("Please select an assignment first");
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
							<SectionTitle>Connector Visibility</SectionTitle>
						</div>
						<div className="flex items-center gap-4">
							<div className="flex items-center gap-2 text-xs">
								<Switch checked={showGoalMap} onCheckedChange={setShowGoalMap} />
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
					{selectedLearners.length > 0 && (
						<div className="border-b px-3 py-2 flex items-center justify-between bg-muted/30">
							<div className="text-sm font-medium">
								{selectedLearners.length === 1
									? selectedLearners[0]?.userName
									: `${selectedLearners.length} learners selected`}
							</div>
							<div className="flex items-center gap-4 text-xs">
								<div className="flex items-center gap-1.5">
									<LegendDot color="#22c55e" />
									<span>
										{selectedLearners.reduce((sum, l) => sum + l.correct, 0)}{" "}
										correct
									</span>
								</div>
								<div className="flex items-center gap-1.5">
									<LegendDot color="#ef4444" />
									<span>
										{selectedLearners.reduce((sum, l) => sum + l.missing, 0)}{" "}
										missing
									</span>
								</div>
								<div className="flex items-center gap-1.5">
									<LegendDot color="#3b82f6" />
									<span>
										{selectedLearners.reduce((sum, l) => sum + l.excessive, 0)}{" "}
										excessive
									</span>
								</div>
							</div>
						</div>
					)}

					{/* Canvas */}
					<div className="flex-1 m-3 rounded-md border">
						{analyticsError ? (
							<ErrorCard
								title="Failed to load analytics"
								description={analyticsError}
								onRetry={() => refetchAnalytics()}
								isRetrying={isRefetchingAnalytics}
							/>
						) : multipleLearnerMapsError ? (
							<ErrorCard
								title="Failed to load learner maps"
								description={multipleLearnerMapsError}
								onRetry={() => refetchMultipleLearnerMaps()}
								isRetrying={isRefetchingMultipleLearnerMaps}
							/>
						) : (
							<CanvasContent
								selectedAssignmentId={selectedAssignmentId}
								selectedLearnerMapIds={selectedLearnerMapIds}
								analyticsData={analyticsData as AssignmentAnalytics | null}
								multipleLearnerMapDetails={multipleLearnerMapDetails ?? null}
								isLoadingLearnerMaps={multipleLearnerMapsLoading}
								visibility={visibility}
							/>
						)}
					</div>
				</section>
			</div>
			<TooltipContent handle={tooltipHandle} />
		</TooltipProvider>
	);
}
