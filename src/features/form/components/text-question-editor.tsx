"use client";

import { Check, Type } from "lucide-react";
import type * as React from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

export interface TextQuestionData {
	questionText: string;
	minLength: number | null;
	maxLength: number | null;
	placeholder: string | null;
	required: boolean;
}

interface TextQuestionEditorProps {
	data: TextQuestionData;
	onChange: (data: TextQuestionData) => void;
	disabled?: boolean;
}

export function TextQuestionEditor({ data, onChange, disabled = false }: TextQuestionEditorProps) {
	const handleQuestionTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		onChange({ ...data, questionText: e.target.value });
	};

	const handleMinLengthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		if (value === "") {
			onChange({ ...data, minLength: null });
			return;
		}
		const parsed = parseInt(value, 10);
		if (!Number.isNaN(parsed) && parsed >= 0) {
			onChange({ ...data, minLength: parsed });
		}
	};

	const handleMaxLengthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		if (value === "") {
			onChange({ ...data, maxLength: null });
			return;
		}
		const parsed = parseInt(value, 10);
		if (!Number.isNaN(parsed) && parsed > 0) {
			onChange({ ...data, maxLength: parsed });
		}
	};

	const handlePlaceholderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		onChange({ ...data, placeholder: e.target.value || null });
	};

	const handleRequiredToggle = (checked: boolean) => {
		onChange({ ...data, required: checked });
	};

	const getCharacterCount = () => {
		if (!data.placeholder) return null;
		return data.placeholder.length;
	};

	return (
		<div className="space-y-6" data-testid="text-question-editor">
			<div className="space-y-2">
				<Label htmlFor="question-text">
					Question Text <span className="text-destructive">*</span>
				</Label>
				<Textarea
					id="question-text"
					data-testid="question-text-input"
					value={data.questionText}
					onChange={handleQuestionTextChange}
					placeholder="Enter your question here..."
					disabled={disabled}
					rows={3}
					aria-required="true"
				/>
			</div>

			<div className="space-y-3">
				<div className="flex items-center gap-2">
					<Type className="h-4 w-4 text-muted-foreground" />
					<Label>Validation Settings</Label>
				</div>

				<div className="grid gap-4 sm:grid-cols-2">
					<div className="space-y-2">
						<Label htmlFor="min-length" className="text-sm">
							Minimum Characters
						</Label>
						<Input
							id="min-length"
							data-testid="min-length-input"
							type="number"
							min={0}
							value={data.minLength ?? ""}
							onChange={handleMinLengthChange}
							placeholder="No minimum"
							disabled={disabled}
						/>
						<p className="text-xs text-muted-foreground">Leave empty for no minimum</p>
					</div>

					<div className="space-y-2">
						<Label htmlFor="max-length" className="text-sm">
							Maximum Characters
						</Label>
						<Input
							id="max-length"
							data-testid="max-length-input"
							type="number"
							min={1}
							value={data.maxLength ?? ""}
							onChange={handleMaxLengthChange}
							placeholder="No maximum"
							disabled={disabled}
						/>
						<p className="text-xs text-muted-foreground">Leave empty for no maximum</p>
					</div>
				</div>

				<div className="space-y-2">
					<Label htmlFor="placeholder">Placeholder Text</Label>
					<Input
						id="placeholder"
						data-testid="placeholder-input"
						value={data.placeholder ?? ""}
						onChange={handlePlaceholderChange}
						placeholder="e.g., Enter your answer here..."
						disabled={disabled}
					/>
					{getCharacterCount() !== null && (
						<p className="text-xs text-muted-foreground">
							{getCharacterCount()} characters
						</p>
					)}
				</div>
			</div>

			<div className="space-y-4 rounded-lg border p-4">
				<div className="flex items-center justify-between">
					<div className="space-y-0.5">
						<div className="flex items-center gap-2">
							<Check className="h-4 w-4 text-muted-foreground" />
							<Label htmlFor="required-toggle" className="cursor-pointer">
								Required Question
							</Label>
						</div>
						<p className="text-xs text-muted-foreground">
							Students must answer this question
						</p>
					</div>
					<Switch
						id="required-toggle"
						data-testid="required-toggle"
						checked={data.required}
						onCheckedChange={handleRequiredToggle}
						disabled={disabled}
					/>
				</div>
			</div>

			{data.minLength !== null && data.maxLength !== null && (
				<div
					className="rounded-lg border border-info bg-info/10 p-3"
					data-testid="validation-preview"
				>
					<p className="text-xs text-info">
						Answer must be between {data.minLength} and {data.maxLength} characters
					</p>
				</div>
			)}
		</div>
	);
}

export function createDefaultTextData(): TextQuestionData {
	return {
		questionText: "",
		minLength: null,
		maxLength: null,
		placeholder: null,
		required: true,
	};
}
