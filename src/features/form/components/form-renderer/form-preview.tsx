"use client";

import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { QuestionType } from "../question-list";
import { QuestionRenderer } from "./question-renderer";

export interface FormData {
	id: string;
	title: string;
	description?: string;
	type:
		| "pre_test"
		| "post_test"
		| "delayed_test"
		| "registration"
		| "tam"
		| "control";
	status: "draft" | "published";
}

export interface QuestionWithOptions {
	id: string;
	questionText: string;
	type: QuestionType;
	orderIndex: number;
	required: boolean;
	options:
		| { readonly id: string; readonly text: string }[]
		| {
				readonly type: "likert";
				readonly scaleSize: number;
				readonly labels: { readonly [key: string]: string };
		  }
		| {
				readonly type: "text";
				readonly minLength?: number;
				readonly maxLength?: number;
				readonly placeholder?: string;
		  };
	shuffle?: boolean;
}

interface FormPreviewProps {
	form: FormData;
	questions: QuestionWithOptions[];
	answers?: Record<string, string | number>;
	onAnswerChange?: (questionId: string, value: string | number) => void;
	className?: string;
}

export function FormPreview({
	form,
	questions,
	answers = {},
	onAnswerChange,
	className,
}: FormPreviewProps) {
	const sortedQuestions = [...questions].sort(
		(a, b) => a.orderIndex - b.orderIndex,
	);

	const handleAnswerChange = (questionId: string, value: string | number) => {
		onAnswerChange?.(questionId, value);
	};

	return (
		<Card
			className={cn("overflow-hidden", className)}
			data-testid="form-preview"
		>
			<CardHeader className="space-y-4 bg-muted/30">
				<div className="flex items-center gap-2">
					<Eye className="h-5 w-5 text-primary" />
					<span className="text-sm font-medium text-primary">Preview Mode</span>
				</div>

				<div className="space-y-2">
					<CardTitle className="text-2xl font-bold">{form.title}</CardTitle>
					{form.description && (
						<p className="text-muted-foreground">{form.description}</p>
					)}
				</div>

				<div className="flex items-center gap-2">
					<span
						className={cn(
							"rounded-full px-3 py-1 text-xs font-medium",
							form.status === "published"
								? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
								: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
						)}
					>
						{form.status === "published" ? "Published" : "Draft"}
					</span>
					<span className="text-xs text-muted-foreground">
						{form.type.replace("_", " ")}
					</span>
				</div>
			</CardHeader>

			<Separator />

			<CardContent className="space-y-8 p-6">
				{sortedQuestions.length === 0 ? (
					<div className="py-12 text-center">
						<EyeOff className="mx-auto h-12 w-12 text-muted-foreground/50" />
						<p className="mt-4 text-muted-foreground">
							No questions have been added yet
						</p>
						<p className="text-sm text-muted-foreground">
							Add questions to see them in the preview
						</p>
					</div>
				) : (
					sortedQuestions.map((question, index) => (
						<div
							key={question.id}
							className="space-y-4"
							data-testid={`preview-question-${index}`}
						>
							<div className="flex items-start gap-2">
								<span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
									{index + 1}
								</span>
								<div className="flex-1 space-y-2">
									<p className="font-medium">
										{question.questionText}
										{question.required && (
											<span className="text-destructive"> *</span>
										)}
									</p>

									<QuestionRenderer
										question={question}
										value={answers[question.id]}
										onChange={handleAnswerChange}
									/>
								</div>
							</div>

							{index < sortedQuestions.length - 1 && <Separator />}
						</div>
					))
				)}
			</CardContent>
		</Card>
	);
}

interface FormPreviewToggleProps {
	previewMode: boolean;
	onToggle: () => void;
	className?: string;
}

export function FormPreviewToggle({
	previewMode,
	onToggle,
	className,
}: FormPreviewToggleProps) {
	return (
		<Button
			type="button"
			variant={previewMode ? "default" : "outline"}
			size="sm"
			onClick={onToggle}
			className={cn("gap-2", className)}
			data-testid="preview-toggle"
		>
			{previewMode ? (
				<>
					<EyeOff className="h-4 w-4" />
					Exit Preview
				</>
			) : (
				<>
					<Eye className="h-4 w-4" />
					Preview
				</>
			)}
		</Button>
	);
}
