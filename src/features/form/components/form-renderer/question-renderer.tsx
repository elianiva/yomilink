"use client";

import { AlertCircle } from "lucide-react";
import type { QuestionType } from "../question-list";
import { type LikertQuestionData, LikertRenderer } from "./likert-renderer";
import { type McqQuestionData, McqRenderer } from "./mcq-renderer";
import { type TextQuestionData, TextRenderer } from "./text-renderer";

export type QuestionData =
	| McqQuestionData
	| LikertQuestionData
	| TextQuestionData;

interface QuestionRendererProps {
	question: {
		id: string;
		questionText: string;
		type: QuestionType;
		required: boolean;
		options:
			| McqQuestionData["options"]
			| LikertQuestionData["options"]
			| TextQuestionData["options"];
		shuffle?: boolean;
	};
	value?: string | number;
	onChange: (questionId: string, value: string | number) => void;
	disabled?: boolean;
}

export function QuestionRenderer({
	question,
	value,
	onChange,
	disabled = false,
}: QuestionRendererProps) {
	const handleMcqChange = (questionId: string, val: string) => {
		onChange(questionId, val);
	};

	const handleLikertChange = (questionId: string, val: number) => {
		onChange(questionId, val);
	};

	const handleTextChange = (questionId: string, val: string) => {
		onChange(questionId, val);
	};

	switch (question.type) {
		case "mcq":
			return (
				<McqRenderer
					question={{
						id: question.id,
						questionText: question.questionText,
						type: "mcq",
						options: question.options as McqQuestionData["options"],
						shuffle: question.shuffle ?? false,
						required: question.required,
					}}
					value={value as string | undefined}
					onChange={handleMcqChange}
					disabled={disabled}
				/>
			);

		case "likert":
			return (
				<LikertRenderer
					question={{
						id: question.id,
						questionText: question.questionText,
						type: "likert",
						options: question.options as LikertQuestionData["options"],
						required: question.required,
					}}
					value={value as number | undefined}
					onChange={handleLikertChange}
					disabled={disabled}
				/>
			);

		case "text":
			return (
				<TextRenderer
					question={{
						id: question.id,
						questionText: question.questionText,
						type: "text",
						options: question.options as TextQuestionData["options"],
						required: question.required,
					}}
					value={value as string | undefined}
					onChange={handleTextChange}
					disabled={disabled}
				/>
			);

		default:
			return (
				<div className="flex items-center gap-2 rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
					<AlertCircle className="h-5 w-5" />
					<span>Unknown question type: {(question as QuestionData).type}</span>
				</div>
			);
	}
}
