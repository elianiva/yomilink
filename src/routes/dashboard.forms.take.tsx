import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useMachine } from "@xstate/react";
import { Loader2 } from "lucide-react";
import { useEffect, useRef } from "react";

import { Guard } from "@/features/auth/components/Guard";
import {
	FormHeaderBar,
	FormLoadingError,
	FormNoFormSpecified,
	FormNoQuestions,
	FormProgressBar,
	QuestionList,
	ReadingMaterialSidebar,
	SubmissionReview,
} from "@/features/form/components/form-taker";
import { useFormDraft } from "@/features/form/components/form-taker/use-form-draft";
import { useRpcMutation, useRpcQuery } from "@/hooks/use-rpc-query";
import { formTakerMachine } from "@/machines/form-taker.machine";
import { FormRpc } from "@/server/rpc/form";
import { ProfileRpc } from "@/server/rpc/profile";

export const Route = createFileRoute("/dashboard/forms/take")({
	component: () => (
		<Guard roles={["student"]}>
			<FormsTakePage />
		</Guard>
	),
});

type FormTakeSearch = {
	formId?: string;
	redirectBack?: string;
};

function FormsTakePage() {
	const queryClient = useQueryClient();
	const { formId, redirectBack } = useSearch({ from: "/dashboard/forms/take" }) as FormTakeSearch;
	const { data: me } = useRpcQuery(ProfileRpc.getMe());
	const userId = me?.id;
	const {
		answers: draftAnswers,
		updateAnswer: updateDraft,
		clearDraft,
	} = useFormDraft(userId, formId ?? null);

	const { data, isLoading, error, rpcError } = useRpcQuery({
		...FormRpc.getStudentFormById(formId ?? ""),
		enabled: !!formId,
	});

	const submitMutation = useRpcMutation(
		{
			...FormRpc.submitFormResponse(),
			onSuccess: (data) => {
				if (!data.success) {
					send({ type: "SUBMIT_ERROR" });
					return;
				}
				void queryClient.invalidateQueries({ queryKey: FormRpc.forms() });
				void queryClient.invalidateQueries({ queryKey: ["learner-maps"] });
			},
			onError: () => {
				send({ type: "SUBMIT_ERROR" });
			},
		},
		{
			operation: "submit form",
		},
	);

	const [snapshot, send] = useMachine(formTakerMachine);

	const questions = snapshot.context.questions;
	const readingMaterialSections = snapshot.context.form?.readingMaterialSections ?? [];
	const materialImages = snapshot.context.materialImages;
	const answers = snapshot.matches("submitted") ? {} : draftAnswers;

	const isSubmitting = snapshot.matches("submitting");

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

	// Sync query result into machine on initial load or after submit.
	// Must NOT depend on `snapshot` (changes every render = loop).
	// Use derived booleans instead.
	const isLoadingState = snapshot.matches("loading");
	const isSubmittingState = snapshot.matches("submitting");
	const isSubmittedState = snapshot.matches("submitted");

	useEffect(() => {
		if (!data) return;
		if (isLoadingState) {
			send({ type: "FORM.LOADED", data });
		}
	}, [data, isLoadingState, send]);

	// Only send FORM.LOADED when refetched data has a submission (avoids resetting during submit)
	useEffect(() => {
		if (!data?.submission) return;
		if (isSubmittingState || isSubmittedState) {
			send({ type: "FORM.LOADED", data });
		}
	}, [data, isSubmittingState, isSubmittedState, send]);

	useEffect(() => {
		const loadError = error || rpcError;
		if (loadError && isLoadingState) {
			send({
				type: "FORM.LOAD_ERROR",
				error: typeof loadError === "string" ? loadError : "Failed to load form",
			});
		}
	}, [error, rpcError, isLoadingState, send]);

	// Track start time

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
		if (isSubmittedState) {
			localStorage.removeItem(key);
		}
	}, [formId, userId, isSubmittedState]);

	const handleAnswer = (questionId: string, value: string | number) => {
		send({ type: "ANSWER", questionId, value });
		updateDraft(questionId, value);
	};

	const handleSubmit = () => {
		if (isSubmitting || !answeredRequired || !formId || !userId) return;
		const timeSpentSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);
		clearDraft();
		localStorage.removeItem(`form-start-${userId}-${formId}`);
		const stringAnswers: Record<string, string> = Object.fromEntries(
			Object.entries(answers).map(([k, v]) => [k, String(v)]),
		);
		send({ type: "SUBMIT" });
		submitMutation.mutate({ formId, answers: stringAnswers, timeSpentSeconds });
	};

	if (!formId) return <FormNoFormSpecified backTo={redirectBack || "/dashboard/forms/student"} />;

	if (snapshot.matches("loading")) {
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
		return (
			<div className="flex items-center justify-center py-12">
				<Loader2 className="size-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	if (snapshot.matches("error")) {
		return (
			<FormLoadingError
				backTo={redirectBack || "/dashboard/forms/student"}
				message={snapshot.context.error ?? undefined}
			/>
		);
	}

	if (snapshot.matches("submitted")) {
		const form = snapshot.context.form!;
		const submission = snapshot.context.submission!;
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

	if (!isSubmitting && totalQuestions === 0) {
		const form = snapshot.context.form!;
		return <FormNoQuestions title={form.title} description={form.description ?? undefined} />;
	}

	return (
		<div className="flex h-full min-h-0 flex-col -mx-4 overflow-hidden">
			<FormHeaderBar
				title={snapshot.context.form!.title}
				description={snapshot.context.form!.description ?? undefined}
				answeredCount={answeredCount}
				totalQuestions={totalQuestions}
				lastSaved={null}
			/>
			<FormProgressBar progress={progress} />

			{/* Mobile: top/bottom split — reading material on top, questions below */}
			<div className="md:hidden flex flex-col min-h-0 flex-1">
				{hasReadingMaterial && (
					<div className="flex flex-col min-h-0 max-h-[45%] border-b">
						<ReadingMaterialSidebar
							sections={readingMaterialSections}
							materialImages={materialImages}
						/>
					</div>
				)}
				<div className="flex flex-col min-h-0 flex-1">
					<QuestionList
						questions={questions}
						answers={answers}
						onAnswerChange={handleAnswer}
						requiredQuestions={requiredQuestions}
						answeredRequired={answeredRequired}
						isPending={isSubmitting}
						disabled={isSubmitting}
						onSubmit={handleSubmit}
						centered={!hasReadingMaterial}
					/>
				</div>
			</div>

			{/* Desktop: left/right split */}
			<div className="hidden md:flex min-h-0 flex-1">
				{hasReadingMaterial && (
					<ReadingMaterialSidebar
						sections={readingMaterialSections}
						materialImages={materialImages}
					/>
				)}

				<QuestionList
					questions={questions}
					answers={answers}
					onAnswerChange={handleAnswer}
					requiredQuestions={requiredQuestions}
					answeredRequired={answeredRequired}
					isPending={isSubmitting}
					disabled={isSubmitting}
					onSubmit={handleSubmit}
					centered={!hasReadingMaterial}
				/>
			</div>
		</div>
	);
}
