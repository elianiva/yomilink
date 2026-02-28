"use client";

import { Check } from "lucide-react";
import { useMemo } from "react";

import type { McqOptions } from "@/features/form/lib/form-service";
import { cn } from "@/lib/utils";

export interface McqQuestionData {
	id: string;
	questionText: string;
	type: "mcq";
	options: McqOptions["options"];
	shuffle: boolean;
	required: boolean;
}

interface McqRendererProps {
	question: McqQuestionData;
	value?: string;
	onChange: (questionId: string, value: string) => void;
	disabled?: boolean;
}

function shuffleArray<T>(array: readonly T[]): T[] {
	const shuffled = [...array];
	for (let i = shuffled.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
	}
	return shuffled;
}

export function McqRenderer({ question, value, onChange, disabled = false }: McqRendererProps) {
	const displayOptions = useMemo(() => {
		if (question.shuffle) {
			return shuffleArray(question.options);
		}
		return [...question.options];
	}, [question.options, question.shuffle]);

	const handleSelect = (optionId: string) => {
		if (!disabled) {
			onChange(question.id, optionId);
		}
	};

	return (
		<div className="space-y-4" data-testid="mcq-renderer">
			{displayOptions.map((option, index) => {
				const isSelected = value === option.id;
				return (
					<button
						key={option.id}
						type="button"
						onClick={() => handleSelect(option.id)}
						disabled={disabled}
						data-testid={`mcq-option-${index}`}
						className={cn(
							"w-full rounded-xl border-2 p-4 text-left transition-all duration-200",
							"hover:border-primary/50 hover:bg-primary/5",
							"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
							isSelected
								? "border-primary bg-primary text-primary-foreground hover:border-primary hover:bg-primary"
								: "border-border bg-card",
							disabled &&
								"opacity-60 cursor-not-allowed hover:border-border hover:bg-card",
						)}
					>
						<div className="flex items-center gap-3">
							<div
								className={cn(
									"flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
									isSelected
										? "border-current bg-current text-primary-foreground"
										: "border-muted-foreground",
								)}
							>
								{isSelected && <Check className="h-4 w-4" />}
							</div>
							<span className="flex-1 font-medium">{option.text}</span>
						</div>
					</button>
				);
			})}

			{question.required && !value && (
				<p className="text-sm text-destructive" data-testid="required-warning">
					Please select an answer to continue
				</p>
			)}
		</div>
	);
}
