import type { LikertOptions } from "@/features/form/lib/form-service.shared";
import { cn } from "@/lib/utils";

export interface LikertQuestionData {
	id: string;
	questionText: string;
	type: "likert";
	options: LikertOptions;
	required: boolean;
}

interface LikertRendererProps {
	question: LikertQuestionData;
	value?: number;
	onChange: (questionId: string, value: number) => void;
	disabled?: boolean;
}

export function LikertRenderer({
	question,
	value,
	onChange,
	disabled = false,
}: LikertRendererProps) {
	const scaleSize = question.options.scaleSize;
	const labels = question.options.labels;
	const scalePoints = Array.from({ length: scaleSize }, (_, i) => i + 1);

	const handleSelect = (scaleValue: number) => {
		if (!disabled) {
			onChange(question.id, scaleValue);
		}
	};

	const getLowLabel = (): string => {
		const label = labels[1];
		return label ?? "1";
	};

	const getHighLabel = (): string => {
		const label = labels[scaleSize];
		return label ?? scaleSize.toString();
	};

	return (
		<div className="space-y-3" data-testid="likert-renderer">
			<div className="space-y-1.5">
				<div className="flex items-center justify-between text-xs text-muted-foreground">
					<span>{getLowLabel()}</span>
					<span>{getHighLabel()}</span>
				</div>

				<div className="flex gap-1.5">
					{scalePoints.map((scaleValue) => {
						const isSelected = value === scaleValue;
						return (
							<label
								key={scaleValue}
								className={cn(
									"relative flex h-10 cursor-pointer flex-1 items-center justify-center rounded-md border-2 text-sm font-semibold transition-all duration-200",
									"hover:border-primary/50 hover:bg-primary/5",
									isSelected
										? "border-primary bg-primary text-primary-foreground"
										: "border-border bg-card hover:border-primary/30",
									disabled &&
										"opacity-60 cursor-not-allowed hover:border-border hover:bg-card",
								)}
							>
								<input
									type="radio"
									name={question.id}
									value={scaleValue}
									checked={isSelected}
									onChange={() => handleSelect(scaleValue)}
									disabled={disabled}
									className="sr-only"
									data-testid={`likert-option-${scaleValue}`}
								/>
								{scaleValue}
							</label>
						);
					})}
				</div>
			</div>

			{question.required && !value && (
				<p className="text-xs text-destructive" data-testid="required-warning">
					Please select an answer to continue
				</p>
			)}
		</div>
	);
}
