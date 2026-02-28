import { Loader2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LikertQuestionEditor } from "@/features/form/components/likert-question-editor";
import { McqQuestionEditor } from "@/features/form/components/mcq-question-editor";
import { TextQuestionEditor } from "@/features/form/components/text-question-editor";

import type { QuestionEditorDialogProps, EditorWrapperProps } from "./types";

export function QuestionEditorDialog({
	isOpen,
	questionType,
	editingQuestion,
	onClose,
	onSave,
	isPending,
}: QuestionEditorDialogProps) {
	if (!questionType) return null;

	const isEditing = editingQuestion !== null;

	const getInitialData = () => {
		if (editingQuestion) {
			const opts = editingQuestion.options as { type: string } | null;
			// Extract options without the type discriminator for the editors
			if (opts && opts.type === "mcq") {
				const mcqOpts = opts as {
					type: "mcq";
					options: { id: string; text: string }[];
					correctOptionIds: string[];
					shuffle: boolean;
				};
				return {
					questionText: editingQuestion.questionText,
					options: {
						options: mcqOpts.options,
						correctOptionIds: mcqOpts.correctOptionIds,
						shuffle: mcqOpts.shuffle,
					},
					required: editingQuestion.required,
				};
			}
			if (opts && opts.type === "likert") {
				const likertOpts = opts as {
					type: "likert";
					scaleSize: number;
					labels: Record<string, string>;
				};
				return {
					questionText: editingQuestion.questionText,
					options: {
						scaleSize: likertOpts.scaleSize,
						labels: likertOpts.labels,
					},
					required: editingQuestion.required,
				};
			}
			if (opts && opts.type === "text") {
				const textOpts = opts as {
					type: "text";
					minLength: number | null;
					maxLength: number | null;
					placeholder: string;
				};
				return {
					questionText: editingQuestion.questionText,
					options: {
						minLength: textOpts.minLength,
						maxLength: textOpts.maxLength,
						placeholder: textOpts.placeholder,
					},
					required: editingQuestion.required,
				};
			}
			return {
				questionText: editingQuestion.questionText,
				options: editingQuestion.options,
				required: editingQuestion.required,
			};
		}
		return null;
	};

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>
						{isEditing ? "Edit" : "Add"}{" "}
						{questionType === "mcq"
							? "Multiple Choice"
							: questionType === "likert"
								? "Likert Scale"
								: "Text"}{" "}
						Question
					</DialogTitle>
				</DialogHeader>

				{questionType === "mcq" && (
					<McqQuestionEditorWrapper
						initialData={getInitialData()}
						onSave={onSave}
						onCancel={onClose}
						isPending={isPending}
					/>
				)}

				{questionType === "likert" && (
					<LikertQuestionEditorWrapper
						initialData={getInitialData()}
						onSave={onSave}
						onCancel={onClose}
						isPending={isPending}
					/>
				)}

				{questionType === "text" && (
					<TextQuestionEditorWrapper
						initialData={getInitialData()}
						onSave={onSave}
						onCancel={onClose}
						isPending={isPending}
					/>
				)}
			</DialogContent>
		</Dialog>
	);
}

function McqQuestionEditorWrapper({
	initialData,
	onSave,
	onCancel,
	isPending,
}: EditorWrapperProps) {
	const [data, setData] = useState({
		questionText: initialData?.questionText ?? "",
		options: (initialData?.options as
			| {
					options: { id: string; text: string }[];
					correctOptionIds: string[];
					shuffle: boolean;
			  }
			| undefined) ?? {
			options: [],
			correctOptionIds: [],
			shuffle: false,
		},
		required: initialData?.required ?? true,
	});

	const handleSave = () => {
		if (!data.questionText.trim()) return;
		onSave({
			questionText: data.questionText,
			options: {
				type: "mcq" as const,
				options: data.options.options,
				correctOptionIds: data.options.correctOptionIds,
				shuffle: data.options.shuffle,
			},
			required: data.required,
		});
	};

	return (
		<div className="space-y-4">
			<McqQuestionEditor
				data={{
					questionText: data.questionText,
					options: data.options.options,
					correctOptionIds: data.options.correctOptionIds,
					shuffle: data.options.shuffle,
					required: data.required,
				}}
				onChange={(newData) =>
					setData({
						...data,
						questionText: newData.questionText,
						options: {
							options: newData.options as { id: string; text: string }[],
							correctOptionIds: newData.correctOptionIds,
							shuffle: newData.shuffle,
						},
						required: newData.required,
					})
				}
				disabled={isPending}
			/>
			<div className="flex justify-end gap-2 pt-4 border-t">
				<Button variant="outline" onClick={onCancel} disabled={isPending}>
					Cancel
				</Button>
				<Button
					onClick={handleSave}
					disabled={
						isPending || !data.questionText.trim() || data.options.options.length < 2
					}
				>
					{isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
					Save Question
				</Button>
			</div>
		</div>
	);
}

function LikertQuestionEditorWrapper({
	initialData,
	onSave,
	onCancel,
	isPending,
}: EditorWrapperProps) {
	const [data, setData] = useState({
		questionText: initialData?.questionText ?? "",
		options: (initialData?.options as
			| { scaleSize: number; labels: Record<string, string> }
			| undefined) ?? {
			scaleSize: 5,
			labels: {
				"1": "Strongly Disagree",
				"2": "Disagree",
				"3": "Neutral",
				"4": "Agree",
				"5": "Strongly Agree",
			},
		},
		required: initialData?.required ?? true,
	});

	const handleSave = () => {
		if (!data.questionText.trim()) return;
		onSave({
			questionText: data.questionText,
			options: {
				type: "likert" as const,
				scaleSize: data.options.scaleSize,
				labels: data.options.labels,
			},
			required: data.required,
		});
	};

	return (
		<div className="space-y-4">
			<LikertQuestionEditor
				data={{
					questionText: data.questionText,
					scaleSize: data.options.scaleSize,
					labels: data.options.labels,
					required: data.required,
				}}
				onChange={(newData) =>
					setData({
						questionText: newData.questionText,
						options: {
							scaleSize: newData.scaleSize,
							labels: newData.labels,
						},
						required: newData.required,
					})
				}
				disabled={isPending}
			/>
			<div className="flex justify-end gap-2 pt-4 border-t">
				<Button variant="outline" onClick={onCancel} disabled={isPending}>
					Cancel
				</Button>
				<Button onClick={handleSave} disabled={isPending || !data.questionText.trim()}>
					{isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
					Save Question
				</Button>
			</div>
		</div>
	);
}

function TextQuestionEditorWrapper({
	initialData,
	onSave,
	onCancel,
	isPending,
}: EditorWrapperProps) {
	const [data, setData] = useState({
		questionText: initialData?.questionText ?? "",
		options: (initialData?.options as
			| {
					minLength: number | null;
					maxLength: number | null;
					placeholder: string | null;
			  }
			| undefined) ?? {
			minLength: null,
			maxLength: null,
			placeholder: null,
		},
		required: initialData?.required ?? true,
	});

	const handleSave = () => {
		if (!data.questionText.trim()) return;
		onSave({
			questionText: data.questionText,
			options: {
				type: "text" as const,
				minLength: data.options.minLength,
				maxLength: data.options.maxLength,
				placeholder: data.options.placeholder,
			},
			required: data.required,
		});
	};

	return (
		<div className="space-y-4">
			<TextQuestionEditor
				data={{
					questionText: data.questionText,
					minLength: data.options.minLength,
					maxLength: data.options.maxLength,
					placeholder: data.options.placeholder,
					required: data.required,
				}}
				onChange={(newData) =>
					setData({
						questionText: newData.questionText,
						options: {
							minLength: newData.minLength,
							maxLength: newData.maxLength,
							placeholder: newData.placeholder ?? null,
						},
						required: newData.required,
					})
				}
				disabled={isPending}
			/>
			<div className="flex justify-end gap-2 pt-4 border-t">
				<Button variant="outline" onClick={onCancel} disabled={isPending}>
					Cancel
				</Button>
				<Button onClick={handleSave} disabled={isPending || !data.questionText.trim()}>
					{isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
					Save Question
				</Button>
			</div>
		</div>
	);
}
