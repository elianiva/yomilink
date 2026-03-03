import { CalendarIcon, CheckCircle2Icon, MapIcon, Trash2Icon, UsersIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/date-utils";

interface AssignmentCardProps {
	assignment: {
		id: string;
		title: string;
		description: string | null;
		goalMapTitle: string | null;
		startDate?: number;
		dueAt?: number;
		createdAt: number;
		updatedAt: number;
		totalStudents?: number;
		submittedStudents?: number;
		allSubmitted?: boolean;
		assignedCohorts?: Array<{ id: string; name: string; memberCount: number }>;
		assignedUsers?: Array<{ id: string; name: string; email: string }>;
		preTestFormId?: string | null;
		postTestFormId?: string | null;
		delayedPostTestFormId?: string | null;
		tamFormId?: string | null;
		preTestSubmitted?: number | null;
		postTestSubmitted?: number | null;
		delayedPostTestSubmitted?: number | null;
		tamSubmitted?: number | null;
	};
	onDelete: (id: string) => void;
}

function FormProgress({
	label,
	submitted,
	total,
}: {
	label: string;
	submitted: number | null | undefined;
	total: number;
}) {
	if (submitted === null || submitted === undefined) return null;

	return (
		<div className="text-xs text-muted-foreground">
			{label}: <span className="font-medium text-foreground">{submitted}</span>/{total}
		</div>
	);
}

export function AssignmentCard({ assignment, onDelete }: AssignmentCardProps) {
	const totalStudents = assignment.totalStudents ?? 0;
	const submittedStudents = assignment.submittedStudents ?? 0;
	const assignedCohorts = assignment.assignedCohorts ?? [];
	const assignedUsers = assignment.assignedUsers ?? [];

	return (
		<div className="rounded-lg border bg-card p-4 space-y-4">
			<div className="flex items-start justify-between gap-3">
				<div className="space-y-1 min-w-0">
					<div className="flex items-center gap-2 flex-wrap">
						<h3 className="font-medium truncate">{assignment.title}</h3>
						{assignment.allSubmitted ? (
							<Badge variant="secondary" className="gap-1">
								<CheckCircle2Icon className="size-3" />
								All submitted
							</Badge>
						) : (
							<Badge variant="outline">In progress</Badge>
						)}
					</div>
					{assignment.description && (
						<p className="text-sm text-muted-foreground line-clamp-2">
							{assignment.description}
						</p>
					)}
				</div>
				<Button
					variant="ghost"
					size="icon"
					className="text-destructive hover:text-destructive"
					onClick={() => onDelete(assignment.id)}
				>
					<Trash2Icon className="size-4" />
				</Button>
			</div>

			<div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
				<div className="flex items-center gap-1">
					<MapIcon className="size-4" />
					<span>{assignment.goalMapTitle ?? "Unknown"}</span>
				</div>
				{assignment.startDate && (
					<div className="flex items-center gap-1">
						<CalendarIcon className="size-4" />
						<span>Start {formatDate(assignment.startDate)}</span>
					</div>
				)}
				{assignment.dueAt && (
					<div className="flex items-center gap-1">
						<CalendarIcon className="size-4" />
						<span>Due {formatDate(assignment.dueAt)}</span>
					</div>
				)}
			</div>

			<div className="rounded-md border p-3 space-y-2">
				<div className="flex items-center justify-between text-sm">
					<div className="flex items-center gap-1 text-muted-foreground">
						<UsersIcon className="size-4" />
						<span>Assigned students</span>
					</div>
					<span className="font-medium">{totalStudents}</span>
				</div>
				<div className="text-sm text-muted-foreground">
					Submitted:{" "}
					<span className="font-medium text-foreground">{submittedStudents}</span>/
					{totalStudents}
				</div>
				{assignedCohorts.length > 0 && (
					<p className="text-xs text-muted-foreground line-clamp-2">
						Cohorts: {assignedCohorts.map((cohort) => cohort.name).join(", ")}
					</p>
				)}
				{assignedUsers.length > 0 && (
					<p className="text-xs text-muted-foreground line-clamp-2">
						Direct users:{" "}
						{assignedUsers.map((assignedUser) => assignedUser.name).join(", ")}
					</p>
				)}
			</div>

			{totalStudents > 0 && (
				<div className="rounded-md border p-3 space-y-1">
					<FormProgress
						label="Pre-test"
						submitted={assignment.preTestSubmitted}
						total={totalStudents}
					/>
					<FormProgress
						label="Post-test"
						submitted={assignment.postTestSubmitted}
						total={totalStudents}
					/>
					<FormProgress
						label="Delayed post-test"
						submitted={assignment.delayedPostTestSubmitted}
						total={totalStudents}
					/>
					<FormProgress
						label="TAM"
						submitted={assignment.tamSubmitted}
						total={totalStudents}
					/>
				</div>
			)}
		</div>
	);
}
