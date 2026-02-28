interface DiagnosisStatsProps {
	correct: number;
	missing: number;
	excessive: number;
	total: number;
	score: number;
}

export function DiagnosisStats({ correct, missing, excessive, total, score }: DiagnosisStatsProps) {
	const percentage = Math.round(score * 100);

	return (
		<div className="bg-card border rounded-lg p-4 space-y-4">
			<div className="flex items-center justify-between">
				<h3 className="font-medium">Your Score</h3>
				<span className="text-2xl font-bold">{percentage}%</span>
			</div>

			<div className="w-full bg-muted rounded-full h-3 overflow-hidden">
				<div
					className="h-full bg-primary transition-all duration-500"
					style={{ width: `${percentage}%` }}
				/>
			</div>

			<div className="grid grid-cols-3 gap-3 text-center">
				<div className="bg-green-50 border border-green-200 rounded-lg p-3">
					<div className="text-2xl font-bold text-green-600">{correct}</div>
					<div className="text-xs text-green-700">Correct</div>
				</div>
				<div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
					<div className="text-2xl font-bold text-amber-600">{missing}</div>
					<div className="text-xs text-amber-700">Missing</div>
				</div>
				<div className="bg-red-50 border border-red-200 rounded-lg p-3">
					<div className="text-2xl font-bold text-red-600">{excessive}</div>
					<div className="text-xs text-red-700">Excessive</div>
				</div>
			</div>

			<p className="text-sm text-muted-foreground text-center">
				{correct} of {total} connections correct
			</p>
		</div>
	);
}
