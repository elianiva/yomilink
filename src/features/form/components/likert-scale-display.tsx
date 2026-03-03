import { cn } from "@/lib/utils";

type LikertScaleDisplayProps = {
	scaleSize: number;
	labels: Record<string, string>;
	selectedValue: number;
};

export function LikertScaleDisplay({ scaleSize, labels, selectedValue }: LikertScaleDisplayProps) {
	const scalePoints = Array.from({ length: scaleSize }, (_, i) => i + 1);
	const selectedLabel = labels[String(selectedValue)];

	return (
		<div className="space-y-2">
			<div className="flex items-center justify-between text-xs text-muted-foreground">
				<span>{labels[1] ?? "1"}</span>
				<span>{labels[scaleSize] ?? scaleSize}</span>
			</div>
			<div className="flex gap-1.5">
				{scalePoints.map((value) => {
					const isSelected = value === selectedValue;
					return (
						<div
							key={value}
							className={cn(
								"flex h-8 w-8 flex-1 items-center justify-center rounded-md text-sm font-medium transition-colors",
								isSelected
									? "bg-primary text-primary-foreground"
									: "bg-muted text-muted-foreground",
							)}
						>
							{value}
						</div>
					);
				})}
			</div>
			{selectedLabel && (
				<div className="text-sm font-medium text-primary pt-1">{selectedLabel}</div>
			)}
		</div>
	);
}
