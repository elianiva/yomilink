import { cn } from "@/lib/utils";

interface FormProgressBarProps {
	currentQuestion: number;
	totalQuestions: number;
	className?: string;
}

export function FormProgressBar({
	currentQuestion,
	totalQuestions,
	className,
}: FormProgressBarProps) {
	const progress = totalQuestions > 0 ? (currentQuestion / totalQuestions) * 100 : 0;

	return (
		<div className={cn("space-y-2", className)}>
			<div className="flex items-center justify-between text-sm">
				<span className="text-muted-foreground">
					Question {currentQuestion} of {totalQuestions}
				</span>
				<span className="text-muted-foreground">{Math.round(progress)}% complete</span>
			</div>
			<div className="h-2 w-full overflow-hidden rounded-full bg-muted">
				<div
					className="h-full bg-primary transition-all duration-300"
					style={{ width: `${progress}%` }}
				/>
			</div>
		</div>
	);
}
