import {
	closestCenter,
	DndContext,
	type DragEndEvent,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import {
	arrayMove,
	SortableContext,
	sortableKeyboardCoordinates,
	useSortable,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import type { LikertOptions, McqOptions, TextOptions } from "../lib/form-service";
import { QuestionPreview } from "./question-preview";

export type QuestionType = "mcq" | "likert" | "text";

export interface Question {
	id: string;
	questionText: string;
	type: QuestionType;
	orderIndex: number;
	required: boolean;
	options?: McqOptions | LikertOptions | TextOptions;
	shuffle?: boolean;
}

interface QuestionListProps {
	questions: Question[];
	onEdit?: (question: Question) => void;
	onDelete?: (questionId: string) => void;
	onReorder?: (questions: Question[]) => void;
	className?: string;
}

interface SortableQuestionItemProps {
	question: Question;
	index: number;
	onEdit?: (question: Question) => void;
	onDelete?: (questionId: string) => void;
	onReorder?: (questions: Question[]) => void;
}

const getQuestionTypeLabel = (type: QuestionType): string => {
	switch (type) {
		case "mcq":
			return "Multiple Choice";
		case "likert":
			return "Likert Scale";
		case "text":
			return "Text";
		default:
			return "Unknown";
	}
};

const getQuestionTypeBadgeStyle = (type: QuestionType): string => {
	switch (type) {
		case "mcq":
			return "bg-blue-100 text-blue-800";
		case "likert":
			return "bg-purple-100 text-purple-800";
		case "text":
			return "bg-green-100 text-green-800";
		default:
			return "bg-gray-100 text-gray-800";
	}
};

function SortableQuestionItem({
	question,
	index,
	onEdit,
	onDelete,
	onReorder,
}: SortableQuestionItemProps) {
	const sortable = useSortable({ id: question.id, disabled: !onReorder });
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = sortable;

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		zIndex: isDragging ? 50 : undefined,
	};

	const handleEdit = () => {
		onEdit?.(question);
	};

	const handleDelete = () => {
		onDelete?.(question.id);
	};

	return (
		<li
			ref={setNodeRef}
			style={style}
			data-testid={`question-item-${question.id}`}
			aria-label={`Question ${index + 1}: ${question.questionText}`}
			className={cn(isDragging && "opacity-50")}
		>
			<Card className="group overflow-hidden shadow-none">
				<CardContent className="p-4">
					<div className="flex items-start gap-3">
						<div className="flex shrink-0 items-start gap-2">
							{onReorder && (
								<Button
									variant="ghost"
									size="icon"
									className="h-7 w-7 shrink-0 cursor-grab active:cursor-grabbing"
									data-testid={`question-drag-handle-${question.id}`}
									aria-label={`Drag to reorder question ${index + 1}`}
									{...attributes}
									{...listeners}
								>
									<GripVertical className="h-4 w-4 text-muted-foreground" />
								</Button>
							)}
							<div className="flex size-8 shrink-0 items-center justify-center rounded-sm bg-muted text-sm font-medium">
								{index + 1}
							</div>
						</div>

						<div className="min-w-0 flex-1">
							<div className="flex items-start justify-between gap-2">
								<div className="flex items-center gap-2 flex-wrap">
									<p className="text-sm font-medium leading-relaxed">
										{question.questionText}
										{question.required && (
											<span className="ml-1 text-destructive" title="Required">
												*
											</span>
										)}
									</p>
									<Badge
										variant="secondary"
										className={cn(
											"text-xs font-medium",
											getQuestionTypeBadgeStyle(question.type),
										)}
										data-testid={`question-type-badge-${question.id}`}
									>
										{getQuestionTypeLabel(question.type)}
									</Badge>
									{!question.required && (
										<Badge variant="outline" className="text-xs font-medium">
											Optional
										</Badge>
									)}
								</div>
								<div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
									{onEdit && (
										<Button
											variant="ghost"
											size="icon"
											className="h-7 w-7"
											data-testid={`question-edit-btn-${question.id}`}
											aria-label={`Edit question ${index + 1}`}
											onClick={handleEdit}
										>
											<Pencil className="h-3.5 w-3.5" />
										</Button>
									)}
									{onDelete && (
										<Button
											variant="ghost"
											size="icon"
											className="h-7 w-7 text-destructive hover:text-destructive"
											data-testid={`question-delete-btn-${question.id}`}
											aria-label={`Delete question ${index + 1}`}
											onClick={handleDelete}
										>
											<Trash2 className="h-3.5 w-3.5" />
										</Button>
									)}
								</div>
							</div>
							<QuestionPreview question={question} />
						</div>
					</div>
				</CardContent>
			</Card>
		</li>
	);
}

export function QuestionList({
	questions,
	onEdit,
	onDelete,
	onReorder,
	className,
}: QuestionListProps) {
	const sensors = useSensors(
		useSensor(PointerSensor),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
	);

	const sortedQuestions = [...questions].sort((a, b) => a.orderIndex - b.orderIndex);

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;

		if (!over || active.id === over.id) {
			return;
		}

		const oldIndex = sortedQuestions.findIndex((q) => q.id === active.id);
		const newIndex = sortedQuestions.findIndex((q) => q.id === over.id);

		const reordered = arrayMove(sortedQuestions, oldIndex, newIndex);
		const updatedQuestions = reordered.map((q, index) => ({
			...q,
			orderIndex: index,
		}));

		onReorder?.(updatedQuestions);
	};

	if (questions.length === 0) {
		return (
			<div
				data-testid="question-list-empty"
				className={cn(
					"flex flex-col items-center justify-center rounded-lg border-[0.5px] border-dashed p-8 text-center",
					className,
				)}
			>
				<p className="text-sm text-muted-foreground">
					No questions yet. Add your first question to get started.
				</p>
			</div>
		);
	}

	if (!onReorder) {
		return (
			<ul
				data-testid="question-list"
				className={cn("space-y-3", className)}
				aria-label="Form questions"
			>
				{sortedQuestions.map((question, index) => (
					<SortableQuestionItem
						key={question.id}
						question={question}
						index={index}
						onEdit={onEdit}
						onDelete={onDelete}
						onReorder={onReorder}
					/>
				))}
			</ul>
		);
	}

	return (
		<DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
			<SortableContext
				items={sortedQuestions.map((q) => q.id)}
				strategy={verticalListSortingStrategy}
			>
				<ul
					data-testid="question-list"
					className={cn("space-y-3", className)}
					aria-label="Form questions"
				>
					{sortedQuestions.map((question, index) => (
						<SortableQuestionItem
							key={question.id}
							question={question}
							index={index}
							onEdit={onEdit}
							onDelete={onDelete}
							onReorder={onReorder}
						/>
					))}
				</ul>
			</SortableContext>
		</DndContext>
	);
}
