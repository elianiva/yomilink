"use client";

import { GripVertical, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type QuestionType = "mcq" | "likert" | "text";

export interface Question {
	id: string;
	questionText: string;
	type: QuestionType;
	orderIndex: number;
	required: boolean;
}

interface QuestionListProps {
	questions: Question[];
	onEdit?: (question: Question) => void;
	onDelete?: (questionId: string) => void;
	onReorder?: (questionId: string, newIndex: number) => void;
	className?: string;
}

const questionTypeLabels: Record<QuestionType, string> = {
	mcq: "Multiple Choice",
	likert: "Likert Scale",
	text: "Text",
};

const questionTypeColors: Record<QuestionType, string> = {
	mcq: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
	likert:
		"bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
	text: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
};

export function QuestionList({
	questions,
	onEdit,
	onDelete,
	onReorder,
	className,
}: QuestionListProps) {
	const sortedQuestions = [...questions].sort(
		(a, b) => a.orderIndex - b.orderIndex,
	);

	const handleEdit = (question: Question) => {
		onEdit?.(question);
	};

	const handleDelete = (questionId: string) => {
		onDelete?.(questionId);
	};

	if (questions.length === 0) {
		return (
			<div
				data-testid="question-list-empty"
				className={cn(
					"flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center",
					className,
				)}
			>
				<p className="text-sm text-muted-foreground">
					No questions yet. Add your first question to get started.
				</p>
			</div>
		);
	}

	return (
		<ul
			data-testid="question-list"
			className={cn("space-y-3", className)}
			aria-label="Form questions"
		>
			{sortedQuestions.map((question, index) => (
				<li
					key={question.id}
					data-testid={`question-item-${question.id}`}
					aria-label={`Question ${index + 1}: ${question.questionText}`}
				>
					<Card className="group">
						<CardContent className="flex items-start gap-3 p-4">
							{onReorder && (
								<Button
									variant="ghost"
									size="icon"
									className="mt-0.5 h-8 w-8 cursor-grab active:cursor-grabbing"
									data-testid={`question-drag-handle-${question.id}`}
									aria-label={`Drag to reorder question ${index + 1}`}
									onClick={() => {}}
								>
									<GripVertical className="h-4 w-4 text-muted-foreground" />
								</Button>
							)}
							<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium">
								{index + 1}
							</div>
							<div className="min-w-0 flex-1">
								<div className="flex items-start justify-between gap-2">
									<p className="text-sm font-medium leading-relaxed">
										{question.questionText}
										{question.required && (
											<span className="ml-1 text-destructive" title="Required">
												*
											</span>
										)}
									</p>
								</div>
								<div className="mt-2 flex items-center gap-2">
									<Badge
										variant="secondary"
										className={cn("text-xs", questionTypeColors[question.type])}
										data-testid={`question-type-badge-${question.id}`}
									>
										{questionTypeLabels[question.type]}
									</Badge>
									{!question.required && (
										<Badge variant="outline" className="text-xs">
											Optional
										</Badge>
									)}
								</div>
							</div>
							<div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
								{onEdit && (
									<Button
										variant="ghost"
										size="icon"
										className="h-8 w-8"
										data-testid={`question-edit-btn-${question.id}`}
										aria-label={`Edit question ${index + 1}`}
										onClick={() => handleEdit(question)}
									>
										<Pencil className="h-4 w-4" />
									</Button>
								)}
								{onDelete && (
									<Button
										variant="ghost"
										size="icon"
										className="h-8 w-8 text-destructive hover:text-destructive"
										data-testid={`question-delete-btn-${question.id}`}
										aria-label={`Delete question ${index + 1}`}
										onClick={() => handleDelete(question.id)}
									>
										<Trash2 className="h-4 w-4" />
									</Button>
								)}
							</div>
						</CardContent>
					</Card>
				</li>
			))}
		</ul>
	);
}
