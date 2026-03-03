import { cn } from "@/lib/utils";

type McqOptionsDisplayProps = {
	options: Array<{ id: string; text: string }>;
	selectedOptionId: string;
};

export function McqOptionsDisplay({ options, selectedOptionId }: McqOptionsDisplayProps) {
	return (
		<div className="space-y-2">
			{options.map((option, index) => {
				const isSelected = option.id === selectedOptionId;
				return (
					<div
						key={option.id}
						className={cn(
							"flex items-center gap-3 rounded-lg border-2 p-3 transition-colors",
							isSelected
								? "border-primary bg-primary text-primary-foreground"
								: "border-border bg-card text-foreground",
						)}
					>
						<span
							className={cn(
								"flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
								isSelected
									? "bg-primary-foreground text-primary"
									: "bg-muted text-muted-foreground",
							)}
						>
							{String.fromCharCode(65 + index)}
						</span>
						<span className="flex-1 text-sm font-medium">{option.text}</span>
					</div>
				);
			})}
		</div>
	);
}
