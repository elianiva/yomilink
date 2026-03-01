import { Check } from "lucide-react";
import type * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

export interface LikertQuestionData {
	questionText: string;
	scaleSize: number;
	labels: Record<string, string>;
	required: boolean;
}

interface LikertQuestionEditorProps {
	data: LikertQuestionData;
	onChange: (data: LikertQuestionData) => void;
	disabled?: boolean;
}

const DEFAULT_LABELS_5_POINT: Record<string, string> = {
	"1": "Strongly Disagree",
	"2": "Disagree",
	"3": "Neutral",
	"4": "Agree",
	"5": "Strongly Agree",
};

const DEFAULT_LABELS_7_POINT: Record<string, string> = {
	"1": "Strongly Disagree",
	"2": "Disagree",
	"3": "Somewhat Disagree",
	"4": "Neutral",
	"5": "Somewhat Agree",
	"6": "Agree",
	"7": "Strongly Agree",
};

function generateDefaultLabels(scaleSize: number): Record<string, string> {
	if (scaleSize === 7) {
		return { ...DEFAULT_LABELS_7_POINT };
	}
	return { ...DEFAULT_LABELS_5_POINT };
}

export function LikertQuestionEditor({
	data,
	onChange,
	disabled = false,
}: LikertQuestionEditorProps) {
	const handleQuestionTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		onChange({ ...data, questionText: e.target.value });
	};

	const handleScaleSizeChange = (newSize: number) => {
		const clampedSize = Math.max(2, Math.min(10, newSize));
		const currentLabels = { ...data.labels };
		const newLabels: Record<string, string> = {};

		for (let i = 1; i <= clampedSize; i++) {
			const key = String(i);
			newLabels[key] = currentLabels[key] || String(i);
		}

		onChange({
			...data,
			scaleSize: clampedSize,
			labels: newLabels,
		});
	};

	const handleLabelChange = (key: string, value: string) => {
		onChange({
			...data,
			labels: { ...data.labels, [key]: value },
		});
	};

	const handleRequiredToggle = (checked: boolean) => {
		onChange({ ...data, required: checked });
	};

	const handleResetLabels = () => {
		onChange({
			...data,
			labels: generateDefaultLabels(data.scaleSize),
		});
	};

	const scaleOptions = [3, 4, 5, 6, 7, 8, 9, 10];

	return (
		<div className="space-y-6" data-testid="likert-question-editor">
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
				<div className="flex items-center justify-between">
					<Label>Scale Size</Label>
					<span className="text-xs text-muted-foreground">
						{data.scaleSize}-point scale
					</span>
				</div>

				<div className="flex flex-wrap gap-2" data-testid="scale-size-buttons">
					{scaleOptions.map((size) => (
						<Button
							key={size}
							type="button"
							variant={data.scaleSize === size ? "default" : "outline"}
							size="sm"
							onClick={() => handleScaleSizeChange(size)}
							disabled={disabled}
							data-testid={`scale-size-${size}`}
						>
							{size}
						</Button>
					))}
				</div>
			</div>

			<div className="space-y-3">
				<div className="flex items-center justify-between">
					<Label>Scale Labels</Label>
					<Button
						type="button"
						variant="ghost"
						size="sm"
						onClick={handleResetLabels}
						disabled={disabled}
						data-testid="reset-labels-button"
					>
						Reset to defaults
					</Button>
				</div>

				<div
					className="grid gap-2"
					style={{
						gridTemplateColumns: `repeat(${Math.min(data.scaleSize, 5)}, 1fr)`,
					}}
					data-testid="label-inputs"
				>
					{Array.from({ length: data.scaleSize }, (_, i) => {
						const key = String(i + 1);
						return (
							<div key={key} className="space-y-1">
								<Label
									htmlFor={`label-${key}`}
									className="text-xs text-muted-foreground"
								>
									{key}
								</Label>
								<Input
									id={`label-${key}`}
									data-testid={`label-input-${key}`}
									value={data.labels[key] || ""}
									onChange={(e) => handleLabelChange(key, e.target.value)}
									placeholder={key}
									disabled={disabled}
								/>
							</div>
						);
					})}
				</div>

				<div className="mt-2 rounded-lg border p-3">
					<p className="text-xs text-muted-foreground" data-testid="preview-label">
						Preview: <span className="font-medium">1</span> = "{data.labels["1"] || "1"}
						" → <span className="font-medium">{data.scaleSize}</span> = "
						{data.labels[String(data.scaleSize)] || String(data.scaleSize)}"
					</p>
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
		</div>
	);
}

export function createDefaultLikertData(): LikertQuestionData {
	return {
		questionText: "",
		scaleSize: 5,
		labels: generateDefaultLabels(5),
		required: true,
	};
}
