import { createFileRoute } from "@tanstack/react-router";
import { BarChart3, List, Loader2, Users } from "lucide-react";
import { useState } from "react";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Guard } from "@/features/auth/components/Guard";
import { AggregatedResponses } from "@/features/form/components/aggregated-responses";
import { IndividualResponsesTable } from "@/features/form/components/individual-responses-table";
import type { FormResponseOutput, QuestionOutput } from "@/features/form/lib/form-service.shared";
import { useRpcQuery } from "@/hooks/use-rpc-query";
import { FormRpc } from "@/server/rpc/form";

export const Route = createFileRoute("/dashboard/forms/$formId/results")({
	component: () => (
		<Guard roles={["teacher", "admin"]}>
			<FormResultsPage />
		</Guard>
	),
});

function FormResultsPage() {
	const { formId } = Route.useParams();
	const [activeTab, setActiveTab] = useState<"individual" | "aggregated">("individual");

	const {
		data: formData,
		isLoading: formLoading,
		isRpcError: isFormError,
		rpcError: formError,
	} = useRpcQuery(FormRpc.getFormById(formId));

	const { data: responsesData, isLoading: responsesLoading } = useRpcQuery(
		FormRpc.getFormResponses({
			formId: formId,
			page: 1,
			limit: 100,
		}),
	);

	const isLoading = formLoading || responsesLoading;

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-12">
				<Loader2 className="size-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	if (isFormError) {
		return (
			<div className="flex flex-col items-center justify-center py-12">
				<p className="text-muted-foreground">{formError ?? "Failed to load form"}</p>
			</div>
		);
	}

	if (!formData) {
		return (
			<div className="flex flex-col items-center justify-center py-12">
				<p className="text-muted-foreground">Form not found</p>
			</div>
		);
	}

	if (!formData.form) {
		return (
			<div className="flex flex-col items-center justify-center py-12">
				<p className="text-muted-foreground">Form not found</p>
			</div>
		);
	}

	const { form, questions } = formData;
	const responses = responsesData?.responses ?? [];
	const pagination = responsesData?.pagination ?? {
		page: 1,
		limit: 20,
		total: 0,
		totalPages: 0,
		hasNextPage: false,
		hasPrevPage: false,
	};

	return (
		<div className="space-y-6">
			<PageHeader
				title={`${form.title} — Results`}
				description={`${pagination.total} response${pagination.total !== 1 ? "s" : ""}`}
				action={
					<Button
						variant="outline"
						onClick={() => {
							const csv = generateCsv(responses, questions);
							downloadCsv(csv, form.title);
						}}
						disabled={responses.length === 0}
						className="interactive-sm"
					>
						<BarChart3 className="mr-2 size-4" />
						Export CSV
					</Button>
				}
			/>

			<Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
				<TabsList variant="line">
					<TabsTrigger value="individual" className="gap-2">
						<List className="size-4" />
						Individual
					</TabsTrigger>
					<TabsTrigger value="aggregated" className="gap-2">
						<Users className="size-4" />
						Aggregated
					</TabsTrigger>
				</TabsList>

				<TabsContent value="individual" className="mt-6">
					<IndividualResponsesTable
						responses={responses}
						questions={questions}
						pagination={pagination}
						formId={formId}
					/>
				</TabsContent>

				<TabsContent value="aggregated" className="mt-6">
					<AggregatedResponses responses={responses} questions={questions} />
				</TabsContent>
			</Tabs>
		</div>
	);
}

function generateCsv(
	responses: ReadonlyArray<FormResponseOutput>,
	questions: ReadonlyArray<QuestionOutput>,
): string {
	const headers = [
		"Student Name",
		"Email",
		"Submitted At",
		"Time Spent (seconds)",
		...questions.map((q) => q.questionText),
	];
	const rows = responses.map((response) => {
		const submittedAt = response.submittedAt
			? new Date(response.submittedAt).toISOString()
			: "";

		const questionAnswers = questions.map((q) => {
			const answer = response.answers?.[q.id];
			if (answer === undefined || answer === null) return "";
			if (typeof answer === "object") return JSON.stringify(answer);
			return String(answer);
		});

		return [
			response.user.name ?? "",
			response.user.email ?? "",
			submittedAt,
			response.timeSpentSeconds?.toString() ?? "",
			...questionAnswers,
		];
	});

	const escapeCsvCell = (cell: string) => {
		if (cell.includes(",") || cell.includes('"') || cell.includes("\n")) {
			return `"${cell.replace(/"/g, '""')}"`;
		}
		return cell;
	};

	return [
		headers.map(escapeCsvCell).join(","),
		...rows.map((row) => row.map(escapeCsvCell).join(",")),
	].join("\n");
}

function downloadCsv(csv: string, formTitle: string) {
	const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = `${formTitle.replace(/[^a-z0-9]/gi, "_")}_results.csv`;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
}
