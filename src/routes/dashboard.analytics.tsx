import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";

import { Guard } from "@/components/auth/Guard";
import { createTooltipHandle, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { AnalyticsCanvasWrapper } from "@/features/analyzer/components/analytics-canvas-wrapper";
import { AnalyticsControls } from "@/features/analyzer/components/analytics-controls";
import {
	AnalyticsSidebar,
	type AnalyticsLearnerTab,
} from "@/features/analyzer/components/analytics-sidebar";
import { AnalyticsSummaryPanel } from "@/features/analyzer/components/analytics-summary-panel";
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
	const [activeLearnerTab, setActiveLearnerTab] = useState<AnalyticsLearnerTab>("conceptMap");

	const tooltipHandle = createTooltipHandle();

	const [visibility, setVisibility] = useState({
		showGoalMap: true,
		showLearnerMap: true,
		showCorrectEdges: true,
		showMissingEdges: true,
		showExcessiveEdges: true,
		showNeutralEdges: true,
		consolidatedView: true,
		showNamesOnHover: false,
	});

	const handleVisibilityChange = useCallback((updates: Partial<typeof visibility>) => {
		setVisibility((prev) => ({ ...prev, ...updates }));
	}, []);

	const { data: analyticsData } = useRpcQuery({
		...AnalyticsRpc.getAnalyticsForAssignment(selectedAssignmentId ?? ""),
		enabled: !!selectedAssignmentId,
		refetchOnWindowFocus: false,
	});

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

	const handleToggleAll = useCallback((checked: boolean, learnerMapIds: string[]) => {
		setSelectedLearnerMapIds((prev) => {
			const next = new Set(prev);
			if (checked) {
				for (const learnerMapId of learnerMapIds) {
					next.add(learnerMapId);
				}
				return next;
			}

			for (const learnerMapId of learnerMapIds) {
				next.delete(learnerMapId);
			}
			return next;
		});
	}, []);

	const summaryLearners = useMemo(() => {
		if (!analyticsData) return [];
		return analyticsData.learners.filter(
			(l: LearnerAnalytics) => l.condition === "summarizing" || l.score === null,
		);
	}, [analyticsData]);

	const handleSelectAssignment = useCallback((id: string | null) => {
		setSelectedAssignmentId(id);
		setSelectedLearnerMapIds(new Set());
		setActiveLearnerTab("conceptMap");
	}, []);

	const handleRefresh = useCallback(() => {
		if (selectedAssignmentId) {
			window.location.reload();
		}
	}, [selectedAssignmentId]);

	return (
		<TooltipProvider delay={300}>
			<section className="rounded-lg border-[0.5px] overflow-hidden h-full flex flex-col">
				<AnalyticsToolbar
					selectedAssignmentId={selectedAssignmentId}
					analyticsData={analyticsData ?? null}
					tooltipHandle={tooltipHandle}
					onRefresh={handleRefresh}
				/>

				<div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] flex-1">
					<AnalyticsSidebar
						selectedAssignmentId={selectedAssignmentId}
						onSelectAssignment={handleSelectAssignment}
						selectedLearnerMapIds={selectedLearnerMapIds}
						onToggleLearner={handleToggleLearner}
						onToggleAll={handleToggleAll}
						activeTab={activeLearnerTab}
						onTabChange={setActiveLearnerTab}
					/>

					<div className="h-full flex flex-col">
						{activeLearnerTab === "conceptMap" ? (
							<>
								<AnalyticsControls
									visibility={visibility}
									onChange={handleVisibilityChange}
								/>
								<SelectedLearnerStats selectedLearners={selectedLearners} />
								<AnalyticsCanvasWrapper
									selectedAssignmentId={selectedAssignmentId}
									selectedLearnerMapIds={selectedLearnerMapIds}
									analyticsData={analyticsData ?? null}
									visibility={visibility}
								/>
							</>
						) : (
							<AnalyticsSummaryPanel
								selectedAssignmentId={selectedAssignmentId}
								summaryLearners={summaryLearners}
								selectedLearnerMapIds={selectedLearnerMapIds}
							/>
						)}
					</div>
				</div>
			</section>
			<TooltipContent handle={tooltipHandle} />
		</TooltipProvider>
	);
}
