import type { AssignmentAnalytics } from "@/features/analyzer/lib/analytics-service";
import type { LearnerMapResult } from "@/features/analyzer/lib/analytics-service";
import { AnalyticsCanvas } from "./canvas";

export function CanvasContent({
	selectedAssignmentId,
	selectedLearnerMapId,
	analyticsData,
	learnerMapDetails,
	visibility,
}: {
	selectedAssignmentId: string | null;
	selectedLearnerMapId: string | null;
	analyticsData: AssignmentAnalytics | null | undefined;
	learnerMapDetails: LearnerMapResult | null;
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
		!selectedLearnerMapId ||
		!analyticsData ||
		!("goalMap" in analyticsData)
	) {
		return (
			<div className="w-full h-full flex items-center justify-center">
				<div className="text-sm text-muted-foreground px-4 text-center">
					Select a learner to view their map
				</div>
			</div>
		);
	}

	if (!learnerMapDetails || !("learnerMap" in learnerMapDetails)) {
		return (
			<div className="w-full h-full flex items-center justify-center">
				<div className="text-sm text-muted-foreground px-4 text-center">
					{learnerMapDetails && "error" in learnerMapDetails
						? learnerMapDetails.error
						: "Loading learner map details..."}
				</div>
			</div>
		);
	}

	return (
		<AnalyticsCanvas
			goalMap={analyticsData.goalMap}
			learnerMap={learnerMapDetails.learnerMap}
			edgeClassifications={learnerMapDetails.edgeClassifications}
			visibility={visibility}
		/>
	);
}
