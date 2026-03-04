import { useQueryClient } from "@tanstack/react-query";
import {
	CheckCircle2Icon,
	ClockIcon,
	FlaskConicalIcon,
	LockIcon,
	UnlockIcon,
	UsersIcon,
} from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRpcMutation, useRpcQuery } from "@/hooks/use-rpc-query";
import type { StudentExperimentStatus } from "@/features/assignment/lib/assignment-service";
import { AssignmentRpc } from "@/server/rpc/assignment";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/date-utils";

interface ExperimentFlowDialogProps {
	assignmentId: string;
	assignmentTitle: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

type ExperimentPhase =
	| "preTest"
	| "stratifiedAssignment"
	| "mainAssignment"
	| "postTest"
	| "tamSurvey"
	| "delayedTest";

interface PhaseConfig {
	id: ExperimentPhase;
	label: string;
	description: string;
	icon: React.ElementType;
}

const phases: PhaseConfig[] = [
	{
		id: "preTest",
		label: "Pre-Test",
		description: "Baseline knowledge assessment before the experiment",
		icon: FlaskConicalIcon,
	},
	{
		id: "stratifiedAssignment",
		label: "Stratified Assignment",
		description: "Assign students to experiment (concept map) or control (summarizing) groups based on pre-test scores",
		icon: UsersIcon,
	},
	{
		id: "mainAssignment",
		label: "Main Activity",
		description: "Core learning activity: Concept Map building for experiment group, Summarizing task for control group",
		icon: LockIcon,
	},
	{
		id: "postTest",
		label: "Post-Test",
		description: "Immediate learning assessment after the main activity",
		icon: CheckCircle2Icon,
	},
	{
		id: "tamSurvey",
		label: "Questionnaires",
		description: "TAM (Technology Acceptance Model) and other survey questionnaires",
		icon: UnlockIcon,
	},
	{
		id: "delayedTest",
		label: "Delayed Test",
		description: "Retention assessment to measure long-term learning (typically 7+ days after)",
		icon: ClockIcon,
	},
];

function PhaseStatus({
	phase,
	student,
}: {
	phase: ExperimentPhase;
	student: StudentExperimentStatus;
}) {
	const getStatus = () => {
		switch (phase) {
			case "preTest":
				return student.preTest.completed
					? { status: "completed", label: "Completed" }
					: { status: "pending", label: "Pending" };
			case "stratifiedAssignment":
				return student.groupAssigned
					? {
							status: "completed",
							label: student.groupCondition === "concept_map" ? "Experiment" : "Control",
						}
					: { status: "pending", label: "Not Assigned" };
			case "mainAssignment":
				if (student.mainAssignment.status === "submitted") {
					return {
						status: "completed",
						label: student.groupCondition === "concept_map" ? "Concept Map Done" : "Summary Done",
					};
				}
				if (student.mainAssignment.status === "draft") {
					return {
						status: "in_progress",
						label: student.groupCondition === "concept_map" ? "Building Map..." : "Writing...",
					};
				}
				return student.groupAssigned
					? {
							status: "available",
							label: student.groupCondition === "concept_map" ? "Build Concept Map" : "Write Summary",
						}
					: { status: "locked", label: "Locked" };
			case "postTest":
				return student.postTest.completed
					? { status: "completed", label: "Completed" }
					: student.mainAssignment.status === "submitted"
						? { status: "available", label: "Available" }
						: { status: "locked", label: "Locked" };
			case "tamSurvey":
				return student.tamSurvey.completed
					? { status: "completed", label: "Completed" }
					: student.mainAssignment.status === "submitted"
						? { status: "available", label: "Available" }
						: { status: "locked", label: "Locked" };
			case "delayedTest":
				if (student.delayedTest.completed) {
					return { status: "completed", label: "Completed" };
				}
				if (student.delayedTest.unlocksAt) {
					const now = Date.now();
					const isUnlocked = student.delayedTest.unlocksAt <= now;
					return isUnlocked
						? { status: "available", label: "Available" }
						: {
								status: "scheduled",
								label: `Unlocks ${formatDate(student.delayedTest.unlocksAt)}`,
							};
				}
				return { status: "locked", label: "Locked" };
			default:
				return { status: "pending", label: "Pending" };
		}
	};

	const { status, label } = getStatus();

	const statusStyles = {
		completed: "bg-green-100 text-green-700 border-green-200",
		in_progress: "bg-blue-100 text-blue-700 border-blue-200",
		available: "bg-emerald-100 text-emerald-700 border-emerald-200",
		locked: "bg-gray-100 text-gray-500 border-gray-200",
		pending: "bg-amber-100 text-amber-700 border-amber-200",
		scheduled: "bg-purple-100 text-purple-700 border-purple-200",
	};

	return (
		<span
			className={cn(
				"inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border",
				statusStyles[status as keyof typeof statusStyles],
			)}
		>
			{status === "completed" && <CheckCircle2Icon className="size-3" />}
			{status === "locked" && <LockIcon className="size-3" />}
			{status === "in_progress" && <ClockIcon className="size-3" />}
			{status === "scheduled" && <ClockIcon className="size-3" />}
			{label}
		</span>
	);
}

function StratifiedAssignmentTab({
	students,
	assignmentId,
}: {
	students: StudentExperimentStatus[];
	assignmentId: string;
}) {
	const queryClient = useQueryClient();
	const [localGroups, setLocalGroups] = React.useState<Record<string, string>>(() => {
		const groups: Record<string, string> = {};
		for (const student of students) {
			groups[student.userId] = student.groupCondition ?? "not_assigned";
		}
		return groups;
	});

	const saveMutation = useRpcMutation(AssignmentRpc.saveExperimentGroups(), {
		operation: "save experiment groups",
		showSuccess: true,
		successMessage: "Group assignments saved successfully",
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: AssignmentRpc.getAssignmentExperimentStatus(assignmentId).queryKey,
			});
		},
	});

	const handleGroupChange = (userId: string, condition: string) => {
		setLocalGroups((prev) => ({ ...prev, [userId]: condition }));
	};

	const handleSave = () => {
		const groups = Object.entries(localGroups)
			.filter(([, condition]) => condition !== "not_assigned")
			.map(([userId, condition]) => ({
				userId,
				condition: condition as "summarizing" | "concept_map",
			}));

		saveMutation.mutate({ assignmentId, groups });
	};

	const hasChanges = React.useMemo(() => {
		for (const student of students) {
			const currentCondition = localGroups[student.userId];
			const originalCondition = student.groupCondition ?? "not_assigned";
			if (currentCondition !== originalCondition) return true;
		}
		return false;
	}, [localGroups, students]);

	const studentsCompletedPreTest = students.filter((s) => s.preTest.completed);

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<div className="text-sm text-muted-foreground">
					<span className="font-medium text-foreground">
						{studentsCompletedPreTest.length}
					</span>{" "}
					of{" "}
					<span className="font-medium text-foreground">{students.length}</span>{" "}
					students completed pre-test
				</div>
				<Button
					onClick={handleSave}
					disabled={!hasChanges || saveMutation.isPending}
					size="sm"
				>
					{saveMutation.isPending ? "Saving..." : "Save Assignments"}
				</Button>
			</div>

			<div className="border rounded-md">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Student</TableHead>
							<TableHead>Pre-Test Score</TableHead>
							<TableHead>Group Assignment</TableHead>
							<TableHead>Status</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{students.map((student) => (
							<TableRow key={student.userId}>
								<TableCell>
									<div className="font-medium">{student.userName}</div>
									<div className="text-sm text-muted-foreground">
										{student.userEmail}
									</div>
								</TableCell>
								<TableCell>
									{student.preTest.completed ? (
										<span className="font-medium">
											{student.preTest.score ?? "N/A"}
										</span>
									) : (
										<span className="text-muted-foreground">-</span>
									)}
								</TableCell>
								<TableCell>
									{student.preTest.completed ? (
										<Select
											value={localGroups[student.userId] ?? "not_assigned"}
											onValueChange={(value) =>
												handleGroupChange(student.userId, value)
											}
										>
											<SelectTrigger className="w-[180px]">
												<SelectValue placeholder="Select group" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="not_assigned">
													Not Assigned
												</SelectItem>
												<SelectItem value="concept_map">
													Experiment (Concept Map)
												</SelectItem>
												<SelectItem value="summarizing">
													Control (Summarizing)
												</SelectItem>
											</SelectContent>
										</Select>
									) : (
										<span className="text-muted-foreground text-sm">
											Complete pre-test first
										</span>
									)}
								</TableCell>
								<TableCell>
									{student.groupAssigned ? (
										<Badge
											variant={
												student.groupCondition === "concept_map"
													? "default"
													: "secondary"
											}
										>
											{student.groupCondition === "concept_map"
												? "Experiment"
												: "Control"}
										</Badge>
									) : (
										<Badge variant="outline">Not Assigned</Badge>
									)}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}

function OverviewTab({
	summary,
}: {
	summary: {
		totalStudents: number;
		preTestCompleted: number;
		groupsAssigned: number;
		mainAssignmentCompleted: number;
		postTestCompleted: number;
		tamCompleted: number;
		delayedTestCompleted: number;
	};
}) {
	const getPhaseProgress = (phase: ExperimentPhase) => {
		switch (phase) {
			case "preTest":
				return {
					completed: summary.preTestCompleted,
					total: summary.totalStudents,
					percentage:
						summary.totalStudents > 0
							? (summary.preTestCompleted / summary.totalStudents) * 100
							: 0,
				};
			case "stratifiedAssignment":
				return {
					completed: summary.groupsAssigned,
					total: summary.totalStudents,
					percentage:
						summary.totalStudents > 0
							? (summary.groupsAssigned / summary.totalStudents) * 100
							: 0,
				};
			case "mainAssignment":
				return {
					completed: summary.mainAssignmentCompleted,
					total: summary.totalStudents,
					percentage:
						summary.totalStudents > 0
							? (summary.mainAssignmentCompleted / summary.totalStudents) * 100
							: 0,
				};
			case "postTest":
				return {
					completed: summary.postTestCompleted,
					total: summary.totalStudents,
					percentage:
						summary.totalStudents > 0
							? (summary.postTestCompleted / summary.totalStudents) * 100
							: 0,
				};
			case "tamSurvey":
				return {
					completed: summary.tamCompleted,
					total: summary.totalStudents,
					percentage:
						summary.totalStudents > 0
							? (summary.tamCompleted / summary.totalStudents) * 100
							: 0,
				};
			case "delayedTest":
				return {
					completed: summary.delayedTestCompleted,
					total: summary.totalStudents,
					percentage:
						summary.totalStudents > 0
							? (summary.delayedTestCompleted / summary.totalStudents) * 100
							: 0,
				};
			default:
				return { completed: 0, total: 0, percentage: 0 };
		}
	};

	return (
		<div className="space-y-6">
			<div className="grid gap-4">
				{phases.map((phase) => {
					const progress = getPhaseProgress(phase.id);
					const Icon = phase.icon;

					return (
						<div
							key={phase.id}
							className="flex items-center gap-4 p-4 border rounded-lg"
						>
							<div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
								<Icon className="size-5 text-primary" />
							</div>
							<div className="flex-1 min-w-0">
								<div className="flex items-center justify-between mb-1">
									<h4 className="font-medium">{phase.label}</h4>
									<span className="text-sm text-muted-foreground">
										{progress.completed}/{progress.total}
									</span>
								</div>
								<p className="text-sm text-muted-foreground mb-2">
									{phase.description}
								</p>
								<Progress value={progress.percentage} className="h-2" />
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}

function StudentsProgressTab({ students }: { students: StudentExperimentStatus[] }) {
	return (
		<div className="border rounded-md">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead className="w-[200px]">Student</TableHead>
						{phases.map((phase) => (
							<TableHead key={phase.id} className="text-center">
								<div className="flex flex-col items-center gap-1">
									<phase.icon className="size-4" />
									<span className="text-[10px]">{phase.label}</span>
								</div>
							</TableHead>
						))}
					</TableRow>
				</TableHeader>
				<TableBody>
					{students.map((student) => (
						<TableRow key={student.userId}>
							<TableCell>
								<div className="font-medium text-sm">{student.userName}</div>
								<div className="text-xs text-muted-foreground">
									{student.userEmail}
								</div>
							</TableCell>
							{phases.map((phase) => (
								<TableCell key={phase.id} className="text-center">
									<PhaseStatus phase={phase.id} student={student} />
								</TableCell>
							))}
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}

import { Badge } from "@/components/ui/badge";

export function ExperimentFlowDialog({
	assignmentId,
	assignmentTitle,
	open,
	onOpenChange,
}: ExperimentFlowDialogProps) {
	const { data, isLoading } = useRpcQuery({
		...AssignmentRpc.getAssignmentExperimentStatus(assignmentId),
		enabled: open,
	});

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<FlaskConicalIcon className="size-5" />
						Experiment Flow: {assignmentTitle}
					</DialogTitle>
					<DialogDescription>
						Manage the complete experimental procedure: Pre-test → Stratified
						Assignment → Main Activity (Concept Map/Summarizing) → Post-test →
						Questionnaires → Delayed Test
					</DialogDescription>
				</DialogHeader>

				{isLoading ? (
					<div className="py-12 text-center text-muted-foreground">
						Loading experiment status...
					</div>
				) : data ? (
					<Tabs defaultValue="overview" className="mt-4">
						<TabsList className="grid w-full grid-cols-3">
							<TabsTrigger value="overview">Overview</TabsTrigger>
							<TabsTrigger value="stratified">Stratified Assignment</TabsTrigger>
							<TabsTrigger value="students">Student Progress</TabsTrigger>
						</TabsList>

						<TabsContent value="overview" className="mt-4">
							<OverviewTab summary={data.summary} />
						</TabsContent>

						<TabsContent value="stratified" className="mt-4">
							<StratifiedAssignmentTab
								students={data.students}
								assignmentId={assignmentId}
							/>
						</TabsContent>

						<TabsContent value="students" className="mt-4">
							<StudentsProgressTab students={data.students} />
						</TabsContent>
					</Tabs>
				) : (
					<div className="py-12 text-center text-muted-foreground">
						Failed to load experiment status
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
}
