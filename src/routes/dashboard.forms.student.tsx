import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { BookOpenIcon, CheckCircle2Icon, FileTextIcon, Loader2 } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

	const compareTitles = (a: StudentForm, b: StudentForm) => a.title.localeCompare(b.title);

	const availableForms = forms.filter((f) => f.unlockStatus === "available").sort(compareTitles);
	const completedForms = forms.filter((f) => f.unlockStatus === "completed").sort(compareTitles);

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
						<div className="flex items-center gap-2 shrink-0">
							<CheckCircle2Icon className="size-4 text-green-600" />
							<Button
								variant="outline"
								size="sm"
								onClick={() =>
									navigate({
										to: "/dashboard/forms/take",
										search: { formId: form.id },
									})
								}
							>
								View Result
							</Button>
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
						<Loader2 className="size-8 animate-spin text-muted-foreground" />
					</div>
				) : (
					<EmptyState icon={FileTextIcon} title="No forms available yet" />
				)
			) : (
				<Tabs defaultValue="available">
					<TabsList>
						<TabsTrigger value="available">
							Available ({availableForms.length})
						</TabsTrigger>
						<TabsTrigger value="completed">
							<CheckCircle2Icon className="size-4" />
							Completed ({completedForms.length})
						</TabsTrigger>
					</TabsList>
					<TabsContent value="available">
						{availableForms.length > 0 ? (
							<div className="space-y-2">{availableForms.map(renderFormRow)}</div>
						) : (
							<EmptyState
								icon={BookOpenIcon}
								title="No available forms"
								description="All forms have been completed."
							/>
						)}
					</TabsContent>
					<TabsContent value="completed">
						{completedForms.length > 0 ? (
							<div className="space-y-2">{completedForms.map(renderFormRow)}</div>
						) : (
							<EmptyState
								icon={CheckCircle2Icon}
								title="No completed forms"
								description="Complete your available forms to see them here."
							/>
						)}
					</TabsContent>
				</Tabs>
			)}
		</div>
	);
}
