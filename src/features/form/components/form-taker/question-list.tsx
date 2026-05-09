import { Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { QuestionRenderer } from "@/features/form/components/form-renderer/question-renderer";
import type { GetStudentFormByIdOutput } from "@/features/form/lib/form-service.shared";

type Question = GetStudentFormByIdOutput["questions"][number];

interface QuestionListProps {
	questions: readonly Question[];
	answers: Record<string, string | number>;
	onAnswerChange: (questionId: string, value: string | number) => void;
	requiredQuestions: readonly Question[];
	answeredRequired: boolean;
	isPending: boolean;
	onSubmit: () => void;
	centered?: boolean;
}

export function QuestionList({
	questions,
	answers,
	onAnswerChange,
	requiredQuestions,
	answeredRequired,
	isPending,
	onSubmit,
	centered,
}: QuestionListProps) {
	const remaining = requiredQuestions.filter(
		(q) => answers[q.id] === undefined || answers[q.id] === "",
	).length;

	return (
		<div className="flex-1 relative min-w-0">
			<div className="absolute inset-0">
				<ScrollArea className="h-full w-full">
					<div className={`${centered ? "mx-auto max-w-2xl" : ""} p-6 pb-32`}>
						{questions.map((question, index) => (
							<div key={question.id} className="py-6">
								<div className="mb-4 flex items-start gap-3">
									<span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
										{index + 1}
									</span>
									<div className="flex-1">
										<p className="text-base font-medium leading-relaxed">
											{question.questionText}
											{question.required && (
												<span className="ml-1 text-destructive">*</span>
											)}
										</p>
									</div>
								</div>
								<QuestionRenderer
									question={question}
									value={answers[question.id]}
									onChange={onAnswerChange}
								/>
							</div>
						))}

						<div className="flex items-center justify-between gap-4 pt-6">
							<p className="text-sm text-muted-foreground">
								{answeredRequired
									? "All required questions answered"
									: `Answer all required questions (${remaining} remaining)`}
							</p>
							<Button
								onClick={onSubmit}
								disabled={!answeredRequired || isPending}
								size="lg"
							>
								<Send className="size-4" />
								{isPending ? "Submitting..." : "Submit"}
							</Button>
						</div>
					</div>
				</ScrollArea>
			</div>
		</div>
	);
}
