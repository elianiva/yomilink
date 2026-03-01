import { useMemo } from "react";

import { ErrorCard } from "@/components/ui/error-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useRpcQuery } from "@/hooks/use-rpc-query";
import { AnalyticsRpc } from "@/server/rpc/analytics";

import type { AssignmentAnalytics } from "../lib/analytics-service";
import { CanvasContent } from "./canvas-content";

interface VisibilityState {
	showGoalMap: boolean;
	showLearnerMap: boolean;
	showCorrectEdges: boolean;
	showMissingEdges: boolean;
	showExcessiveEdges: boolean;
	showNeutralEdges: boolean;
}

interface AnalyticsCanvasWrapperProps {
	selectedAssignmentId: string | null;
	selectedLearnerMapIds: Set<string>;
	analyticsData: AssignmentAnalytics | null;
	visibility: VisibilityState;
}

function CanvasSkeleton() {
	return (
		<div className="w-full h-full flex items-center justify-center">
			<div className="flex flex-col items-center gap-4">
				<Skeleton className="h-32 w-48 rounded-lg" />
				<Skeleton className="h-4 w-32" />
			</div>
		</div>
	);
}

export function AnalyticsCanvasWrapper({
	selectedAssignmentId,
	selectedLearnerMapIds,
	analyticsData,
	visibility,
}: AnalyticsCanvasWrapperProps) {
	const learnerMapIds = useMemo(() => Array.from(selectedLearnerMapIds), [selectedLearnerMapIds]);

	const {
		data: multipleLearnerMapDetails,
		isLoading: multipleLearnerMapsLoading,
		isRefetching: isRefetchingMultipleLearnerMaps,
		rpcError: multipleLearnerMapsError,
		refetch: refetchMultipleLearnerMaps,
	} = useRpcQuery({
		...AnalyticsRpc.getMultipleLearnerMaps(learnerMapIds),
		enabled: selectedLearnerMapIds.size > 0,
		refetchOnWindowFocus: false,
	});

	if (multipleLearnerMapsError) {
		return (
			<div className="flex-1 m-3 rounded-md border">
				<ErrorCard
					title="Failed to load learner maps"
					description={multipleLearnerMapsError}
					onRetry={() => refetchMultipleLearnerMaps()}
					isRetrying={isRefetchingMultipleLearnerMaps}
				/>
			</div>
		);
	}

	return (
		<div className="flex-1 m-3 rounded-md border overflow-hidden">
			{multipleLearnerMapsLoading && selectedLearnerMapIds.size > 0 ? (
				<CanvasSkeleton />
			) : (
				<CanvasContent
					selectedAssignmentId={selectedAssignmentId}
					selectedLearnerMapIds={selectedLearnerMapIds}
					analyticsData={analyticsData}
					multipleLearnerMapDetails={multipleLearnerMapDetails ?? null}
					isLoadingLearnerMaps={multipleLearnerMapsLoading}
					visibility={visibility}
				/>
			)}
		</div>
	);
}
