import { Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { QuestionRenderer } from "@/features/form/components/form-renderer/question-renderer";
import type { GetStudentFormByIdOutput } from "@/features/form/lib/form-service.shared";
import { cn } from "@/lib/utils";

type Question = GetStudentFormByIdOutput["questions"][number];

interface QuestionListProps {
	questions: readonly Question[];
	answers: Record<string, string | number>;
	onAnswerChange: (questionId: string, value: string | number) => void;
	requiredQuestions: readonly Question[];
	answeredRequired: boolean;
	isPending: boolean;
	disabled?: boolean;
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
	disabled = false,
	onSubmit,
	centered,
}: QuestionListProps) {
	const remaining = requiredQuestions.filter(
		(q) => answers[q.id] === undefined || answers[q.id] === "",
	).length;

	return (
		<div className="flex flex-col flex-1 min-h-0 min-w-0">
			<ScrollArea className="flex-1">
				<div className={cn("px-5 pt-5 pb-28 md:pb-8", centered && "mx-auto max-w-2xl")}>
					{questions.map((question, index) => (
						<div key={question.id} className="pt-4 pb-6 border-b last:border-none">
							<div className="mb-3 flex items-start gap-2.5">
								<span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
									{index + 1}
								</span>
								<div className="flex-1 min-w-0">
									<p className="text-sm font-medium leading-relaxed">
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
								disabled={disabled}
							/>
						</div>
					))}

					<div className="flex items-center justify-between gap-4 pt-5">
						<p className="text-sm text-muted-foreground">
							{answeredRequired
								? "All required questions answered"
								: `Answer all required questions (${remaining} remaining)`}
						</p>
						<Button
							onClick={onSubmit}
							disabled={!answeredRequired || isPending || disabled}
						>
							<Send className="size-4" />
							{isPending ? "Submitting..." : "Submit"}
						</Button>
					</div>
				</div>
			</ScrollArea>
		</div>
	);
}
