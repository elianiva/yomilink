import { lazy, Suspense, useMemo } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import type {
	AssignmentAnalytics,
	LearnerMapResult,
} from "@/features/analyzer/lib/analytics-service";

// Lazy load AnalyticsCanvas (heavy React Flow component)
const AnalyticsCanvas = lazy(() =>
	import("./canvas").then((m) => ({ default: m.AnalyticsCanvas })),
);

function CanvasSkeleton() {
	return (
		<div className="w-full h-full flex items-center justify-center">
			<div className="flex flex-col items-center gap-4">
				<Skeleton className="h-8 w-48" />
				<Skeleton className="h-4 w-32" />
			</div>
		</div>
	);
}

export function CanvasContent({
	selectedAssignmentId,
	selectedLearnerMapIds,
	analyticsData,
	multipleLearnerMapDetails,
	isLoadingLearnerMaps,
	visibility,
}: {
	selectedAssignmentId: string | null;
	selectedLearnerMapIds: Set<string>;
	analyticsData: AssignmentAnalytics | null | undefined;
	multipleLearnerMapDetails: LearnerMapResult[] | null;
	isLoadingLearnerMaps: boolean;
	visibility: {
		showGoalMap: boolean;
		showLearnerMap: boolean;
		showCorrectEdges: boolean;
		showMissingEdges: boolean;
		showExcessiveEdges: boolean;
		showNeutralEdges: boolean;
	};
}) {
	const mappedLearnerMaps = useMemo(
		() => multipleLearnerMapDetails?.map((m) => m.learnerMap) ?? [],
		[multipleLearnerMapDetails],
	);

	const allEdgeClassificationsMemo = useMemo(
		() => multipleLearnerMapDetails?.flatMap((m) => m.edgeClassifications) ?? [],
		[multipleLearnerMapDetails],
	);

	if (!selectedAssignmentId) {
		return (
			<div className="w-full h-full flex items-center justify-center">
				<div className="text-sm text-muted-foreground px-4 text-center">
					Select an assignment to view analytics
				</div>
			</div>
		);
	}

	if (selectedLearnerMapIds.size === 0 || !analyticsData || !("goalMap" in analyticsData)) {
		return (
			<div className="w-full h-full flex items-center justify-center">
				<div className="text-sm text-muted-foreground px-4 text-center">
					Select learners to view their maps
				</div>
			</div>
		);
	}

	if (isLoadingLearnerMaps || !multipleLearnerMapDetails) {
		return (
			<div className="w-full h-full flex items-center justify-center">
				<div className="text-sm text-muted-foreground px-4 text-center">
					Loading learner maps...
				</div>
			</div>
		);
	}

	return (
		<Suspense fallback={<CanvasSkeleton />}>
			<AnalyticsCanvas
				goalMap={analyticsData.goalMap}
				learnerMaps={mappedLearnerMaps}
				allEdgeClassifications={allEdgeClassificationsMemo}
				visibility={visibility}
				isMultiView={true}
			/>
		</Suspense>
	);
}
