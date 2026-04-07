import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { ArrowLeftIcon, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
	FormTaker,
	type FormData,
	type QuestionWithOptions,
} from "@/features/form/components/form-taker";
import { unwrap } from "@/hooks/use-rpc-error";
import { useRpcMutation, useRpcQuery } from "@/hooks/use-rpc-query";
import { FormRpc } from "@/server/rpc/form";

export const Route = createFileRoute("/dashboard/forms/take")({
	component: FormTakerPage,
});

type FormTakeSearch = {
	formId?: string;
	returnTo?: string;
};

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
	const { data: studentForms } = useRpcQuery(FormRpc.getStudentForms());

	const submitMutation = useRpcMutation(FormRpc.submitFormResponse(), {
		operation: "submit form",
		showSuccess: true,
		successMessage: "Form submitted successfully!",
		onSuccess: async () => {
			// Invalidate related queries to refresh status
			await queryClient.invalidateQueries({ queryKey: FormRpc.forms() });
			if (formId) {
				await queryClient.invalidateQueries({
					queryKey: [...FormRpc.forms(), "checkUnlock", formId],
					exact: true,
				});
			}

			if (data?.form.type === "post_test") {
				const forms =
					studentForms ??
					unwrap(await queryClient.fetchQuery(FormRpc.getStudentForms())) ??
					[];
				const tamForm = forms.find((form) => form.type === "tam" && form.isUnlocked);

				if (tamForm) {
					window.location.href = `/dashboard/forms/take?formId=${tamForm.id}${returnTo ? `&returnTo=${encodeURIComponent(returnTo)}` : ""}`;
					return;
				}
			}

			if (returnTo) {
				window.location.href = returnTo;
			} else {
				void navigate({ to: "/dashboard/forms/student" });
			}
		},
	});

	const handleBack = () => {
		void navigate({ to: "/dashboard/forms/student" });
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

	const formData: FormData = {
		id: data.form.id,
		title: data.form.title,
		description: data.form.description ?? undefined,
		type: data.form.type,
		status: data.form.status,
	};

	const questionData: QuestionWithOptions[] = data.questions.map((q) => {
		let transformedOptions: QuestionWithOptions["options"];
		let shuffle: boolean | undefined;

		if (q.type === "mcq" && q.options && !Array.isArray(q.options)) {
			// Student form returns { type: "mcq", options: [...], shuffle: boolean }
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
			// Fallback for legacy format
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
