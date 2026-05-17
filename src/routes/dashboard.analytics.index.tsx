import { createFileRoute } from "@tanstack/react-router";
import { MenuIcon, XIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
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
import type { LearnerAnalytics } from "@/features/analyzer/lib/analytics-service.shared";
import { Guard } from "@/features/auth/components/Guard";
import { useRpcQuery } from "@/hooks/use-rpc-query";
import { cn } from "@/lib/utils";
import { AnalyticsRpc } from "@/server/rpc/analytics";

export const Route = createFileRoute("/dashboard/analytics/")({
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
	const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
			(l: LearnerAnalytics) => l.condition === "summarizing",
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
			<section className="relative h-full overflow-hidden -mx-6 border-t-[0.5px]">
				{/* Background layer — canvas/summary fills everything */}
				<div className="absolute inset-0">
					{activeLearnerTab === "conceptMap" ? (
						<AnalyticsCanvasWrapper
							className="size-full m-0 rounded-none"
							selectedAssignmentId={selectedAssignmentId}
							selectedLearnerMapIds={selectedLearnerMapIds}
							analyticsData={analyticsData ?? null}
							visibility={visibility}
							allowNodeDragging={true}
						/>
					) : (
						<AnalyticsSummaryPanel
							selectedAssignmentId={selectedAssignmentId}
							summaryLearners={summaryLearners}
							selectedLearnerMapIds={selectedLearnerMapIds}
						/>
					)}
				</div>

				{/* Floating UI layer — no pointer events so canvas gets clicks */}
				<div className="absolute inset-0 z-10 pointer-events-none">
					<AnalyticsToolbar
						selectedAssignmentId={selectedAssignmentId}
						analyticsData={analyticsData ?? null}
						tooltipHandle={tooltipHandle}
						onRefresh={handleRefresh}
					/>

					{/* Pill toggle */}
					<Button
						onClick={() => setIsSidebarOpen((v) => !v)}
						className="absolute top-15 right-3 z-20 bg-card hover:bg-card border rounded-md pointer-events-auto cursor-pointer"
						size="icon-lg"
					>
						{isSidebarOpen ? (
							<XIcon
								className={cn(
									"size-4 transition-transform text-foreground",
									isSidebarOpen && "rotate-90",
								)}
							/>
						) : (
							<MenuIcon
								className={cn(
									"size-4 transition-transform text-foreground",
									isSidebarOpen && "rotate-90",
								)}
							/>
						)}
					</Button>

					{/* Floating sidebar panel */}
					<AnimatePresence>
						{isSidebarOpen && (
							<motion.div
								initial={{ opacity: 0, scale: 0.92, y: -6 }}
								animate={{ opacity: 1, scale: 1, y: 0 }}
								exit={{ opacity: 0, scale: 0.96, y: -3 }}
								transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
								style={{ transformOrigin: "top right" }}
								className="absolute top-27 right-3 z-20 w-80 bg-card/30 backdrop-blur-lg border rounded-lg shadow-sm pointer-events-auto max-h-[calc(100vh-8rem)] overflow-y-auto"
							>
								<AnalyticsSidebar
									className="bg-transparent"
									selectedAssignmentId={selectedAssignmentId}
									onSelectAssignment={handleSelectAssignment}
									selectedLearnerMapIds={selectedLearnerMapIds}
									onToggleLearner={handleToggleLearner}
									onToggleAll={handleToggleAll}
									activeTab={activeLearnerTab}
									onTabChange={setActiveLearnerTab}
								/>
							</motion.div>
						)}
					</AnimatePresence>

					{activeLearnerTab === "conceptMap" && (
						<>
							{selectedLearners.length > 0 && (
								<SelectedLearnerStats
									className="absolute top-16 left-3 bg-card/30 backdrop-blur-lg border rounded-lg shadow-sm px-3 py-2 pointer-events-auto"
									selectedLearners={selectedLearners}
								/>
							)}
							<AnalyticsControls
								className="absolute bottom-3 left-3 bg-card/30 backdrop-blur-lg border rounded-lg shadow-lg pointer-events-auto max-w-64"
								visibility={visibility}
								onChange={handleVisibilityChange}
							/>
						</>
					)}
				</div>
			</section>
			<TooltipContent handle={tooltipHandle} />
		</TooltipProvider>
	);
}
