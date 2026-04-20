import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { BookOpenIcon, CheckCircle2Icon, FileTextIcon, Loader2 } from "lucide-react";

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
	const navigate = useNavigate({ from: "/dashboard/forms/student" });

	const { data: forms = [], isLoading: isLoadingForms } = useRpcQuery(FormRpc.getStudentForms());

	const availableForms = forms.filter((f) => f.unlockStatus === "available");
	const completedForms = forms.filter((f) => f.unlockStatus === "completed");

	const handleFormClick = (form: StudentForm) => {
		if (form.isUnlocked && form.unlockStatus === "available") {
			void navigate({ to: "/dashboard/forms/take", search: { formId: form.id } });
		}
	};

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
			<Card
				key={form.id}
				className={isCompleted ? "" : "cursor-pointer hover:shadow-sm transition-shadow"}
				onClick={() => handleFormClick(form)}
			>
				<CardContent className="p-4 flex items-start justify-between gap-4">
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
						<Button className="shrink-0">
							<BookOpenIcon className="h-4 w-4" />
							Start Form
						</Button>
					)}
				</CardContent>
			</Card>
		);
	};

	return (
		<div className="space-y-4">
			<div>
				<h1 className="text-2xl font-semibold">My Forms</h1>
				<p className="text-muted-foreground">
					Complete your assigned forms to progress in the course
				</p>
			</div>

			{forms.length === 0 ? (
				isLoadingForms ? (
					<div className="h-full flex items-center justify-center">
						<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
					</div>
				) : (
					<Card>
						<CardContent className="flex flex-col items-center justify-center py-12">
							<FileTextIcon className="size-12 text-muted-foreground mb-4" />
							<p className="text-muted-foreground">No forms available yet</p>
						</CardContent>
					</Card>
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
