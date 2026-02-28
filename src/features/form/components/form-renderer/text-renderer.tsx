"use client";

import { Textarea } from "@/components/ui/textarea";
import type { TextOptions } from "@/features/form/lib/form-service";
import { cn } from "@/lib/utils";

export interface TextQuestionData {
	id: string;
	questionText: string;
	type: "text";
	options: TextOptions;
	required: boolean;
}

interface TextRendererProps {
	question: TextQuestionData;
	value?: string;
	onChange: (questionId: string, value: string) => void;
	disabled?: boolean;
}

export function TextRenderer({
	question,
	value = "",
	onChange,
	disabled = false,
}: TextRendererProps) {
	const minLength = question.options.minLength ?? 0;
	const maxLength = question.options.maxLength ?? Infinity;
	const placeholder = question.options.placeholder ?? "Enter your answer here...";

	const charCount = value.length;
	const isBelowMin = minLength > 0 && charCount < minLength;
	const isAboveMax = charCount > maxLength;

	const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		const newValue = e.target.value;
		if (newValue.length <= maxLength) {
			onChange(question.id, newValue);
		}
	};

	return (
		<div className="space-y-4" data-testid="text-renderer">
			<Textarea
				value={value}
				onChange={handleChange}
				placeholder={placeholder}
				disabled={disabled}
				rows={5}
				data-testid="text-input"
				className={cn(
					"resize-none",
					isBelowMin && "border-destructive focus-visible:ring-destructive",
					isAboveMax && "border-destructive focus-visible:ring-destructive",
				)}
			/>

			<div className="flex items-center justify-between text-sm">
				<div className="flex gap-4">
					{minLength > 0 && (
						<span
							className={cn(
								"text-muted-foreground",
								isBelowMin && "text-destructive",
							)}
							data-testid="min-length-info"
						>
							{minLength} characters minimum
						</span>
					)}
				</div>

				<span
					className={cn(
						"text-muted-foreground transition-colors",
						isAboveMax && "text-destructive font-medium",
					)}
					data-testid="char-count"
				>
					{charCount}
					{maxLength !== Infinity && ` / ${maxLength}`}
				</span>
			</div>

			{question.required && !value.trim() && (
				<p className="text-sm text-destructive" data-testid="required-warning">
					Please enter an answer to continue
				</p>
			)}

			{isBelowMin && value.length > 0 && (
				<p className="text-sm text-destructive" data-testid="validation-message">
					{minLength - charCount} more characters needed
				</p>
			)}
		</div>
	);
}
