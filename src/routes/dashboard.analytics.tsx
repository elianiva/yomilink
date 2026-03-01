import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";

import { Guard } from "@/components/auth/Guard";
import { createTooltipHandle, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { AnalyticsCanvasWrapper } from "@/features/analyzer/components/analytics-canvas-wrapper";
import { AnalyticsControls } from "@/features/analyzer/components/analytics-controls";
import { AnalyticsSidebar } from "@/features/analyzer/components/analytics-sidebar";
import { AnalyticsToolbar } from "@/features/analyzer/components/analytics-toolbar";
import { SelectedLearnerStats } from "@/features/analyzer/components/selected-learner-stats";
import type { LearnerAnalytics } from "@/features/analyzer/lib/analytics-service";
import { useRpcQuery } from "@/hooks/use-rpc-query";
import { AnalyticsRpc } from "@/server/rpc/analytics";

export const Route = createFileRoute("/dashboard/analytics")({
	component: () => (
		<Guard roles={["teacher", "admin"]}>
			<AnalyticsPage />
		</Guard>
	),
});

function AnalyticsPage() {
	const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);
	const [selectedLearnerMapIds, setSelectedLearnerMapIds] = useState<Set<string>>(new Set());

	const tooltipHandle = createTooltipHandle();

	const [visibility, setVisibility] = useState({
		showGoalMap: true,
		showLearnerMap: true,
		showCorrectEdges: true,
		showMissingEdges: true,
		showExcessiveEdges: true,
		showNeutralEdges: true,
	});

	const handleVisibilityChange = useCallback((updates: Partial<typeof visibility>) => {
		setVisibility((prev) => ({ ...prev, ...updates }));
	}, []);

	// Get analytics data for toolbar export and selected learner stats
	const { data: analyticsData } = useRpcQuery({
		...AnalyticsRpc.getAnalyticsForAssignment(selectedAssignmentId ?? ""),
		enabled: !!selectedAssignmentId,
		refetchOnWindowFocus: false,
	});

	// Get selected learners for stats bar
	const selectedLearners = useMemo(() => {
		if (!analyticsData) return [];
		return analyticsData.learners.filter((l: LearnerAnalytics) =>
			selectedLearnerMapIds.has(l.learnerMapId),
		);
	}, [analyticsData, selectedLearnerMapIds]);

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

	const handleToggleAll = useCallback((learnerMapIds: string[]) => {
		setSelectedLearnerMapIds(new Set(learnerMapIds));
	}, []);

	const handleSelectAssignment = useCallback((id: string | null) => {
		setSelectedAssignmentId(id);
		setSelectedLearnerMapIds(new Set());
	}, []);

	const handleRefresh = useCallback(() => {
		if (selectedAssignmentId) {
			window.location.reload();
		}
	}, [selectedAssignmentId]);

	return (
		<TooltipProvider delay={300}>
			<div className="h-full grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
				<AnalyticsSidebar
					selectedAssignmentId={selectedAssignmentId}
					onSelectAssignment={handleSelectAssignment}
					selectedLearnerMapIds={selectedLearnerMapIds}
					onToggleLearner={handleToggleLearner}
					onToggleAll={handleToggleAll}
				/>

				<section className="rounded-lg border-[0.5px] overflow-hidden flex flex-col">
					<AnalyticsToolbar
						selectedAssignmentId={selectedAssignmentId}
						analyticsData={analyticsData ?? null}
						tooltipHandle={tooltipHandle}
						onRefresh={handleRefresh}
					/>

					<AnalyticsControls visibility={visibility} onChange={handleVisibilityChange} />

					<SelectedLearnerStats selectedLearners={selectedLearners} />

					<AnalyticsCanvasWrapper
						selectedAssignmentId={selectedAssignmentId}
						selectedLearnerMapIds={selectedLearnerMapIds}
						analyticsData={analyticsData ?? null}
						visibility={visibility}
					/>
				</section>
			</div>
			<TooltipContent handle={tooltipHandle} />
		</TooltipProvider>
	);
}
