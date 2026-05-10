import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useMemo } from "react";

import {
	FormHeaderBar,
	FormLoadingError,
	FormNoFormSpecified,
	FormNoQuestions,
	FormProgressBar,
	FormSubmittedSuccess,
	QuestionList,
	ReadingMaterialSidebar,
	SubmissionReview,
} from "@/features/form/components/form-taker";
import { useFormDraft } from "@/features/form/components/form-taker/use-form-draft";
import { useRpcMutation, useRpcQuery } from "@/hooks/use-rpc-query";
import { FormRpc } from "@/server/rpc/form";

export const Route = createFileRoute("/dashboard/forms/take")({
	component: FormTakerPage,
});

type FormTakeSearch = {
	formId?: string;
};

function FormTakerPage() {
	const queryClient = useQueryClient();
	const navigate = useNavigate({ from: "/dashboard/forms/take" });
	const { formId } = useSearch({ from: "/dashboard/forms/take" }) as FormTakeSearch;
	const { answers, lastSaved, updateAnswer, clearDraft } = useFormDraft(formId ?? null);

	const { data, isLoading, error, rpcError } = useRpcQuery({
		...FormRpc.getStudentFormById(formId ?? ""),
		enabled: !!formId,
	});

	const submitMutation = useRpcMutation(FormRpc.submitFormResponse(), {
		operation: "submit form",
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: FormRpc.forms() });
			void navigate({ to: "/dashboard/forms/take", search: { formId } });
		},
	});

	const questionsData = (data as any)?.questions ?? [];
	const formData = (data as any)?.form;
	const sortedQuestions = useMemo(
		() => (questionsData as any[]).slice().sort((a: any, b: any) => a.orderIndex - b.orderIndex),
		[questionsData],
	);
	const readingMaterialSections = formData?.readingMaterialSections ?? [];
	const sortedReadingMaterialSections = useMemo(
		() =>
			(readingMaterialSections as any[])
				.slice()
				.sort((a: any, b: any) => a.startQuestion - b.startQuestion || a.endQuestion - b.endQuestion),
		[readingMaterialSections],
	);

	const totalQuestions = sortedQuestions.length;
	const hasReadingMaterial = sortedReadingMaterialSections.length > 0;
	const answeredCount = sortedQuestions.filter(
		(q) => answers[q.id] !== undefined && answers[q.id] !== "",
	).length;
	const requiredQuestions = sortedQuestions.filter((q) => q.required);
	const answeredRequired = requiredQuestions.every(
		(q) => answers[q.id] !== undefined && answers[q.id] !== "",
	);
	const progress = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

	if (!formId) return <FormNoFormSpecified backTo="/dashboard/forms/student" />;
	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-12">
				<Loader2 className="size-8 animate-spin text-muted-foreground" />
			</div>
		);
	}
	const loadError = error || rpcError;
	if (loadError || !data) {
		return (
			<FormLoadingError
				backTo="/dashboard/forms/student"
				message={typeof loadError === "string" ? loadError : undefined}
			/>
		);
	}

	if (data.submission) {
		const backTo =
			data.form.type === "post_test" ? "/dashboard/assignments" : "/dashboard/forms/student";
		return (
			<SubmissionReview
				title={data.form.title}
				submission={data.submission}
				questions={data.questions}
				backTo={backTo}
				type={data.form.type}
			/>
		);
	}

	const handleSubmit = () => {
		if (!answeredRequired) return;
		clearDraft();
		const stringAnswers: Record<string, string> = Object.fromEntries(
			Object.entries(answers).map(([k, v]) => [k, String(v)]),
		);
		submitMutation.mutate({ formId: formId!, answers: stringAnswers });
	};

	if (submitMutation.isPending) return <FormSubmittedSuccess />;
	if (totalQuestions === 0)
		return (
			<FormNoQuestions
				title={data.form.title}
				description={data.form.description ?? undefined}
			/>
		);

	return (
		<div className="flex flex-1 flex-col -mx-6 h-[calc(100%+3rem)] overflow-hidden">
			<FormHeaderBar
				title={data.form.title}
				description={data.form.description ?? undefined}
				answeredCount={answeredCount}
				totalQuestions={totalQuestions}
				lastSaved={lastSaved}
			/>
			<FormProgressBar progress={progress} />

			<div className="flex min-h-0 flex-1">
				{hasReadingMaterial && (
					<ReadingMaterialSidebar sections={sortedReadingMaterialSections} />
				)}

				<QuestionList
					questions={sortedQuestions}
					answers={answers}
					onAnswerChange={updateAnswer}
					requiredQuestions={requiredQuestions}
					answeredRequired={answeredRequired}
					isPending={submitMutation.isPending}
					onSubmit={handleSubmit}
					centered={!hasReadingMaterial}
				/>
			</div>
		</div>
	);
}
