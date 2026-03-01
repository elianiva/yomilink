import type { LearnerAnalytics } from "../lib/analytics-service";

function LegendDot({ color }: { color: string }) {
	return <span className="inline-block size-3 rounded-full" style={{ backgroundColor: color }} />;
}

interface SelectedLearnerStatsProps {
	selectedLearners: LearnerAnalytics[];
}

export function SelectedLearnerStats({ selectedLearners }: SelectedLearnerStatsProps) {
	if (selectedLearners.length === 0) return null;

	return (
		<div className="border-b px-3 py-2 flex items-center justify-between bg-muted/30">
			<div className="text-sm font-medium">
				{selectedLearners.length === 1
					? selectedLearners[0]?.userName
					: `${selectedLearners.length} learners selected`}
			</div>
			<div className="flex items-center gap-4 text-xs">
				<div className="flex items-center gap-1.5">
					<LegendDot color="#22c55e" />
					<span>{selectedLearners.reduce((sum, l) => sum + l.correct, 0)} correct</span>
				</div>
				<div className="flex items-center gap-1.5">
					<LegendDot color="#ef4444" />
					<span>{selectedLearners.reduce((sum, l) => sum + l.missing, 0)} missing</span>
				</div>
				<div className="flex items-center gap-1.5">
					<LegendDot color="#3b82f6" />
					<span>
						{selectedLearners.reduce((sum, l) => sum + l.excessive, 0)} excessive
					</span>
				</div>
			</div>
		</div>
	);
}
