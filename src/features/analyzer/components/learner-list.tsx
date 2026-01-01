import { cn } from "@/lib/utils";
import type { LearnerAnalytics } from "@/server/rpc/analytics";

export function LearnerList({
	learners,
	isLoading,
	selectedLearnerMapId,
	onSelectLearner,
}: {
	learners: LearnerAnalytics[];
	isLoading: boolean;
	selectedLearnerMapId: string | null;
	onSelectLearner: (learnerMapId: string) => void;
}) {
	if (isLoading) {
		return (
			<div className="px-3 py-6 text-center text-xs text-muted-foreground">
				Loading...
			</div>
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
						selectedLearnerMapId === learner.learnerMapId && "bg-muted",
					)}
					onClick={() => onSelectLearner(learner.learnerMapId)}
				>
					<span className="text-sm">{learner.userName}</span>
					<span className="text-xs font-semibold tabular-nums">
						{learner.score !== null ? `${learner.score}%` : "-"}
					</span>
				</button>
			))}
		</>
	);
}
