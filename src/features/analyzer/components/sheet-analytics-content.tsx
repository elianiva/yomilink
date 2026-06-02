import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useRpcQuery } from "@/hooks/use-rpc-query";
import { AnalyticsRpc } from "@/server/rpc/analytics";

interface SheetAnalyticsContentProps {
	assignmentId?: string;
}

type CellValue = string | number | null;

const columns = [
	"Email",
	"Pre-Test Raw",
	"Pre-Test Duration (s)",
	"Kit-Build Score (%)",
	"Post-Test Raw",
	"Post-Test Duration (s)",
	"Pre-Test Normalised",
	"Post-Test Normalised",
	"Delta",
	"Average Duration (s)",
	"Normalisation",
	"Pre-Engagement",
	"Post-Engagement",
	"Effort Consistent",
	"Room to Improve",
	"Score Trend",
	"Notes",
] as const;

const numericColumns = new Set([
	"Pre-Test Raw",
	"Pre-Test Duration (s)",
	"Kit-Build Score (%)",
	"Post-Test Raw",
	"Post-Test Duration (s)",
	"Pre-Test Normalised",
	"Post-Test Normalised",
	"Delta",
	"Average Duration (s)",
]);

export function SheetAnalyticsContent({ assignmentId }: SheetAnalyticsContentProps) {
	const navigate = useNavigate();
	const [selectedAssignmentId, setSelectedAssignmentId] = useState(assignmentId ?? "");
	const { data: assignments, isLoading: isLoadingAssignments } = useRpcQuery({
		...AnalyticsRpc.getTeacherAssignments(),
		refetchOnWindowFocus: false,
	});
	const effectiveAssignmentId = selectedAssignmentId || assignments?.[0]?.id || "";
	const { data, isLoading } = useRpcQuery({
		...AnalyticsRpc.getAnalyticsForAssignment(effectiveAssignmentId),
		enabled: !!effectiveAssignmentId,
		refetchOnWindowFocus: false,
	});

	const rows = useMemo(() => {
		if (!data || !("learners" in data)) return null;

		return data.learners.map((learner) => {
			const preRaw = learner.preTestRaw;
			const postRaw = learner.postTestRaw;
			const preDuration = learner.preTestDurationSeconds;
			const postDuration = learner.postTestDurationSeconds;
			const preNormalised = preRaw;
			const postNormalised = postRaw ?? preRaw;
			const delta =
				preNormalised !== null && postNormalised !== null
					? postNormalised - preNormalised
					: null;
			const avgDuration =
				preDuration !== null && postDuration !== null
					? Math.round((preDuration + postDuration) / 2)
					: null;
			const postInvalid = postDuration !== null && postDuration < 60;
			const normalisation = postInvalid
				? `Post invalid: dur=${postDuration}s (<60s). Substituted with pre score (${preRaw ?? "—"}).`
				: "Valid";
			const preEngagement = engagement(preDuration);
			const postEngagement = engagement(postDuration);
			const effortConsistent =
				preDuration !== null && postDuration !== null && postDuration < preDuration * 0.5
					? "No (post <50% of pre duration)"
					: "Yes";
			const roomToImprove = preRaw !== null && preRaw >= 8 ? "No (pre >= 8/10)" : "Yes";
			const trend =
				delta === null
					? "unknown"
					: delta > 0
						? "improved"
						: delta < 0
							? "declined"
							: "same";
			const notes = makeNotes({ postInvalid, preRaw, delta, effortConsistent });

			return [
				learner.userEmail,
				formatRaw(preRaw, learner.preTestTotal),
				formatDuration(preDuration),
				formatPercent(learner.score),
				formatRaw(postRaw, learner.postTestTotal),
				formatDuration(postDuration),
				preNormalised,
				postNormalised,
				delta,
				formatDuration(avgDuration),
				normalisation,
				preEngagement,
				postEngagement,
				effortConsistent,
				roomToImprove,
				trend,
				notes,
			] satisfies CellValue[];
		});
	}, [data]);

	if (isLoadingAssignments) {
		return (
			<div className="flex items-center justify-center py-12">
				<Loader2 className="size-6 animate-spin text-muted-foreground" />
			</div>
		);
	}

	if (!isLoading && (!data || !rows))
		return <p className="text-muted-foreground">No sheet analytics available</p>;

	return (
		<div className="space-y-5 min-w-0 pt-4">
			<PageHeader
				title="Sheet Analytics"
				description={
					data
						? data.assignment.title
						: "Numerical analysis overview of assignment metrics"
				}
				action={
					<Select value={effectiveAssignmentId} onValueChange={setSelectedAssignmentId}>
						<SelectTrigger className="w-64">
							<SelectValue placeholder="Select assignment…" />
						</SelectTrigger>
						<SelectContent>
							{assignments?.map((a) => (
								<SelectItem key={a.id} value={a.id}>
									{a.title}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				}
			/>

			{effectiveAssignmentId && isLoading && (
				<div className="flex items-center justify-center py-12">
					<Loader2 className="size-6 animate-spin text-muted-foreground" />
				</div>
			)}

			{data && rows && (
				<Card className="overflow-hidden border-border/70 py-0">
					<CardHeader className="border-b bg-muted/30 py-4">
						<CardTitle className="text-base font-medium">
							{data.assignment.title} — Numerical analysis overview
						</CardTitle>
					</CardHeader>
					<CardContent className="p-0">
						<div className="overflow-auto w-0 min-w-full">
							<table className="border-collapse text-sm">
								<thead>
									<tr className="bg-primary text-primary-foreground">
										{columns.map((column) => (
											<th
												key={column}
												className={"whitespace-nowrap border-r border-primary-foreground/20 px-3 py-2 " + (numericColumns.has(column) ? "text-right" : "text-left") + " font-medium"}
											>
												{column}
											</th>
										))}
									</tr>
								</thead>
								<tbody>
									{rows.map((row, index) => (
										<tr
											key={String(row[0])}
											className={
												index % 2 === 0 ? "bg-background" : "bg-muted/35"
											}
										>
											{row.map((cell, cellIndex) => (
												<td
													key={cellIndex}
													className={"whitespace-nowrap border-b border-r px-3 py-2 tabular-nums " + (numericColumns.has(columns[cellIndex]) ? "text-right" : "text-left") + " text-foreground/90"}
												>
													{cell ?? "—"}
												</td>
											))}
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}

function engagement(duration: number | null) {
	if (duration === null) return "missing";
	if (duration < 60) return "rushed";
	if (duration < 300) return "moderate";
	return "engaged";
}

function formatDuration(duration: number | null) {
	if (duration === null) return null;
	const minutes = Math.floor(duration / 60);
	const seconds = duration % 60;
	return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function formatPercent(score: number | null) {
	return score === null ? null : `${score.toFixed(2)}%`;
}

function formatRaw(raw: number | null, total: number | null) {
	if (raw === null) return null;
	return total ? `${raw}/${total}` : raw;
}

function makeNotes(input: {
	postInvalid: boolean;
	preRaw: number | null;
	delta: number | null;
	effortConsistent: string;
}) {
	const notes: string[] = [];
	if (input.postInvalid) notes.push("Post-test duration below validity threshold");
	if (input.preRaw !== null && input.preRaw >= 8)
		notes.push("Ceiling effect — pre-test score already near maximum");
	if (input.delta !== null && input.delta >= 4 && input.effortConsistent === "Yes")
		notes.push(`Meaningful improvement of +${input.delta} with consistent effort`);
	return notes.length ? notes.join("; ") : "No issues detected";
}
