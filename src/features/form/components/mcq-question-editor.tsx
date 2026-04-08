import { Check, Plus, Shuffle } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type * as React from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { AnswerOptionCard } from "@/features/form/components/answer-option-card";
import type { McqOptions } from "@/features/form/lib/form-service.core";

export interface McqQuestionData {
	questionText: string;
	options: McqOptions["options"];
	correctOptionIds: string[];
	shuffle: boolean;
	required: boolean;
}

interface McqQuestionEditorProps {
	data: McqQuestionData;
	onChange: (data: McqQuestionData) => void;
	disabled?: boolean;
}

function generateOptionId(): string {
	return `opt_${Math.random().toString(36).substr(2, 9)}`;
}

export function McqQuestionEditor({ data, onChange, disabled = false }: McqQuestionEditorProps) {
	const handleQuestionTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		onChange({ ...data, questionText: e.target.value });
	};

	const handleAddOption = () => {
		const newOption = { id: generateOptionId(), text: "" };
		onChange({
			...data,
			options: [...data.options, newOption],
		});
	};

	const handleRemoveOption = (optionId: string) => {
		onChange({
			...data,
			options: data.options.filter((opt) => opt.id !== optionId),
			correctOptionIds: data.correctOptionIds.filter((id) => id !== optionId),
		});
	};

	const handleOptionTextChange = (optionId: string, text: string) => {
		onChange({
			...data,
			options: data.options.map((opt) => (opt.id === optionId ? { ...opt, text } : opt)),
		});
	};

	const handleCorrectAnswerToggle = (optionId: string) => {
		// Only allow one correct answer - radio button behavior
		onChange({
			...data,
			correctOptionIds: data.correctOptionIds.includes(optionId) ? [] : [optionId],
		});
	};

	const handleShuffleToggle = (checked: boolean) => {
		onChange({ ...data, shuffle: checked });
	};

	const handleRequiredToggle = (checked: boolean) => {
		onChange({ ...data, required: checked });
	};

	const handleMoveOption = (index: number, direction: "up" | "down") => {
		const newIndex = direction === "up" ? index - 1 : index + 1;
		if (newIndex < 0 || newIndex >= data.options.length) return;

		const newOptions = [...data.options];
		const [movedOption] = newOptions.splice(index, 1);
		newOptions.splice(newIndex, 0, movedOption);

		onChange({ ...data, options: newOptions });
	};

	return (
		<div className="space-y-6" data-testid="mcq-question-editor">
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
					<Label>Answer Options</Label>
					<span className="text-xs text-muted-foreground">
						{data.options.length} option{data.options.length !== 1 ? "s" : ""}
					</span>
				</div>

				<motion.div className="space-y-2" layout>
					<AnimatePresence mode="popLayout">
						{data.options.map((option, index) => (
							<AnswerOptionCard
								key={option.id}
								option={option}
								index={index}
								totalOptions={data.options.length}
								isCorrect={data.correctOptionIds.includes(option.id)}
								disabled={disabled}
								onMoveUp={() => handleMoveOption(index, "up")}
								onMoveDown={() => handleMoveOption(index, "down")}
								onTextChange={(text) => handleOptionTextChange(option.id, text)}
								onCorrectToggle={() => handleCorrectAnswerToggle(option.id)}
								onRemove={() => handleRemoveOption(option.id)}
							/>
						))}
					</AnimatePresence>
				</motion.div>

				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={handleAddOption}
					disabled={disabled || data.options.length >= 10}
					data-testid="add-option-button"
					className="w-full"
				>
					<Plus className="mr-2 h-4 w-4" />
					Add Option
				</Button>
			</div>

			<div className="space-y-4 rounded-lg border p-4">
				<div className="flex items-center justify-between">
					<div className="space-y-0.5">
						<div className="flex items-center gap-2">
							<Shuffle className="h-4 w-4 text-muted-foreground" />
							<Label htmlFor="shuffle-toggle" className="cursor-pointer">
								Shuffle Options
							</Label>
						</div>
						<p className="text-xs text-muted-foreground">
							Randomize option order when displaying to students
						</p>
					</div>
					<Switch
						id="shuffle-toggle"
						data-testid="shuffle-toggle"
						checked={data.shuffle}
						onCheckedChange={handleShuffleToggle}
						disabled={disabled}
					/>
				</div>

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
