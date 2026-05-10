import { useCallback } from "react";

import { LikertQuestionEditor } from "@/features/form/components/likert-question-editor";
import type { LikertQuestionData } from "@/features/form/components/likert-question-editor";
import { McqQuestionEditor } from "@/features/form/components/mcq-question-editor";
import type { McqQuestionData } from "@/features/form/components/mcq-question-editor";
import { TextQuestionEditor } from "@/features/form/components/text-question-editor";
import type { TextQuestionData } from "@/features/form/components/text-question-editor";
import type {
	LikertOptions,
	McqOptions,
	TextOptions,
} from "@/features/form/lib/form-service.shared";

import type { QuestionWithOptions } from "./types";

interface InlineEditorProps {
	question: QuestionWithOptions;
	onChange: (data: {
		questionText: string;
		options: McqOptions | LikertOptions | TextOptions;
		required: boolean;
	}) => void;
	disabled?: boolean;
}

export function InlineEditor({ question, onChange, disabled }: InlineEditorProps) {
	const handleMcqChange = useCallback(
		(data: McqQuestionData) => {
			onChange({
				questionText: data.questionText,
				options: {
					type: "mcq" as const,
					options: data.options,
					correctOptionIds: data.correctOptionIds,
					shuffle: data.shuffle,
				},
				required: data.required,
			});
		},
		[onChange],
	);

	const handleLikertChange = useCallback(
		(data: LikertQuestionData) => {
			onChange({
				questionText: data.questionText,
				options: {
					type: "likert" as const,
					scaleSize: data.scaleSize,
					labels: data.labels,
				},
				required: data.required,
			});
		},
		[onChange],
	);

	const handleTextChange = useCallback(
		(data: TextQuestionData) => {
			onChange({
				questionText: data.questionText,
				options: {
					type: "text" as const,
					minLength: data.minLength ?? undefined,
					maxLength: data.maxLength ?? undefined,
					placeholder: data.placeholder ?? undefined,
				},
				required: data.required,
			});
		},
		[onChange],
	);

	if (question.type === "mcq") {
		const opts = question.options as McqOptions | undefined;
		return (
			<McqQuestionEditor
				data={{
					questionText: question.questionText,
					options: [...(opts?.options ?? [])],
					correctOptionIds: [...(opts?.correctOptionIds ?? [])],
					shuffle: opts?.shuffle ?? false,
					required: question.required,
				}}
				onChange={handleMcqChange}
				disabled={disabled}
			/>
		);
	}

	if (question.type === "likert") {
		const opts = question.options as LikertOptions | undefined;
		return (
			<LikertQuestionEditor
				data={{
					questionText: question.questionText,
					scaleSize: opts?.scaleSize ?? 5,
					labels: opts?.labels ?? {},
					required: question.required,
				}}
				onChange={handleLikertChange}
				disabled={disabled}
			/>
		);
	}

	if (question.type === "text") {
		const opts = question.options as TextOptions | undefined;
		return (
			<TextQuestionEditor
				data={{
					questionText: question.questionText,
					minLength: opts?.minLength ?? null,
					maxLength: opts?.maxLength ?? null,
					placeholder: opts?.placeholder ?? null,
					required: question.required,
				}}
				onChange={handleTextChange}
				disabled={disabled}
			/>
		);
	}

	return null;
}
