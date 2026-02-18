"use client";

import {
	CheckCircle2,
	ChevronLeft,
	ChevronRight,
	Save,
	Send,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { QuestionRenderer } from "./form-renderer";
import type { QuestionType } from "./question-list";

export interface FormData {
	id: string;
	title: string;
	description?: string;
	type: "pre_test" | "post_test" | "registration" | "control";
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

interface FormTakerProps {
	form: FormData;
	questions: QuestionWithOptions[];
	answers?: Record<string, string | number>;
	onAnswerChange?: (questionId: string, value: string | number) => void;
	onSubmit?: (answers: Record<string, string | number>) => void;
	submitting?: boolean;
	className?: string;
}

function getDraftKey(formId: string): string {
	return `form-${formId}-draft`;
}

function loadDraft(formId: string): Record<string, string | number> | null {
	if (typeof window === "undefined") return null;
	try {
		const draft = localStorage.getItem(getDraftKey(formId));
		return draft ? JSON.parse(draft) : null;
	} catch {
		return null;
	}
}

function saveDraft(
	formId: string,
	answers: Record<string, string | number>,
): void {
	if (typeof window === "undefined") return;
	try {
		localStorage.setItem(getDraftKey(formId), JSON.stringify(answers));
	} catch {
		// Ignore storage errors
	}
}

function clearDraft(formId: string): void {
	if (typeof window === "undefined") return;
	try {
		localStorage.removeItem(getDraftKey(formId));
	} catch {
		// Ignore storage errors
	}
}

export function FormTaker({
	form,
	questions,
	answers: initialAnswers,
	onAnswerChange,
	onSubmit,
	submitting = false,
	className,
}: FormTakerProps) {
	const [currentIndex, setCurrentIndex] = useState(0);
	const [submitted, setSubmitted] = useState(false);
	const [answers, setAnswers] = useState<Record<string, string | number>>(
		() => {
			if (initialAnswers && Object.keys(initialAnswers).length > 0) {
				return initialAnswers;
			}
			return loadDraft(form.id) ?? {};
		},
	);
	const [lastSaved, setLastSaved] = useState<Date | null>(null);

	const sortedQuestions = [...questions].sort(
		(a, b) => a.orderIndex - b.orderIndex,
	);

	const currentQuestion = sortedQuestions[currentIndex];
	const totalQuestions = sortedQuestions.length;
	const progress =
		totalQuestions > 0 ? ((currentIndex + 1) / totalQuestions) * 100 : 0;

	const isFirstQuestion = currentIndex === 0;
	const isLastQuestion = currentIndex === totalQuestions - 1;

	useEffect(() => {
		const interval = setInterval(() => {
			if (Object.keys(answers).length > 0) {
				saveDraft(form.id, answers);
				setLastSaved(new Date());
			}
		}, 5000);

		return () => clearInterval(interval);
	}, [form.id, answers]);

	const canSubmit = () => {
		const requiredQuestions = sortedQuestions.filter((q) => q.required);
		const answeredRequired = requiredQuestions.every(
			(q) => answers[q.id] !== undefined && answers[q.id] !== "",
		);
		return answeredRequired;
	};

	const handlePrevious = () => {
		if (!isFirstQuestion) {
			setCurrentIndex((prev) => prev - 1);
		}
	};

	const handleNext = () => {
		if (!isLastQuestion) {
			setCurrentIndex((prev) => prev + 1);
		}
	};

	const handleSubmit = () => {
		if (canSubmit()) {
			clearDraft(form.id);
			setSubmitted(true);
			onSubmit?.(answers);
		}
	};

	const handleAnswerChange = (questionId: string, value: string | number) => {
		setAnswers((prev) => ({ ...prev, [questionId]: value }));
		onAnswerChange?.(questionId, value);
	};

	if (submitted) {
		return (
			<Card
				className={cn("overflow-hidden", className)}
				data-testid="form-taker"
			>
				<CardContent className="flex flex-col items-center justify-center py-12">
					<CheckCircle2 className="h-16 w-16 text-green-500" />
					<CardTitle className="mt-4 text-2xl">Form Submitted!</CardTitle>
					<p className="mt-2 text-muted-foreground">
						Thank you for your response.
					</p>
				</CardContent>
			</Card>
		);
	}

	if (totalQuestions === 0) {
		return (
			<Card
				className={cn("overflow-hidden", className)}
				data-testid="form-taker"
			>
				<CardHeader className="space-y-4 bg-muted/30">
					<CardTitle className="text-2xl font-bold">{form.title}</CardTitle>
					{form.description && (
						<p className="text-muted-foreground">{form.description}</p>
					)}
				</CardHeader>
				<CardContent className="py-12 text-center">
					<p className="text-muted-foreground">This form has no questions.</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className={cn("overflow-hidden", className)} data-testid="form-taker">
			<CardHeader className="space-y-4 bg-muted/30">
				<div className="space-y-2">
					<CardTitle className="text-2xl font-bold">{form.title}</CardTitle>
					{form.description && (
						<p className="text-muted-foreground">{form.description}</p>
					)}
				</div>

				<div className="space-y-2">
					<div className="flex items-center justify-between text-sm">
						<span className="text-muted-foreground">
							Question {currentIndex + 1} of {totalQuestions}
						</span>
						<span className="flex items-center gap-2 text-muted-foreground">
							{Math.round(progress)}% complete
							<span className="flex items-center gap-1">
								<Save className="h-3 w-3" />
								{lastSaved
									? `Saved ${lastSaved.toLocaleTimeString()}`
									: "Auto-save enabled"}
							</span>
						</span>
					</div>
					<div className="h-2 w-full overflow-hidden rounded-full bg-muted">
						<div
							className="h-full bg-primary transition-all duration-300"
							style={{ width: `${progress}%` }}
						/>
					</div>
				</div>
			</CardHeader>

			<Separator />

			<CardContent className="p-6">
				{currentQuestion && (
					<div className="space-y-6" data-testid={`question-${currentIndex}`}>
						<div className="flex items-start gap-3">
							<span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
								{currentIndex + 1}
							</span>
							<div className="flex-1 space-y-3">
								<p className="text-lg font-medium">
									{currentQuestion.questionText}
									{currentQuestion.required && (
										<span className="text-destructive"> *</span>
									)}
								</p>

								<QuestionRenderer
									question={currentQuestion}
									value={answers[currentQuestion.id]}
									onChange={handleAnswerChange}
								/>
							</div>
						</div>
					</div>
				)}
			</CardContent>

			<Separator />

			<div className="flex items-center justify-between p-4">
				<Button
					variant="outline"
					onClick={handlePrevious}
					disabled={isFirstQuestion}
					data-testid="previous-button"
				>
					<ChevronLeft className="mr-2 h-4 w-4" />
					Previous
				</Button>

				<div className="flex gap-2">
					{isLastQuestion ? (
						<Button
							onClick={handleSubmit}
							disabled={!canSubmit() || submitting}
							data-testid="submit-button"
						>
							<Send className="mr-2 h-4 w-4" />
							{submitting ? "Submitting..." : "Submit"}
						</Button>
					) : (
						<Button
							onClick={handleNext}
							disabled={isLastQuestion}
							data-testid="next-button"
						>
							Next
							<ChevronRight className="ml-2 h-4 w-4" />
						</Button>
					)}
				</div>
			</div>
		</Card>
	);
}
