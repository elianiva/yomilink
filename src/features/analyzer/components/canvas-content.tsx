import type {
	AssignmentAnalytics,
	LearnerMapResult,
} from "@/features/analyzer/lib/analytics-service";
import { AnalyticsCanvas } from "./canvas";

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
	if (!selectedAssignmentId) {
		return (
			<div className="w-full h-full flex items-center justify-center">
				<div className="text-sm text-muted-foreground px-4 text-center">
					Select an assignment to view analytics
				</div>
			</div>
		);
	}

	if (
		selectedLearnerMapIds.size === 0 ||
		!analyticsData ||
		!("goalMap" in analyticsData)
	) {
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
		<AnalyticsCanvas
			goalMap={analyticsData.goalMap}
			learnerMaps={multipleLearnerMapDetails.map((m) => m.learnerMap)}
			allEdgeClassifications={multipleLearnerMapDetails.flatMap(
				(m) => m.edgeClassifications,
			)}
			visibility={visibility}
			isMultiView={true}
		/>
	);
}
