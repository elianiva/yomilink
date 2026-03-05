import {
	CalendarIcon,
	ClipboardListIcon,
	FileTextIcon,
	MapIcon,
	MoreVertical,
	Pencil,
	TimerIcon,
	Trash2,
	UsersIcon,
} from "lucide-react";
import type * as React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export interface AssignmentListItem {
	id: string;
	title: string;
	description: string | null;
	goalMapTitle: string | null;
	startDate?: number;
	dueAt?: number;
	createdAt: number;
	// Teacher view fields
	totalStudents?: number;
	submittedStudents?: number;
	allSubmitted?: boolean;
	assignedCohortCount?: number;
	assignedDirectUserCount?: number;
	preTestSubmitted?: number | null;
	postTestSubmitted?: number | null;
	delayedPostTestSubmitted?: number | null;
	tamSubmitted?: number | null;
	// Student view fields
	status?: "not_started" | "draft" | "submitted";
	attempt?: number;
	isLate?: boolean | null;
	lastUpdated?: number;
	// Common form fields
	preTestFormId?: string | null;
	postTestFormId?: string | null;
	delayedPostTestFormId?: string | null;
	tamFormId?: string | null;
}

type ViewMode = "teacher" | "student";

interface AssignmentListProps {
	assignments: AssignmentListItem[];
	viewMode: ViewMode;
	onViewDetails?: (assignment: AssignmentListItem) => void;
	onDelete?: (assignmentId: string) => void;
	onClick?: (assignment: AssignmentListItem) => void;
	className?: string;
}

type TeacherStatus = "upcoming" | "active" | "overdue" | "completed";
type StudentStatus = "not_started" | "in_progress" | "submitted" | "late_not_started" | "late_in_progress";

function getTeacherStatus(assignment: AssignmentListItem): TeacherStatus {
	if (assignment.allSubmitted) return "completed";
	const now = Date.now();
	if (assignment.dueAt && now > assignment.dueAt) return "overdue";
	if (assignment.startDate && now < assignment.startDate) return "upcoming";
	return "active";
}

function getStudentStatus(assignment: AssignmentListItem): StudentStatus {
	const status = assignment.status ?? "not_started";
	const isLate = assignment.isLate ?? false;

	if (status === "submitted") return "submitted";
	if (status === "draft") return isLate ? "late_in_progress" : "in_progress";
	return isLate ? "late_not_started" : "not_started";
}

function formatDueDate(dueAt: number | undefined): string {
	if (!dueAt) return "No due date";
	return new Date(dueAt).toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
}

const teacherStatusConfig: Record<
	TeacherStatus,
	{ label: string; dot: string; badge: string }
> = {
	upcoming: {
		label: "Upcoming",
		dot: "bg-blue-400",
		badge: "bg-blue-50 text-blue-700 border-blue-200",
	},
	active: {
		label: "Active",
		dot: "bg-primary",
		badge: "bg-primary/10 text-primary border-primary/20",
	},
	overdue: {
		label: "Overdue",
		dot: "bg-red-400",
		badge: "bg-red-50 text-red-700 border-red-200",
	},
	completed: {
		label: "Completed",
		dot: "bg-green-500",
		badge: "bg-green-50 text-green-700 border-green-200",
	},
};

const studentStatusConfig: Record<
	StudentStatus,
	{ label: string; dot: string; badge: string }
> = {
	not_started: {
		label: "Not Started",
		dot: "bg-stone-400",
		badge: "bg-stone-100 text-stone-700 border-stone-200",
	},
	in_progress: {
		label: "In Progress",
		dot: "bg-primary",
		badge: "bg-primary/10 text-primary border-primary/20",
	},
	submitted: {
		label: "Submitted",
		dot: "bg-green-500",
		badge: "bg-green-50 text-green-700 border-green-200",
	},
	late_not_started: {
		label: "Late - Not Started",
		dot: "bg-red-400",
		badge: "bg-red-50 text-red-700 border-red-200",
	},
	late_in_progress: {
		label: "Late - In Progress",
		dot: "bg-red-400",
		badge: "bg-red-50 text-red-700 border-red-200",
	},
};

interface FormConfig {
	key: "pre" | "post" | "delayed" | "tam";
	label: string;
	icon: React.ReactNode;
	hasForm: boolean;
	submitted: number | null;
	total: number;
}

function getFormConfigs(assignment: AssignmentListItem): FormConfig[] {
	return [
		{
			key: "pre",
			label: "Pre",
			icon: <ClipboardListIcon className="size-3" />,
			hasForm: !!assignment.preTestFormId,
			submitted: assignment.preTestSubmitted ?? null,
			total: assignment.totalStudents ?? 0,
		},
		{
			key: "post",
			label: "Post",
			icon: <FileTextIcon className="size-3" />,
			hasForm: !!assignment.postTestFormId,
			submitted: assignment.postTestSubmitted ?? null,
			total: assignment.totalStudents ?? 0,
		},
		{
			key: "delayed",
			label: "Delayed",
			icon: <TimerIcon className="size-3" />,
			hasForm: !!assignment.delayedPostTestFormId,
			submitted: assignment.delayedPostTestSubmitted ?? null,
			total: assignment.totalStudents ?? 0,
		},
	];
}

function ProgressBar({
	current,
	total,
	className,
}: { current: number; total: number; className?: string }) {
	const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
	return (
		<div className={cn("flex items-center gap-2", className)}>
			<div className="h-1.5 w-16 rounded-full bg-stone-200 overflow-hidden">
				<div
					className={cn(
						"h-full rounded-full transition-all",
						percentage === 100 ? "bg-green-500" : "bg-primary",
					)}
					style={{ width: `${percentage}%` }}
				/>
			</div>
			<span className="text-xs text-stone-500">{percentage}%</span>
		</div>
	);
}

function TeacherCard({
	assignment,
	onViewDetails,
	onDelete,
	onClick,
}: {
	assignment: AssignmentListItem;
	onViewDetails?: (a: AssignmentListItem) => void;
	onDelete?: (id: string) => void;
	onClick?: (a: AssignmentListItem) => void;
}) {
	const handleClick = () => {
		if (onClick) onClick(assignment);
		else if (onViewDetails) onViewDetails(assignment);
	};

	const status = getTeacherStatus(assignment);
	const statusCfg = teacherStatusConfig[status];
	const formConfigs = getFormConfigs(assignment);
	const attachedForms = formConfigs.filter((f) => f.hasForm);

	return (
		<Card
			className={cn(
				"group relative overflow-hidden border border-stone-200 shadow-none transition-all duration-200 py-2",
				"hover:border-primary/40 hover:shadow-sm hover:bg-stone-50/50",
				"cursor-pointer bg-white",
			)}
			onClick={handleClick}
		>
			<CardContent className="p-3">
				<div className="flex items-start gap-3">
					<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-stone-200 bg-stone-50 text-stone-500">
						<MapIcon className="size-4" />
					</div>

					<div className="min-w-0 flex-1">
						<div className="flex items-center gap-2 flex-wrap">
							<h3 className="truncate font-medium text-stone-800">{assignment.title}</h3>
							<span
								className={cn(
									"inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border shrink-0",
									statusCfg.badge,
								)}
							>
								<span className={cn("size-1.5 rounded-full", statusCfg.dot)} />
								{statusCfg.label}
							</span>
						</div>

						{assignment.description && (
							<p className="truncate text-sm text-stone-500 mt-1">{assignment.description}</p>
						)}

						<div className="mt-1.5 flex flex-wrap items-center gap-2">
							<span className="text-xs text-stone-600">
								{assignment.goalMapTitle ?? "No goal map"}
							</span>
							<span className="text-stone-300">·</span>
							<span className="flex items-center gap-1 text-xs text-stone-500">
								<CalendarIcon className="size-3" />
								{formatDueDate(assignment.dueAt)}
							</span>
							<span className="text-stone-300">·</span>
							<span className="text-xs text-stone-400">
								{(assignment.assignedCohortCount ?? 0) > 0 && (
									<>
										{assignment.assignedCohortCount} cohort
										{(assignment.assignedCohortCount ?? 0) > 1 ? "s" : ""}
									</>
								)}
								{(assignment.assignedCohortCount ?? 0) > 0 &&
									(assignment.assignedDirectUserCount ?? 0) > 0 && <>, </>}
								{(assignment.assignedDirectUserCount ?? 0) > 0 && (
									<>
										{assignment.assignedDirectUserCount} direct user
										{(assignment.assignedDirectUserCount ?? 0) > 1 ? "s" : ""}
									</>
								)}
							</span>
						</div>

						<div className="mt-3 flex flex-wrap items-center gap-4">
							<div className="flex items-center gap-2">
								<UsersIcon className="size-3.5 text-stone-400" />
								<div className="flex items-baseline gap-1">
									<span className="text-sm font-medium text-stone-700">
										{assignment.submittedStudents ?? 0}
									</span>
									<span className="text-sm text-stone-400">/{assignment.totalStudents ?? 0}</span>
								</div>
								<ProgressBar
									current={assignment.submittedStudents ?? 0}
									total={assignment.totalStudents ?? 0}
								/>
							</div>

							{attachedForms.length > 0 && (
								<div className="hidden sm:flex items-center gap-3 pl-3 border-l border-stone-200">
									{formConfigs.map((form) =>
										form.hasForm ? (
											<div
												key={form.key}
												className="flex items-center gap-1.5"
												title={`${form.label}: ${form.submitted ?? 0}/${form.total ?? 0}`}
											>
												<span className="text-stone-400">{form.icon}</span>
												<span className="text-xs text-stone-500">
													{form.submitted ?? 0}/{form.total ?? 0}
												</span>
											</div>
										) : null,
									)}
								</div>
							)}
						</div>
					</div>

					{(onViewDetails || onDelete) && (
						<div className="flex items-center gap-1">
							<DropdownMenu>
								<DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
									<Button
										variant="ghost"
										size="icon"
										className="h-7 w-7 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 text-stone-400 hover:text-stone-600"
									>
										<MoreVertical className="size-4" />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end" className="border-stone-200">
									{onViewDetails && (
										<DropdownMenuItem
											onClick={(e) => {
												e.stopPropagation();
												onViewDetails(assignment);
											}}
										>
											<Pencil className="mr-2 size-4" />
											View Details
										</DropdownMenuItem>
									)}
									{onDelete && (
										<DropdownMenuItem
											onClick={(e) => {
												e.stopPropagation();
												onDelete(assignment.id);
											}}
											className="text-stone-700"
										>
											<Trash2 className="mr-2 size-4" />
											Delete
										</DropdownMenuItem>
									)}
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					)}
				</div>
			</CardContent>
		</Card>
	);
}

function StudentCard({
	assignment,
	onClick,
}: {
	assignment: AssignmentListItem;
	onClick?: (a: AssignmentListItem) => void;
}) {
	const status = getStudentStatus(assignment);
	const statusCfg = studentStatusConfig[status];

	return (
		<Card
			className={cn(
				"group relative overflow-hidden border border-stone-200 shadow-none transition-all duration-200 py-2",
				"hover:border-primary/40 hover:shadow-sm hover:bg-stone-50/50",
				"cursor-pointer bg-white",
			)}
			onClick={() => onClick?.(assignment)}
		>
			<CardContent className="p-3">
				<div className="flex items-start gap-3">
					<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-stone-200 bg-stone-50 text-stone-500">
						<MapIcon className="size-4" />
					</div>

					<div className="min-w-0 flex-1">
						<div className="flex items-center gap-2 flex-wrap">
							<h3 className="truncate font-medium text-stone-800">{assignment.title}</h3>
							<span
								className={cn(
									"inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border shrink-0",
									statusCfg.badge,
								)}
							>
								<span className={cn("size-1.5 rounded-full", statusCfg.dot)} />
								{statusCfg.label}
							</span>
						</div>

						{assignment.description && (
							<p className="truncate text-sm text-stone-500 mt-1">{assignment.description}</p>
						)}

						<div className="mt-1.5 flex flex-wrap items-center gap-2">
							<span className="text-xs text-stone-600">
								{assignment.goalMapTitle ?? "No goal map"}
							</span>
							<span className="text-stone-300">·</span>
							<span className="flex items-center gap-1 text-xs text-stone-500">
								<CalendarIcon className="size-3" />
								{formatDueDate(assignment.dueAt)}
							</span>
							{(assignment.attempt ?? 0) > 0 && (
								<>
									<span className="text-stone-300">·</span>
									<span className="text-xs text-stone-400">
										Attempt {assignment.attempt}
									</span>
								</>
							)}
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

export function AssignmentList({
	assignments,
	viewMode,
	onViewDetails,
	onDelete,
	onClick,
	className,
}: AssignmentListProps) {
	if (assignments.length === 0) {
		return (
			<div
				className={cn(
					"flex flex-col items-center justify-center py-12 text-center border border-stone-200 rounded-lg bg-card",
					className,
				)}
			>
				<MapIcon className="size-12 text-stone-400 mb-3" />
				<h3 className="font-medium text-stone-700 mb-1">
					{viewMode === "teacher" ? "No assignments yet" : "No assignments"}
				</h3>
				<p className="text-sm text-stone-500 mb-4">
					{viewMode === "teacher"
						? "Create your first assignment to get started"
						: "You don't have any assignments yet"}
				</p>
			</div>
		);
	}

	return (
		<div className={cn("grid gap-2", className)}>
			{assignments.map((assignment) =>
				viewMode === "teacher" ? (
					<TeacherCard
						key={assignment.id}
						assignment={assignment}
						onViewDetails={onViewDetails}
						onDelete={onDelete}
						onClick={onClick}
					/>
				) : (
					<StudentCard key={assignment.id} assignment={assignment} onClick={onClick} />
				),
			)}
		</div>
	);
}
