"use client";

import { useQuery } from "@tanstack/react-query";
import { EyeIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { FormRpc } from "@/server/rpc/form";
import { ResponseDetailModal } from "./response-detail-modal";

export type ResponseQuestion = {
	id: string;
	formId: string;
	type: "mcq" | "likert" | "text";
	questionText: string;
	options: Record<string, unknown> | null;
	orderIndex: number;
	required: boolean;
	createdAt: Date;
	updatedAt: Date;
};

export type ResponseUser = {
	id: string;
	name: string | null;
	email: string;
};

export type FormResponse = {
	id: string;
	formId: string;
	userId: string;
	answers: Record<string, unknown>;
	submittedAt: Date | null;
	timeSpentSeconds: number | null;
	user: ResponseUser;
};

export type PaginationInfo = {
	page: number;
	limit: number;
	total: number;
	totalPages: number;
	hasNextPage: boolean;
	hasPrevPage: boolean;
};

type IndividualResponsesTableProps = {
	responses: FormResponse[];
	questions: ResponseQuestion[];
	pagination: PaginationInfo;
	formId: string;
};

export function IndividualResponsesTable({
	responses,
	questions,
	pagination,
	formId,
}: IndividualResponsesTableProps) {
	const [selectedResponse, setSelectedResponse] = useState<FormResponse | null>(
		null,
	);

	// For pagination, we'd fetch more data. For now, show what we have.
	const { data: moreResponses } = useQuery({
		...FormRpc.getFormResponses({
			formId,
			page: pagination.page,
			limit: pagination.limit,
		}),
		enabled: pagination.page > 1,
	});

	const displayResponses =
		pagination.page > 1 && moreResponses && "responses" in moreResponses
			? moreResponses.responses
			: responses;

	if (displayResponses.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
				<p>No responses yet</p>
			</div>
		);
	}

	const formatDate = (date: Date | string | null) => {
		if (!date) return "-";
		const d = date instanceof Date ? date : new Date(date);
		return d.toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
			year: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	const formatTimeSpent = (seconds: number | null) => {
		if (seconds === null) return "-";
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		if (mins > 0) return `${mins}m ${secs}s`;
		return `${secs}s`;
	};

	return (
		<>
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Student</TableHead>
						<TableHead>Submitted</TableHead>
						<TableHead>Time Spent</TableHead>
						<TableHead className="text-right">Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{displayResponses.map((response) => (
						<TableRow key={response.id}>
							<TableCell className="font-medium">
								<div>
									<div>{response.user.name ?? "Unknown"}</div>
									<div className="text-xs text-muted-foreground">
										{response.user.email}
									</div>
								</div>
							</TableCell>
							<TableCell>{formatDate(response.submittedAt)}</TableCell>
							<TableCell>
								{formatTimeSpent(response.timeSpentSeconds)}
							</TableCell>
							<TableCell className="text-right">
								<Button
									variant="ghost"
									size="sm"
									onClick={() => setSelectedResponse(response)}
								>
									<EyeIcon className="h-4 w-4" />
									<span className="ml-2">View</span>
								</Button>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>

			{/* Pagination controls */}
			{pagination.totalPages > 1 && (
				<div className="flex items-center justify-between mt-4">
					<div className="text-sm text-muted-foreground">
						Page {pagination.page} of {pagination.totalPages} (
						{pagination.total} responses)
					</div>
					<div className="flex gap-2">
						<Button
							variant="outline"
							size="sm"
							disabled={!pagination.hasPrevPage}
							onClick={() => {
								// In a full implementation, this would navigate to the previous page
							}}
						>
							Previous
						</Button>
						<Button
							variant="outline"
							size="sm"
							disabled={!pagination.hasNextPage}
							onClick={() => {
								// In a full implementation, this would navigate to the next page
							}}
						>
							Next
						</Button>
					</div>
				</div>
			)}

			{selectedResponse && (
				<ResponseDetailModal
					response={selectedResponse}
					questions={questions}
					open={!!selectedResponse}
					onOpenChange={(open) => !open && setSelectedResponse(null)}
				/>
			)}
		</>
	);
}
