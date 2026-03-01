import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { ArrowLeftIcon, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
	FormTaker,
	type FormData,
	type QuestionWithOptions,
} from "@/features/form/components/form-taker";
import { FormRpc } from "@/server/rpc/form";
import { useRpcQuery } from "@/hooks/use-rpc-query";

export const Route = createFileRoute("/dashboard/forms/take")({
	component: FormTakerPage,
});

type FormQueryResponse = {
	readonly success: true;
	readonly form: {
		readonly id: string;
		readonly title: string;
		readonly description: string | null;
		readonly type: "pre_test" | "post_test" | "registration" | "control";
		readonly status: "draft" | "published";
		readonly unlockConditions: unknown;
		readonly createdBy: string;
		readonly createdAt: Date;
		readonly updatedAt: Date;
	};
	readonly questions: Array<{
		readonly id: string;
		readonly formId: string;
		readonly type: "mcq" | "likert" | "text";
		readonly questionText: string;
		readonly options:
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
			  }
			| null;
		readonly orderIndex: number;
		readonly required: boolean;
		readonly createdAt: Date;
		readonly updatedAt: Date;
	}>;
};

function FormTakerPage() {
	const navigate = useNavigate({ from: "/dashboard/forms/take" });
	const searchParams = useSearch({ from: "/dashboard/forms/take" });
	const formId = (searchParams as { formId?: string }).formId;

	const { data, isLoading, error } = useRpcQuery({
		...FormRpc.getFormById({ id: formId ?? "" }),
		enabled: !!formId,
	});

	const handleBack = () => {
		navigate({ to: "/dashboard/forms/student" });
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

	// Handle error response
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

	// Type assertion since we can't narrow the union type properly
	const response = data as FormQueryResponse;

	// Transform data to match expected types
	const formData: FormData = {
		id: response.form.id,
		title: response.form.title,
		description: response.form.description ?? undefined,
		type: response.form.type,
		status: response.form.status,
	};

	const questionData: QuestionWithOptions[] = response.questions.map((q) => {
		// Transform options based on question type
		let transformedOptions: QuestionWithOptions["options"];

		if (q.type === "mcq" && Array.isArray(q.options)) {
			transformedOptions = q.options as { id: string; text: string }[];
		} else if (q.type === "likert" && q.options && "type" in q.options) {
			transformedOptions = q.options as {
				type: "likert";
				scaleSize: number;
				labels: { [key: string]: string };
			};
		} else if (q.type === "text" && q.options && "type" in q.options) {
			transformedOptions = q.options as {
				type: "text";
				minLength?: number;
				maxLength?: number;
				placeholder?: string;
			};
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
		};
	});

	// Handle submit
	const handleSubmit = () => {
		navigate({ to: "/dashboard/forms/student" });
	};

	return (
		<div className="container max-w-2xl mx-auto py-8 px-4">
			<Button variant="ghost" size="sm" onClick={handleBack} className="mb-4">
				<ArrowLeftIcon className="mr-2 h-4 w-4" />
				Back to Forms
			</Button>

			<FormTaker form={formData} questions={questionData} onSubmit={handleSubmit} />
		</div>
	);
}
