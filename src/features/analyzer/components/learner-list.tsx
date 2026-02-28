import { Checkbox } from "@/components/ui/checkbox";
import type { LearnerAnalytics } from "@/features/analyzer/lib/analytics-service";
import { cn } from "@/lib/utils";

export function LearnerList({
	learners,
	isLoading,
	selectedLearnerMapIds,
	onToggleLearner,
}: {
	learners: LearnerAnalytics[];
	isLoading: boolean;
	selectedLearnerMapIds: Set<string>;
	onToggleLearner: (learnerMapId: string) => void;
}) {
	if (isLoading) {
		return (
			<div className="px-3 py-6 text-center text-xs text-muted-foreground">Loading...</div>
		);
	}

	if (learners.length === 0) {
		return (
			<div className="px-3 py-6 text-center text-xs text-muted-foreground">
				No learners found
			</div>
		);
	}

	return (
		<>
			{learners.map((learner) => (
				<button
					type="button"
					key={learner.learnerMapId}
					className={cn(
						"flex w-full items-center justify-between px-3 py-2 border-b last:border-b-0 text-left hover:bg-muted/50",
						selectedLearnerMapIds.has(learner.learnerMapId) && "bg-muted",
					)}
					onClick={() => onToggleLearner(learner.learnerMapId)}
				>
					<div className="flex items-center gap-2">
						<Checkbox
							checked={selectedLearnerMapIds.has(learner.learnerMapId)}
							onClick={(e) => {
								e.stopPropagation();
								onToggleLearner(learner.learnerMapId);
							}}
						/>
						<span className="text-sm">{learner.userName}</span>
					</div>
					<span className="text-xs font-semibold tabular-nums">
						{learner.score !== null ? `${learner.score}%` : "-"}
					</span>
				</button>
			))}
		</>
	);
}
