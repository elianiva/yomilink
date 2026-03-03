import { useMemo, useState } from "react";

import { ErrorCard } from "@/components/ui/error-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useRpcQuery } from "@/hooks/use-rpc-query";
import { AnalyticsRpc } from "@/server/rpc/analytics";

import type { LearnerAnalytics } from "../lib/analytics-service";

interface AnalyticsSummaryPanelProps {
	selectedAssignmentId: string | null;
	summaryLearners: LearnerAnalytics[];
	selectedLearnerMapIds: Set<string>;
}

export function AnalyticsSummaryPanel({
	selectedAssignmentId,
	summaryLearners,
	selectedLearnerMapIds,
}: AnalyticsSummaryPanelProps) {
	const [activeLearnerMapId, setActiveLearnerMapId] = useState<string | null>(null);

	const selectedSummaryLearners = useMemo(
		() => summaryLearners.filter((learner) => selectedLearnerMapIds.has(learner.learnerMapId)),
		[summaryLearners, selectedLearnerMapIds],
	);

	const effectiveLearnerMapId = useMemo(() => {
		if (selectedSummaryLearners.length === 0) return null;
		if (
			activeLearnerMapId &&
			selectedSummaryLearners.some((l) => l.learnerMapId === activeLearnerMapId)
		) {
			return activeLearnerMapId;
		}
		return selectedSummaryLearners[0]?.learnerMapId ?? null;
	}, [activeLearnerMapId, selectedSummaryLearners]);

	const {
		data: summaryDetail,
		isLoading,
		isRefetching,
		rpcError,
		refetch,
	} = useRpcQuery({
		...AnalyticsRpc.getLearnerSummaryText(effectiveLearnerMapId ?? ""),
		enabled: !!effectiveLearnerMapId,
		refetchOnWindowFocus: false,
	});

	if (!selectedAssignmentId) {
		return (
			<div className="flex-1 m-3 rounded-md border p-4 text-sm text-muted-foreground flex items-center justify-center text-center">
				Select an assignment to view summary submissions
			</div>
		);
	}

	if (summaryLearners.length === 0) {
		return (
			<div className="flex-1 m-3 rounded-md border p-4 text-sm text-muted-foreground flex items-center justify-center text-center">
				No summary learners for this assignment
			</div>
		);
	}

	if (selectedSummaryLearners.length === 0) {
		return (
			<div className="flex-1 m-3 rounded-md border p-4 text-sm text-muted-foreground flex items-center justify-center text-center">
				Select summary learners from the sidebar to review their submitted text
			</div>
		);
	}

	return (
		<div className="flex-1 m-3 rounded-md border overflow-hidden grid grid-cols-1 lg:grid-cols-[240px_1fr]">
			<div className="border-r overflow-auto">
				{selectedSummaryLearners.map((learner) => (
					<button
						type="button"
						key={learner.learnerMapId}
						className={[
							"w-full text-left px-3 py-2 border-b text-sm hover:bg-muted/50",
							effectiveLearnerMapId === learner.learnerMapId ? "bg-muted" : "",
						].join(" ")}
						onClick={() => setActiveLearnerMapId(learner.learnerMapId)}
					>
						<div className="font-medium truncate">{learner.userName}</div>
						<div className="text-xs text-muted-foreground">{learner.status}</div>
					</button>
				))}
			</div>
			<div className="p-4 overflow-auto">
				{rpcError ? (
					<ErrorCard
						title="Failed to load learner summary"
						description={rpcError}
						onRetry={() => refetch()}
						isRetrying={isRefetching}
					/>
				) : isLoading || isRefetching ? (
					<div className="space-y-2">
						<Skeleton className="h-5 w-40" />
						<Skeleton className="h-4 w-full" />
						<Skeleton className="h-4 w-full" />
						<Skeleton className="h-4 w-5/6" />
					</div>
				) : !summaryDetail?.controlText ? (
					<div className="text-sm text-muted-foreground">
						No submitted summary text available.
					</div>
				) : (
					<div className="space-y-3">
						<div>
							<div className="text-xs uppercase text-muted-foreground">Learner</div>
							<div className="font-medium">{summaryDetail.learnerName}</div>
						</div>
						<div>
							<div className="text-xs uppercase text-muted-foreground mb-1">
								Submitted Summary
							</div>
							<p className="text-sm whitespace-pre-wrap leading-relaxed">
								{summaryDetail.controlText}
							</p>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
