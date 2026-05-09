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
import { cn } from "@/lib/utils";
import { FormRpc } from "@/server/rpc/form";

export const Route = createFileRoute("/dashboard/forms/take")({
	component: FormTakerPage,
});

type FormTakeSearch = {
	formId?: string;
	returnTo?: string;
};

function FormTakerPage() {
	const queryClient = useQueryClient();
	const navigate = useNavigate({ from: "/dashboard/forms/take" });
	const { formId, returnTo } = useSearch({ from: "/dashboard/forms/take" }) as FormTakeSearch;
	const { answers, lastSaved, updateAnswer, clearDraft } = useFormDraft(formId ?? null);

	const { data, isLoading, error } = useRpcQuery({
		...FormRpc.getStudentFormById(formId ?? ""),
		enabled: !!formId,
	});

	const submitMutation = useRpcMutation(FormRpc.submitFormResponse(), {
		operation: "submit form",
		showSuccess: true,
		successMessage: "Form submitted successfully!",
		onSuccess: async () => {
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

	const sortedQuestions = useMemo(
		() => [...(data?.questions ?? [])].sort((a, b) => a.orderIndex - b.orderIndex),
		[data?.questions],
	);
	const sortedReadingMaterialSections = useMemo(
		() =>
			[...(data?.form.readingMaterialSections ?? [])].sort(
				(a, b) => a.startQuestion - b.startQuestion || a.endQuestion - b.endQuestion,
			),
		[data?.form.readingMaterialSections],
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

	// Empty / loading / error states
	if (!formId) return <FormNoFormSpecified backTo="/dashboard/forms/student" />;
	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-12">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
			</div>
		);
	}
	if (error || !data) return <FormLoadingError backTo="/dashboard/forms/student" />;

	// Already submitted view
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
		submitMutation.mutate({ formId: formId!, answers });
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
		<div className="flex flex-1 flex-col -mx-6 h-[calc(100%+3rem)]">
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
				/>
			</div>
		</div>
	);
}
