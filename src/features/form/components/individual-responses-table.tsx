import { ChevronRight, EyeIcon, Clock, CalendarDays, Trophy } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import type { FormResponseOutput, QuestionOutput } from "@/features/form/lib/form-service.shared";
import { useRpcQuery } from "@/hooks/use-rpc-query";
import { formatDateTime } from "@/lib/date-utils";
import { FormRpc } from "@/server/rpc/form";

import { ResponseDetailModal } from "./response-detail-modal";

type FormResponse = FormResponseOutput;
type ResponseQuestion = QuestionOutput;

export type PaginationInfo = {
	page: number;
	limit: number;
	total: number;
	totalPages: number;
	hasNextPage: boolean;
	hasPrevPage: boolean;
};

type IndividualResponsesTableProps = {
	responses: ReadonlyArray<FormResponse>;
	questions: ReadonlyArray<ResponseQuestion>;
	pagination: PaginationInfo;
	formId: string;
};

export function IndividualResponsesTable({
	responses,
	questions,
	pagination,
	formId,
}: IndividualResponsesTableProps) {
	const [selectedResponse, setSelectedResponse] = useState<FormResponse | null>(null);

	const { data: moreResponses } = useRpcQuery({
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

	const formatResponseDate = (timestamp: number | null) => {
		if (!timestamp) return "-";
		return formatDateTime(timestamp);
	};

	const formatTimeSpent = (seconds: number | null) => {
		if (seconds === null) return "-";
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		if (mins > 0) return `${mins}m ${secs}s`;
		return `${secs}s`;
	};

	const formatScore = (score: number | null) => {
		if (score === null) return "-";
		return `${Math.round(score * 100)}%`;
	};

	const mobileCard = (response: FormResponse) => (
		<Card
			key={response.id}
			className="cursor-pointer"
			onClick={() => setSelectedResponse(response)}
		>
			<CardContent className="p-4">
				<div className="flex items-start justify-between gap-3">
					<div className="min-w-0 flex-1 space-y-2">
						<div className="font-medium truncate">
							{response.user.name ?? "Unknown"}
						</div>
						<div className="text-xs text-muted-foreground truncate">
							{response.user.email}
						</div>
						<div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
							<span className="flex items-center gap-1">
								<CalendarDays className="size-3" />
								{formatResponseDate(response.submittedAt)}
							</span>
							<span className="flex items-center gap-1">
								<Clock className="size-3" />
								{formatTimeSpent(response.timeSpentSeconds)}
							</span>
							<span className="flex items-center gap-1">
								<Trophy className="size-3" />
								{formatScore(response.score)}
							</span>
						</div>
					</div>
					<ChevronRight className="size-4 text-muted-foreground shrink-0 mt-1" />
				</div>
			</CardContent>
		</Card>
	);

	return (
		<div>
			{/* Desktop table */}
			<div className="hidden md:block">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Student</TableHead>
							<TableHead>Submitted</TableHead>
							<TableHead>Time Spent</TableHead>
							<TableHead>Score</TableHead>
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
								<TableCell>{formatResponseDate(response.submittedAt)}</TableCell>
								<TableCell>{formatTimeSpent(response.timeSpentSeconds)}</TableCell>
								<TableCell>{formatScore(response.score)}</TableCell>
								<TableCell className="text-right">
									<Button
										variant="ghost"
										size="sm"
										onClick={() => setSelectedResponse(response)}
									>
										<EyeIcon className="size-4" />
										<span className="ml-2">View</span>
									</Button>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>

			{/* Mobile cards */}
			<div className="md:hidden space-y-2">{displayResponses.map(mobileCard)}</div>

			{pagination.totalPages > 1 && (
				<div className="flex flex-col sm:flex-row items-center justify-between gap-2 mt-4">
					<div className="text-sm text-muted-foreground">
						Page {pagination.page} of {pagination.totalPages} ({pagination.total}{" "}
						responses)
					</div>
					<div className="flex gap-2">
						<Button variant="outline" size="sm" disabled={!pagination.hasPrevPage}>
							Previous
						</Button>
						<Button variant="outline" size="sm" disabled={!pagination.hasNextPage}>
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
		</div>
	);
}
