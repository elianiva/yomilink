import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useSearch } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useEffect, useRef } from "react";

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
import type { GetStudentFormByIdOutput } from "@/features/form/lib/form-service.shared";
import { useRpcMutation, useRpcQuery } from "@/hooks/use-rpc-query";
import { FormRpc } from "@/server/rpc/form";
import { ProfileRpc } from "@/server/rpc/profile";

export const Route = createFileRoute("/dashboard/forms/take")({
	component: FormTakerPage,
});

type FormTakeSearch = {
	formId?: string;
	redirectBack?: string;
};

function FormTakerPage() {
	const queryClient = useQueryClient();
	const { formId, redirectBack } = useSearch({ from: "/dashboard/forms/take" }) as FormTakeSearch;
	const { data: me } = useRpcQuery(ProfileRpc.getMe());
	const userId = me?.id;
	const { answers, lastSaved, updateAnswer, clearDraft } = useFormDraft(userId, formId ?? null);

	const { data, isLoading, error, rpcError } = useRpcQuery({
		...FormRpc.getStudentFormById(formId ?? ""),
		enabled: !!formId,
	});

	const submitMutation = useRpcMutation(FormRpc.submitFormResponse(), {
		operation: "submit form",
		onSuccess: async () => {
			// Invalidate both forms and assignment/learner-map caches
			// so assignment flow page reflects phase completion immediately
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: FormRpc.forms() }),
				queryClient.invalidateQueries({ queryKey: ["learner-maps"] }),
			]);
		},
	});

	const questions: GetStudentFormByIdOutput["questions"] = data?.questions ?? [];
	const readingMaterialSections = data?.form?.readingMaterialSections ?? [];
	const materialImages = data?.materialImages ?? [];

	const totalQuestions = questions.length;
	const hasReadingMaterial =
		(readingMaterialSections != null && readingMaterialSections.length > 0) ||
		materialImages.length > 0;
	const requiredQuestions = questions.filter((q) => q.required);
	const answeredRequired = requiredQuestions.every(
		(q) => answers[q.id] !== undefined && answers[q.id] !== "",
	);
	const answeredCount = questions.filter(
		(q) => answers[q.id] !== undefined && answers[q.id] !== "",
	).length;
	const progress = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

	const startTimeRef = useRef<number>(Date.now());

	useEffect(() => {
		if (!formId || !userId) return;
		const key = `form-start-${userId}-${formId}`;
		const stored = localStorage.getItem(key);
		if (stored) {
			startTimeRef.current = Number(stored);
		} else {
			startTimeRef.current = Date.now();
			localStorage.setItem(key, String(startTimeRef.current));
		}

		if (data?.submission) {
			localStorage.removeItem(key);
		}
	}, [formId, userId, data?.submission]);

	if (!formId) return <FormNoFormSpecified backTo={redirectBack || "/dashboard/forms/student"} />;
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
				backTo={redirectBack || "/dashboard/forms/student"}
				message={typeof loadError === "string" ? loadError : undefined}
			/>
		);
	}

	const form = data.form;
	const submission = data.submission;

	if (submission) {
		const backTo =
			redirectBack ||
			(form.type === "post_test" ? "/dashboard/assignments" : "/dashboard/forms/student");
		return (
			<SubmissionReview
				title={form.title}
				submission={submission}
				questions={questions}
				backTo={backTo}
				type={form.type}
			/>
		);
	}

	const handleSubmit = () => {
		if (!answeredRequired || !formId || !userId) return;
		const timeSpentSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);
		clearDraft();
		localStorage.removeItem(`form-start-${userId}-${formId}`);
		const stringAnswers: Record<string, string> = Object.fromEntries(
			Object.entries(answers).map(([k, v]) => [k, String(v)]),
		);
		submitMutation.mutate({ formId, answers: stringAnswers, timeSpentSeconds });
	};

	if (submitMutation.isPending || (submitMutation.isSuccess && !submission))
		return <FormSubmittedSuccess />;
	if (totalQuestions === 0)
		return <FormNoQuestions title={form.title} description={form.description ?? undefined} />;

	return (
		<div className="flex h-full min-h-0 flex-col -mx-6 overflow-hidden">
			<FormHeaderBar
				title={form.title}
				description={form.description ?? undefined}
				answeredCount={answeredCount}
				totalQuestions={totalQuestions}
				lastSaved={lastSaved}
			/>
			<FormProgressBar progress={progress} />

			<div className="flex min-h-0 flex-1">
				{hasReadingMaterial && (
					<ReadingMaterialSidebar
						sections={readingMaterialSections}
						materialImages={materialImages}
					/>
				)}

				<QuestionList
					questions={questions}
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
