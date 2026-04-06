// Assignment Detail Page - Presentational Component

import { formatDistanceToNow } from "date-fns";
import {
	CalendarIcon,
	UsersIcon,
	BookOpenIcon,
	ClipboardListIcon,
	FileTextIcon,
	CheckCircle2Icon,
	CircleIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface FormInfo {
	id: string;
	title: string;
	description: string | null;
	type: string;
	status: string;
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

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-start justify-between">
				<div className="space-y-1">
					<div className="flex items-center gap-2">
						<div className="p-2 rounded-xl bg-primary">
							<ClipboardListIcon className="h-4 w-4 text-primary-foreground" />
						</div>
						<h1 className="text-2xl font-medium">{assignment.title}</h1>
						{assignment.description && (
							<p className="text-muted-foreground max-w-2xl">
								- {assignment.description}
							</p>
						)}
					</div>
					<p className="text-sm text-muted-foreground">Created {timeAgo}</p>
				</div>
			</div>

			{/* Overview Cards */}
			<div className="grid gap-4 md:grid-cols-3">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Goal Map</CardTitle>
						<BookOpenIcon className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-medium">
							{assignment.goalMapTitle || "Unknown"}
						</div>
						<p className="text-xs text-muted-foreground">Learning material</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Start Date</CardTitle>
						<CalendarIcon className="h-4 w-4 text-muted-foreground" />
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
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Due Date</CardTitle>
						<CalendarIcon className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-medium">{formattedDueDate}</div>
						<p className="text-xs text-muted-foreground">
							{assignment.dueAt ? "Assignment deadline" : "No deadline set"}
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Tabs */}
			<Tabs defaultValue="overview" className="space-y-4">
				<TabsList>
					<TabsTrigger value="overview">Overview</TabsTrigger>
					<TabsTrigger value="forms">Forms</TabsTrigger>
					<TabsTrigger value="students">Students</TabsTrigger>
					<TabsTrigger value="settings">Settings</TabsTrigger>
				</TabsList>

				<TabsContent value="overview" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>Learning Material</CardTitle>
							<CardDescription>Goal map used for this assignment</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="flex items-start gap-4 p-4 rounded-lg border bg-card">
								<div className="p-2 rounded-md bg-primary/10">
									<BookOpenIcon className="h-5 w-5 text-primary" />
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
									/>
								)}
								{assignment.postTestForm && (
									<FormCard
										form={assignment.postTestForm}
										label="Post-Test"
										variant="primary"
									/>
								)}
								{assignment.delayedPostTestForm && (
									<FormCard
										form={assignment.delayedPostTestForm}
										label="Delayed Post-Test"
										variant="secondary"
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
										label="TAM Survey"
										variant="secondary"
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
								<CardTitle>Assigned Students</CardTitle>
								<CardDescription>
									Students participating in this assignment
								</CardDescription>
							</div>
							<UsersIcon className="h-5 w-5 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<p className="text-sm text-muted-foreground">
								View the student list from the main assignments page.
							</p>
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
									<p className="text-sm font-medium">TAM Survey</p>
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
	children?: React.ReactNode;
}

function FormCard({ form, label, variant, children }: FormCardProps) {
	return (
		<div className="flex flex-col p-4 rounded-lg border bg-card">
			<div className="flex items-start gap-3">
				<div
					className={`p-2 rounded-md ${
						variant === "primary" ? "bg-primary/10" : "bg-muted"
					}`}
				>
					<FileTextIcon
						className={`h-4 w-4 ${
							variant === "primary" ? "text-primary" : "text-muted-foreground"
						}`}
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
									<CheckCircle2Icon className="h-3 w-3 mr-1" />
									Published
								</>
							) : (
								<>
									<CircleIcon className="h-3 w-3 mr-1" />
									Draft
								</>
							)}
						</Badge>
					</div>
					<Badge variant="outline" className="mt-2 text-xs">
						{label}
					</Badge>
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
