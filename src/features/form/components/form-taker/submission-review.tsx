import { Link } from "@tanstack/react-router";
import { ArrowLeftIcon, CheckCircle2Icon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { GetStudentFormByIdOutput } from "@/features/form/lib/form-service.shared";

type Submission = NonNullable<GetStudentFormByIdOutput["submission"]>;

function formatAnswer(rawAnswer: unknown): string {
	if (typeof rawAnswer === "string") return rawAnswer;
	if (typeof rawAnswer === "number") return String(rawAnswer);
	if (typeof rawAnswer === "boolean") return String(rawAnswer);
	return JSON.stringify(rawAnswer);
}

export function getSubmittedAnswerText(
	question: GetStudentFormByIdOutput["questions"][number],
	rawAnswer: unknown,
): string {
	if (rawAnswer === null || rawAnswer === undefined) return "No answer";
	const options = question.options;

	if (question.type === "mcq" && options && "options" in options) {
		const selected = options.options.find((opt) => opt.id === rawAnswer);
		return selected?.text ?? formatAnswer(rawAnswer);
	}

	if (question.type === "likert" && options && "labels" in options) {
		return options.labels[formatAnswer(rawAnswer)] ?? formatAnswer(rawAnswer);
	}

	return formatAnswer(rawAnswer);
}

interface SubmissionReviewProps {
	title: string;
	submission: Submission;
	questions: GetStudentFormByIdOutput["questions"];
	backTo: string;
	type: string;
}

export function SubmissionReview({
	title,
	submission,
	questions,
	backTo,
	type,
}: SubmissionReviewProps) {
	const scorePercentage = submission.score === null ? null : Math.round(submission.score * 100);

	return (
		<div className="container mx-auto max-w-2xl px-4 py-8">
			<Button variant="ghost" size="sm" asChild className="mb-4">
				<Link to={backTo}>
					<ArrowLeftIcon className="mr-2 size-4" />
					Back
				</Link>
			</Button>

			<Card className="overflow-hidden py-0">
				<CardHeader className="space-y-2 border-b bg-muted/30 pt-4">
					<div className="flex items-center gap-2">
						<CheckCircle2Icon className="size-5 text-emerald-600" />
						<Badge className="bg-emerald-600 text-white">Completed</Badge>
					</div>
					<CardTitle className="text-2xl">{title}</CardTitle>
					<CardDescription>
						You&apos;ve completed this form. Retakes are disabled.
					</CardDescription>
				</CardHeader>
				<CardContent className="p-3">
					<div className="grid sm:grid-cols-2">
						<div className="rounded-tl-xl border border-r-0 bg-muted/20 p-3">
							<p className="text-sm text-muted-foreground">Score</p>
							<p className="text-2xl font-semibold">
								{scorePercentage === null ? "Submitted" : `${scorePercentage}%`}
							</p>
						</div>
						<div className="rounded-tr-xl border bg-muted/20 p-3">
							<p className="text-sm text-muted-foreground">Correct answers</p>
							<p className="text-2xl font-semibold">
								{submission.correctCount}/{submission.totalQuestions}
							</p>
						</div>
					</div>
					<div
						suppressHydrationWarning
						className="rounded-b-xl border border-t-0 bg-background py-2 px-3 text-sm text-muted-foreground"
					>
						Submitted at{" "}
						<span suppressHydrationWarning>
							{submission.submittedAt
								? new Date(submission.submittedAt).toLocaleString()
								: "unknown"}
						</span>
						.
					</div>
					<div className="mt-4 space-y-3">
						<h3 className="font-semibold">Your answers</h3>
						{questions.map((question, index) => (
							<div key={question.id} className="rounded-lg border p-3">
								<p className="text-sm text-muted-foreground">
									Question {index + 1}
								</p>
								<p className="font-medium">{question.questionText}</p>
								<p className="mt-1 text-sm">
									{getSubmittedAnswerText(
										question,
										submission.answers[question.id],
									)}
								</p>
							</div>
						))}
					</div>
					<Button asChild className="w-full mt-4">
						<Link to={backTo}>
							{type === "post_test" ? "Back to assignments" : "Back to forms"}
						</Link>
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}
