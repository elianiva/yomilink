import { Loader2Icon } from "lucide-react";
import { lazy, Suspense, useMemo } from "react";

import type {
	AssignmentAnalytics,
	LearnerMapResult,
} from "@/features/analyzer/lib/analytics-service.core";

// Lazy load AnalyticsCanvas (heavy React Flow component)
const AnalyticsCanvas = lazy(() =>
	import("./canvas").then((m) => ({ default: m.AnalyticsCanvas })),
);

function CanvasSkeleton() {
	return (
		<div className="w-full h-full flex items-center justify-center">
			<Loader2Icon className="animate-spin size-8" />
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
		consolidatedView: boolean;
		showNamesOnHover: boolean;
	};
}) {
	const mappedLearnerMaps = useMemo(
		() => multipleLearnerMapDetails?.map((m) => m.learnerMap) ?? [],
		[multipleLearnerMapDetails],
	);

	const allEdgeClassificationsMemo = useMemo(
		() =>
			multipleLearnerMapDetails?.flatMap((m) =>
				m.edgeClassifications.map((classification) => ({
					...classification,
					createdBy: m.learnerMap.userName,
				})),
			) ?? [],
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
