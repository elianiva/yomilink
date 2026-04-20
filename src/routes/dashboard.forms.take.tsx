import { useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { ArrowLeftIcon, CheckCircle2Icon, Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
	FormTaker,
	type FormData,
	type QuestionWithOptions,
} from "@/features/form/components/form-taker";
import { useRpcMutation, useRpcQuery } from "@/hooks/use-rpc-query";
import { FormRpc } from "@/server/rpc/form";

export const Route = createFileRoute("/dashboard/forms/take")({
	component: FormTakerPage,
});

type FormTakeSearch = {
	formId?: string;
	returnTo?: string;
};

function mapQuestionData(questions: Array<{
	id: string;
	questionText: string;
	type: "mcq" | "likert" | "text";
	orderIndex: number;
	required: boolean;
	options: unknown;
}>): QuestionWithOptions[] {
	return questions.map((q) => {
		let transformedOptions: QuestionWithOptions["options"];
		let shuffle: boolean | undefined;

		if (q.type === "mcq" && q.options && !Array.isArray(q.options)) {
			const mcqOptions = q.options as {
				type: "mcq";
				options: { id: string; text: string }[];
				shuffle: boolean;
			};
			transformedOptions = mcqOptions.options;
			shuffle = mcqOptions.shuffle;
		} else if (q.type === "likert" && q.options) {
			transformedOptions = q.options as {
				type: "likert";
				scaleSize: number;
				labels: { [key: string]: string };
			};
		} else if (q.type === "text" && q.options) {
			transformedOptions = q.options as {
				type: "text";
				minLength?: number;
				maxLength?: number;
				placeholder?: string;
			};
		} else if (q.type === "mcq" && Array.isArray(q.options)) {
			transformedOptions = q.options as { id: string; text: string }[];
		} else {
			transformedOptions = [];
		}

		return {
			id: q.id,
			questionText: q.questionText,
			type: q.type,
			orderIndex: q.orderIndex,
			required: q.required,
			options: transformedOptions,
			shuffle,
		};
	});
}

function getSubmittedAnswerText(question: QuestionWithOptions, rawAnswer: unknown): string {
	if (rawAnswer === null || rawAnswer === undefined) return "No answer";

	if (question.type === "mcq") {
		if (!Array.isArray(question.options)) return "No answer";
		const selected = question.options.find((option) => option.id === rawAnswer);
		return selected?.text ?? String(rawAnswer);
	}

	if (question.type === "likert") {
		if (Array.isArray(question.options) || question.options.type !== "likert") {
			return String(rawAnswer);
		}
		return question.options.labels[String(rawAnswer)] ?? String(rawAnswer);
	}

	return String(rawAnswer);
}

function FormTakerPage() {
	const navigate = useNavigate({ from: "/dashboard/forms/take" });
	const queryClient = useQueryClient();
	const searchParams = useSearch({ from: "/dashboard/forms/take" }) as FormTakeSearch;
	const formId = searchParams.formId;
	const returnTo = searchParams.returnTo;

	const { data, isLoading, error } = useRpcQuery({
		...FormRpc.getStudentFormById(formId ?? ""),
		enabled: !!formId,
	});
	const submitMutation = useRpcMutation(FormRpc.submitFormResponse(), {
		operation: "submit form",
		showSuccess: true,
		successMessage: "Form submitted successfully!",
		onSuccess: async () => {
			// Invalidate related queries to refresh status
			await queryClient.invalidateQueries({ queryKey: FormRpc.forms() });
			if (data?.form.type === "post_test") {
				void navigate({ to: "/dashboard/assignments" });
				return;
			}

			if (returnTo) {
				window.location.href = returnTo;
			} else {
				void navigate({ to: "/dashboard/forms/student" });
			}
		},
	});

	const handleBack = () => {
		void navigate({
			to:
				data?.form.type === "post_test" && data.submission
					? "/dashboard/assignments"
					: "/dashboard/forms/student",
		});
	};

	if (!formId) {
		return (
			<div className="flex flex-col items-center justify-center py-12">
				<p className="text-muted-foreground">No form specified</p>
				<Button variant="link" onClick={handleBack} className="mt-2">
					Go back to forms
				</Button>
			</div>
		);
	}

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-12">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	if (error || !data) {
		return (
			<div className="flex flex-col items-center justify-center py-12">
				<p className="text-destructive">Failed to load form</p>
				<Button variant="link" onClick={handleBack} className="mt-2">
					Go back to forms
				</Button>
			</div>
		);
	}

	const questionData = mapQuestionData(data.questions);

	if (data.submission) {
		const scorePercentage =
			data.submission.score === null ? null : Math.round(data.submission.score * 100);
		const backTo =
			data.form.type === "post_test" ? "/dashboard/assignments" : "/dashboard/forms/student";

		return (
			<div className="container mx-auto max-w-2xl px-4 py-8">
				<Button variant="ghost" size="sm" asChild className="mb-4">
					<Link to={backTo}>
						<ArrowLeftIcon className="mr-2 h-4 w-4" />
						Back
					</Link>
				</Button>

				<Card className="overflow-hidden py-0">
					<CardHeader className="space-y-2 border-b bg-muted/30 pt-4">
						<div className="flex items-center gap-2">
							<CheckCircle2Icon className="h-5 w-5 text-emerald-600" />
							<Badge className="bg-emerald-600 text-white">Completed</Badge>
						</div>
						<CardTitle className="text-2xl">{data.form.title}</CardTitle>
						<CardDescription>
							You&apos;ve completed this form. Retakes are disabled.
						</CardDescription>
					</CardHeader>
					<CardContent className="pb-6">
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
									{data.submission.correctCount}/{data.submission.totalQuestions}
								</p>
							</div>
						</div>
						<div className="rounded-b-xl border border-t-0 bg-background py-2 px-3 text-sm text-muted-foreground">
							Submitted at{" "}
							{data.submission.submittedAt
								? new Date(data.submission.submittedAt).toLocaleString()
								: "unknown"}
							.
						</div>
						<div className="mt-4 space-y-3">
							<h3 className="font-semibold">Your answers</h3>
							{questionData.map((question, index) => (
								<div key={question.id} className="rounded-lg border p-3">
									<p className="text-sm text-muted-foreground">Question {index + 1}</p>
									<p className="font-medium">{question.questionText}</p>
									<p className="mt-1 text-sm">
										{getSubmittedAnswerText(question, data.submission.answers[question.id])}
									</p>
								</div>
							))}
						</div>
						<Button asChild className="w-full mt-4">
							<Link to={backTo}>
								{data.form.type === "post_test"
									? "Back to assignments"
									: "Back to forms"}
							</Link>
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	const formData: FormData = {
		id: data.form.id,
		title: data.form.title,
		description: data.form.description ?? undefined,
		type: data.form.type,
		audience: data.form.audience,
		status: data.form.status,
		readingMaterialSections: data.form.readingMaterialSections
			? data.form.readingMaterialSections.map((section) => ({ ...section }))
			: null,
	};

	const handleSubmit = (answers: Record<string, string | number>) => {
		if (!formId) return;
		submitMutation.mutate({
			formId,
			answers,
		});
	};

	return (
		<div className="container max-w-2xl mx-auto py-8 px-4">
			<Button variant="ghost" size="sm" onClick={handleBack} className="mb-4">
				<ArrowLeftIcon className="mr-2 h-4 w-4" />
				Back to Forms
			</Button>

			<FormTaker
				form={formData}
				questions={questionData}
				onSubmit={handleSubmit}
				submitting={submitMutation.isPending}
			/>
		</div>
	);
}
