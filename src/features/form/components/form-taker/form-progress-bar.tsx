interface FormProgressBarProps {
	progress: number;
}

export function FormProgressBar({ progress }: FormProgressBarProps) {
	return (
		<div className="h-1.5 shrink-0 bg-muted">
			<div
				className="h-full bg-primary transition-all duration-300"
				style={{ width: `${progress}%` }}
			/>
		</div>
	);
}
