import { Link } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import {
	ArrowUpRightIcon,
	BookOpenIcon,
	CalendarIcon,
	CheckCircle2Icon,
	CircleIcon,
	ClipboardListIcon,
	FileTextIcon,
	GraduationCapIcon,
	UsersIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface FormInfo {
	id: string;
	title: string;
	description: string | null;
	type: string;
	status: string;
}

interface CohortInfo {
	id: string;
	name: string;
	memberCount: number;
}

interface LearnerMapInfo {
	userId: string;
	status: string;
	submittedAt: number | null;
}

export interface AssignmentDetailPageProps {
	assignment: {
		id: string;
		title: string;
		description: string | null;
		goalMapId: string;
		goalMapTitle: string | null;
		startDate: Date | null;
		dueAt: Date | null;
		preTestFormId: string | null;
		postTestFormId: string | null;
		delayedPostTestFormId: string | null;
		tamFormId: string | null;
		preTestForm: FormInfo | null;
		postTestForm: FormInfo | null;
		delayedPostTestForm: FormInfo | null;
		tamForm: FormInfo | null;
		delayedPostTestDelayDays: number | null;
		createdAt: Date;
		updatedAt: Date;
		totalStudents: number;
		submittedStudents: number;
		assignedCohorts: CohortInfo[];
		assignedUsers: Array<{ id: string; name: string; email: string }>;
		learnerMaps: LearnerMapInfo[];
		preTestSubmitted: number | null;
		postTestSubmitted: number | null;
		delayedPostTestSubmitted: number | null;
		tamSubmitted: number | null;
	};
}

export function AssignmentDetailPage({ assignment }: AssignmentDetailPageProps) {
	const formattedStartDate = assignment.startDate
		? new Date(assignment.startDate).toLocaleDateString()
		: "Not set";

	const formattedDueDate = assignment.dueAt
		? new Date(assignment.dueAt).toLocaleDateString()
		: "No due date";

	const timeAgo = assignment.createdAt
		? formatDistanceToNow(new Date(assignment.createdAt), { addSuffix: true })
		: "";

	const submissionRate =
		assignment.totalStudents > 0
			? Math.round((assignment.submittedStudents / assignment.totalStudents) * 100)
			: 0;

	return (
		<div className="space-y-6">
			<div className="flex items-start justify-between gap-4">
				<div className="space-y-1 min-w-0">
					<div className="flex items-center gap-2">
						<div className="p-2 rounded-xl bg-primary shrink-0">
							<ClipboardListIcon className="size-4 text-primary-foreground" />
						</div>
						<h1 className="text-2xl font-medium truncate">{assignment.title}</h1>
					</div>
					{assignment.description && (
						<p className="text-muted-foreground max-w-2xl">{assignment.description}</p>
					)}
					<p className="text-sm text-muted-foreground">Created {timeAgo}</p>
				</div>
				<div className="flex items-center gap-2 shrink-0">
					<Link
						to="/dashboard/goal-map/$goalMapId"
						params={{ goalMapId: assignment.goalMapId }}
					>
						<Button variant="outline" size="sm">
							<BookOpenIcon className="size-4 mr-1.5" />
							Goal Map
						</Button>
					</Link>
					<Link
						to="/dashboard/analytics/$assignmentId"
						params={{ assignmentId: assignment.id }}
					>
						<Button variant="outline" size="sm">
							<ArrowUpRightIcon className="size-4 mr-1.5" />
							Analytics
						</Button>
					</Link>
				</div>
			</div>

			<div className="grid gap-4 md:grid-cols-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Goal Map</CardTitle>
						<BookOpenIcon className="size-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div
							className="text-2xl font-medium truncate"
							title={assignment.goalMapTitle ?? ""}
						>
							{assignment.goalMapTitle || "Unknown"}
						</div>
						<p className="text-xs text-muted-foreground">Learning material</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Start Date</CardTitle>
						<CalendarIcon className="size-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-medium">{formattedStartDate}</div>
						<p className="text-xs text-muted-foreground">
							{assignment.startDate
								? "Assignment starts"
								: "Immediately when published"}
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium">Due Date</CardTitle>
						<CalendarIcon className="size-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-medium">{formattedDueDate}</div>
						<p className="text-xs text-muted-foreground">
							{assignment.dueAt ? "Assignment deadline" : "No deadline set"}
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium">Students</CardTitle>
						<GraduationCapIcon className="size-4 text-muted-foreground" />
					</CardHeader>
					<CardContent className="space-y-2">
						<div className="text-2xl font-medium">
							{assignment.submittedStudents}
							<span className="text-sm text-muted-foreground font-normal">
								/{assignment.totalStudents} submitted
							</span>
						</div>
						<Progress value={submissionRate} className="h-1.5" />
						<p className="text-xs text-muted-foreground">
							{submissionRate}% submission rate
						</p>
					</CardContent>
				</Card>
			</div>

			{assignment.assignedCohorts.length > 0 && (
				<Card>
					<CardHeader className="flex flex-row items-center justify-between py-3">
						<CardTitle className="text-sm font-medium">Assigned Cohorts</CardTitle>
						<UsersIcon className="size-4 text-muted-foreground" />
					</CardHeader>
					<CardContent className="pb-3">
						<div className="flex flex-wrap gap-2">
							{assignment.assignedCohorts.map((cohort) => (
								<Badge
									key={cohort.id}
									variant="secondary"
									className="text-xs gap-1"
								>
									<UsersIcon className="size-3" />
									{cohort.name} ({cohort.memberCount})
								</Badge>
							))}
							{assignment.assignedUsers.length > 0 && (
								<Badge variant="outline" className="text-xs gap-1">
									<UsersIcon className="size-3" />
									{assignment.assignedUsers.length} direct student
									{assignment.assignedUsers.length > 1 ? "s" : ""}
								</Badge>
							)}
						</div>
					</CardContent>
				</Card>
			)}

			<Tabs defaultValue="overview" className="space-y-4">
				<div className="overflow-x-auto -mx-4 md:mx-0">
					<TabsList className="px-4 md:px-0 w-max md:w-auto">
						<TabsTrigger value="overview">Overview</TabsTrigger>
						<TabsTrigger value="forms">Forms</TabsTrigger>
						<TabsTrigger value="students">Students</TabsTrigger>
						<TabsTrigger value="settings">Settings</TabsTrigger>
					</TabsList>
				</div>

				<TabsContent value="overview" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>Learning Material</CardTitle>
							<CardDescription>Goal map used for this assignment</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="flex items-start gap-4 p-4 rounded-lg border bg-card">
								<div className="p-2 rounded-md bg-primary/10">
									<BookOpenIcon className="size-5 text-primary" />
								</div>
								<div className="flex-1 min-w-0">
									<p className="font-medium truncate">
										{assignment.goalMapTitle || "Unknown Goal Map"}
									</p>
									<p className="text-sm text-muted-foreground mt-1">
										ID: {assignment.goalMapId}
									</p>
								</div>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="forms" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>Associated Forms</CardTitle>
							<CardDescription>Forms linked to this assignment</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="grid gap-4 md:grid-cols-2">
								{assignment.preTestForm && (
									<FormCard
										form={assignment.preTestForm}
										label="Pre-Test"
										variant="primary"
										submitted={assignment.preTestSubmitted}
										total={assignment.totalStudents}
									/>
								)}
								{assignment.postTestForm && (
									<FormCard
										form={assignment.postTestForm}
										label="Post-Test"
										variant="primary"
										submitted={assignment.postTestSubmitted}
										total={assignment.totalStudents}
									/>
								)}
								{assignment.delayedPostTestForm && (
									<FormCard
										form={assignment.delayedPostTestForm}
										label="Delayed Post-Test"
										variant="secondary"
										submitted={assignment.delayedPostTestSubmitted}
										total={assignment.totalStudents}
									>
										{assignment.delayedPostTestDelayDays && (
											<p className="text-xs text-muted-foreground mt-2">
												Unlocks {assignment.delayedPostTestDelayDays} days
												after submission
											</p>
										)}
									</FormCard>
								)}
								{assignment.tamForm && (
									<FormCard
										form={assignment.tamForm}
										label="Questionnaire"
										variant="secondary"
										submitted={assignment.tamSubmitted}
										total={assignment.totalStudents}
									/>
								)}
								{!assignment.preTestForm &&
									!assignment.postTestForm &&
									!assignment.delayedPostTestForm &&
									!assignment.tamForm && (
										<p className="text-sm text-muted-foreground md:col-span-2">
											No forms attached to this assignment
										</p>
									)}
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="students" className="space-y-4">
					<Card>
						<CardHeader className="flex flex-row items-center justify-between">
							<div>
								<CardTitle>Students</CardTitle>
								<CardDescription>
									{assignment.totalStudents} student
									{assignment.totalStudents !== 1 ? "s" : ""} assigned
								</CardDescription>
							</div>
							<UsersIcon className="size-5 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							{assignment.totalStudents > 0 ? (
								<div>
									{/* Table - desktop */}
									<div className="hidden md:block overflow-x-auto">
										<table className="w-full text-sm">
											<thead>
												<tr className="border-b">
													<th className="text-left py-2 pr-4 font-medium text-muted-foreground">
														Student
													</th>
													<th className="text-left py-2 px-4 font-medium text-muted-foreground">
														Submission
													</th>
													<th className="text-left py-2 pl-4 font-medium text-muted-foreground">
														Forms
													</th>
												</tr>
											</thead>
											<tbody>
												{assignment.assignedUsers.length > 0 ? (
													assignment.assignedUsers.map((u) => {
														const lm = assignment.learnerMaps.find(
															(l) => l.userId === u.id,
														);
														const submitted =
															lm?.status === "submitted" &&
															lm?.submittedAt !== null;
														return (
															<tr
																key={u.id}
																className="border-b last:border-0"
															>
																<td className="py-2.5 pr-4">
																	<div className="truncate max-w-[200px]">
																		{u.name}
																	</div>
																</td>
																<td className="py-2.5 px-4">
																	{submitted ? (
																		<Badge className="text-xs gap-1">
																			<CheckCircle2Icon className="size-3" />
																			Submitted
																		</Badge>
																	) : (
																		<Badge
																			variant="secondary"
																			className="text-xs gap-1"
																		>
																			<CircleIcon className="size-3" />
																			Pending
																		</Badge>
																	)}
																</td>
																<td className="py-2.5 pl-4">
																	<div className="flex gap-1.5 flex-wrap">
																		{assignment.preTestForm && (
																			<Badge
																				variant="outline"
																				className="text-xs"
																			>
																				Pre
																			</Badge>
																		)}
																		{assignment.postTestForm && (
																			<Badge
																				variant="outline"
																				className="text-xs"
																			>
																				Post
																			</Badge>
																		)}
																	</div>
																</td>
															</tr>
														);
													})
												) : (
													<tr>
														<td
															colSpan={3}
															className="py-6 text-center text-sm text-muted-foreground"
														>
															Student details are loaded through
															cohort assignments.
														</td>
													</tr>
												)}
											</tbody>
										</table>
									</div>

									{/* Cards - mobile */}
									<div className="md:hidden space-y-2">
										{assignment.assignedUsers.length > 0 ? (
											assignment.assignedUsers.map((u) => {
												const lm = assignment.learnerMaps.find(
													(l) => l.userId === u.id,
												);
												const submitted =
													lm?.status === "submitted" &&
													lm?.submittedAt !== null;
												return (
													<div
														key={u.id}
														className="flex items-center justify-between p-3 rounded-lg border"
													>
														<div className="min-w-0 flex-1">
															<p className="text-sm font-medium truncate">
																{u.name}
															</p>
															<div className="flex flex-wrap gap-1 mt-1">
																{assignment.preTestForm && (
																	<Badge
																		variant="outline"
																		className="text-[10px] h-4 px-1"
																	>
																		Pre
																	</Badge>
																)}
																{assignment.postTestForm && (
																	<Badge
																		variant="outline"
																		className="text-[10px] h-4 px-1"
																	>
																		Post
																	</Badge>
																)}
															</div>
														</div>
														<div>
															{submitted ? (
																<Badge className="text-xs gap-1">
																	<CheckCircle2Icon className="size-3" />
																	Submitted
																</Badge>
															) : (
																<Badge
																	variant="secondary"
																	className="text-xs gap-1"
																>
																	<CircleIcon className="size-3" />
																	Pending
																</Badge>
															)}
														</div>
													</div>
												);
											})
										) : (
											<p className="text-sm text-muted-foreground text-center py-4">
												Student details are loaded through cohort
												assignments.
											</p>
										)}
									</div>
								</div>
							) : (
								<p className="text-sm text-muted-foreground">
									No students assigned yet. Assign cohorts or individual students
									to this assignment.
								</p>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="settings" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>Assignment Settings</CardTitle>
							<CardDescription>Configure assignment parameters</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid gap-4 md:grid-cols-2">
								<div className="space-y-2">
									<p className="text-sm font-medium">Delayed Post-Test</p>
									<p className="text-sm text-muted-foreground">
										{assignment.delayedPostTestDelayDays
											? `${assignment.delayedPostTestDelayDays} days after submission`
											: "Not configured"}
									</p>
								</div>
								<div className="space-y-2">
									<p className="text-sm font-medium">Questionnaire</p>
									<p className="text-sm text-muted-foreground">
										{assignment.tamForm ? "Enabled" : "Not configured"}
									</p>
								</div>
							</div>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}

interface FormCardProps {
	form: FormInfo;
	label: string;
	variant: "primary" | "secondary";
	submitted: number | null;
	total: number;
	children?: React.ReactNode;
}

function FormCard({ form, label, variant, submitted, total, children }: FormCardProps) {
	return (
		<div className="flex flex-col p-4 rounded-lg border bg-card">
			<div className="flex items-start gap-3">
				<div
					className={cn(
						"p-2 rounded-md",
						variant === "primary" && "bg-primary/10",
						variant !== "primary" && "bg-muted",
					)}
				>
					<FileTextIcon
						className={cn(
							"size-4",
							variant === "primary" ? "text-primary" : "text-muted-foreground",
						)}
					/>
				</div>
				<div className="flex-1 min-w-0">
					<div className="flex items-center gap-2">
						<p className="font-medium truncate">{form.title}</p>
						<Badge
							variant={form.status === "published" ? "default" : "secondary"}
							className="shrink-0"
						>
							{form.status === "published" ? (
								<>
									<CheckCircle2Icon className="size-3 mr-1" />
									Published
								</>
							) : (
								<>
									<CircleIcon className="size-3 mr-1" />
									Draft
								</>
							)}
						</Badge>
					</div>
					<Badge variant="outline" className="mt-2 text-xs">
						{label}
					</Badge>
					{submitted !== null && (
						<p className="text-xs text-muted-foreground mt-1.5">
							{submitted}/{total} responses
						</p>
					)}
					{form.description && (
						<p className="text-sm text-muted-foreground mt-2 line-clamp-2">
							{form.description}
						</p>
					)}
					{children}
				</div>
			</div>
		</div>
	);
}
