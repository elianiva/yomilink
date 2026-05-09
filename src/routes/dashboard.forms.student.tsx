import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { BookOpenIcon, CheckCircle2Icon, FileTextIcon, Loader2 } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useRpcQuery } from "@/hooks/use-rpc-query";
import { FormRpc } from "@/server/rpc/form";

export const Route = createFileRoute("/dashboard/forms/student")({
	component: StudentFormsPage,
});

type StudentForm = {
	id: string;
	title: string;
	description: string | null;
	type: "pre_test" | "post_test" | "delayed_test" | "registration" | "tam" | "questionnaire";
	audience: "all" | "experiment" | "control";
	unlockStatus: "available" | "completed";
	isUnlocked: boolean;
	progress: {
		status: "locked" | "available" | "completed";
		unlockedAt: Date | null;
		completedAt: Date | null;
	} | null;
};

function StudentFormsPage() {
	const navigate = useNavigate();
	const { data: forms = [], isLoading: isLoadingForms } = useRpcQuery(FormRpc.getStudentForms());

	const availableForms = forms.filter((f) => f.unlockStatus === "available");
	const completedForms = forms.filter((f) => f.unlockStatus === "completed");

	const getTypeLabel = (type: string) => {
		switch (type) {
			case "pre_test":
				return "Pre-Test";
			case "post_test":
				return "Post-Test";
			case "delayed_test":
				return "Delayed-Test";
			case "registration":
				return "Registration";
			case "tam":
				return "TAM Questionnaire";
			case "questionnaire":
				return "Questionnaire";
			default:
				return type;
		}
	};

	const renderFormRow = (form: StudentForm) => {
		const isCompleted = form.unlockStatus === "completed";

		return (
			<Card key={form.id} className="py-4">
				<CardContent className="px-4 flex items-start justify-between gap-4">
					<div className="min-w-0 space-y-1">
						<p className="font-medium leading-tight">{form.title}</p>
						{form.description && (
							<p className="text-sm text-muted-foreground">{form.description}</p>
						)}
						<p className="text-xs text-muted-foreground">{getTypeLabel(form.type)}</p>
					</div>

					{isCompleted ? (
						<div className="flex items-center gap-2 text-sm text-green-600 shrink-0">
							<CheckCircle2Icon className="size-4" />
							Completed
						</div>
					) : (
						<Button
							className="shrink-0"
							onClick={() =>
								navigate({
									to: "/dashboard/forms/take",
									search: { formId: form.id },
								})
							}
						>
							<BookOpenIcon className="size-4" />
							Start Form
						</Button>
					)}
				</CardContent>
			</Card>
		);
	};

	return (
		<div className="space-y-4">
			<PageHeader
				icon={FileTextIcon}
				title="My Forms"
				description="Complete your assigned forms to progress in the course"
			/>

			{forms.length === 0 ? (
				isLoadingForms ? (
					<div className="flex items-center justify-center py-12">
						<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
					</div>
				) : (
					<EmptyState icon={FileTextIcon} title="No forms available yet" />
				)
			) : (
				<>
					{availableForms.length > 0 && (
						<div className="space-y-3">
							<h2 className="text-lg font-medium">Available Forms</h2>
							<div className="space-y-2">{availableForms.map(renderFormRow)}</div>
						</div>
					)}

					{completedForms.length > 0 && (
						<div className="space-y-3">
							<h2 className="text-lg font-semibold flex items-center gap-2">
								<CheckCircle2Icon className="size-5 text-green-600" />
								Completed Forms
							</h2>
							<div className="space-y-2">{completedForms.map(renderFormRow)}</div>
						</div>
					)}
				</>
			)}
		</div>
	);
}
