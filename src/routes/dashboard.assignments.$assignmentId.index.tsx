import { createFileRoute, Link, useNavigate, getRouteApi } from "@tanstack/react-router";
import {
	ArrowLeftIcon,
	CheckCircle2Icon,
	ChevronRightIcon,
	FileTextIcon,
	FlaskConicalIcon,
	MapIcon,
} from "lucide-react";
import { Fragment } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Guard } from "@/features/auth/components/Guard";
import { useRpcQuery } from "@/hooks/use-rpc-query";
import { cn } from "@/lib/utils";
import { LearnerMapRpc } from "@/server/rpc/learner-map";

const routeApi = getRouteApi("/dashboard/assignments/$assignmentId/");

export const Route = createFileRoute("/dashboard/assignments/$assignmentId/")({
	component: () => (
		<Guard roles={["student"]}>
			<AssignmentFlowPage />
		</Guard>
	),
});

type PhaseStatus = "completed" | "active" | "locked" | "skipped";

interface PhaseConfig {
	id: string;
	label: string;
	description: string;
	icon: typeof FlaskConicalIcon;
	status: PhaseStatus;
	action: null | {
		label: string;
		fn: () => void;
	};
}

type AssignmentData = {
	preTestFormId: string | null;
	preTestCompleted: boolean;
	postTestFormId: string | null;
	postTestCompleted: boolean;
	status: string;
};

function makeFormAction(
	formId: string | null,
	completed: boolean,
	activeLabel: string,
	backToFlow: string,
	navigate: ReturnType<typeof useNavigate>,
) {
	if (!formId) return null;
	return {
		label: completed ? "View Result" : activeLabel,
		fn: () =>
			navigate({ to: "/dashboard/forms/take", search: { formId, redirectBack: backToFlow } }),
	};
}

function getPhases(
	assignment: AssignmentData,
	navigate: ReturnType<typeof useNavigate>,
	backToFlow: string,
	assignmentId: string,
): PhaseConfig[] {
	function preTestStatus() {
		if (!assignment.preTestFormId) return "skipped";
		if (assignment.preTestCompleted) return "completed";
		return "active";
	}

	function kitbuildingStatus() {
		if (assignment.preTestFormId && !assignment.preTestCompleted) return "locked";
		if (assignment.status === "submitted") return "completed";
		return "active";
	}

	function postTestStatus() {
		if (!assignment.postTestFormId) return "skipped";
		if (assignment.status !== "submitted") return "locked";
		if (assignment.postTestCompleted) return "completed";
		return "active";
	}

	function preTestAction() {
		if (!assignment.preTestFormId) return null;
		return makeFormAction(
			assignment.preTestFormId,
			assignment.preTestCompleted,
			"Take Pre-Test",
			backToFlow,
			navigate,
		);
	}

	function kitbuildingAction() {
		if (assignment.preTestFormId && !assignment.preTestCompleted) return null;
		if (assignment.status === "submitted") {
			return {
				label: "View Results",
				fn: () =>
					navigate({
						to: "/dashboard/learner-map/$assignmentId/result",
						params: { assignmentId },
					}),
			};
		}
		return {
			label: assignment.status === "draft" ? "Continue Building" : "Start Building",
			fn: () =>
				navigate({ to: "/dashboard/learner-map/$assignmentId", params: { assignmentId } }),
		};
	}

	function postTestAction() {
		if (!assignment.postTestFormId) return null;
		if (assignment.status !== "submitted") return null;
		return makeFormAction(
			assignment.postTestFormId,
			assignment.postTestCompleted,
			"Take Post-Test",
			backToFlow,
			navigate,
		);
	}

	return [
		{
			id: "pre-test",
			label: "Pre-Test",
			description: "Baseline knowledge assessment before the activity",
			icon: FlaskConicalIcon,
			status: preTestStatus(),
			action: preTestAction(),
		},
		{
			id: "kitbuilding",
			label: "Kitbuilding",
			description: "Build your concept map by arranging and connecting the provided concepts",
			icon: MapIcon,
			status: kitbuildingStatus(),
			action: kitbuildingAction(),
		},
		{
			id: "post-test",
			label: "Post-Test",
			description: "Knowledge assessment after completing the activity",
			icon: FileTextIcon,
			status: postTestStatus(),
			action: postTestAction(),
		},
	];
}

function AssignmentFlowPage() {
	const { assignmentId } = routeApi.useParams();
	const navigate = useNavigate();

	const { data: assignments, isLoading } = useRpcQuery(LearnerMapRpc.listStudentAssignments());

	const assignment = assignments?.find((a) => a.id === assignmentId);
	const backToFlow = `/dashboard/assignments/${assignmentId}`;

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-12 text-muted-foreground">
				<p className="text-sm">Loading your assignment...</p>
			</div>
		);
	}

	if (!assignment) {
		return (
			<div className="flex flex-col items-center justify-center py-12 text-center">
				<p className="text-muted-foreground">Assignment not found</p>
				<Button variant="link" asChild className="mt-2">
					<Link to="/dashboard/assignments">Back to My Assignments</Link>
				</Button>
			</div>
		);
	}

	const phases = getPhases(assignment, navigate, backToFlow, assignmentId);
	const visiblePhases = phases.filter((p) => p.status !== "skipped");
	const isComplete = phases.every((p) => p.status === "completed" || p.status === "skipped");

	return (
		<div className="space-y-4 max-w-2xl mx-auto py-4">
			<Button variant="secondary" size="sm" asChild className="-ml-2">
				<Link to="/dashboard/assignments">
					<ArrowLeftIcon className="size-4" />
					My Assignments
				</Link>
			</Button>
			<div>
				<h1 className="text-xl font-medium">{assignment.title}</h1>
				{assignment.description && (
					<p className="text-sm text-muted-foreground mt-1">{assignment.description}</p>
				)}
			</div>

			{/* Stepper - responsive */}
			<div className="flex items-center justify-center gap-0">
				{visiblePhases.map((phase, i) => (
					<Fragment key={phase.id}>
						<div className="flex flex-col items-center gap-2">
							<div
								className={cn(
									"flex size-8 items-center justify-center rounded-full text-sm font-medium transition-colors",
									{
										"bg-primary text-primary-foreground":
											phase.status === "completed",
										"bg-primary/10 text-primary border border-primary/30":
											phase.status === "active",
										"bg-muted text-muted-foreground":
											phase.status !== "completed" &&
											phase.status !== "active",
									},
								)}
							>
								{phase.status === "completed" ? (
									<CheckCircle2Icon className="size-4" />
								) : (
									i + 1
								)}
							</div>
							<span
								className={cn(
									"text-sm",
									phase.status === "active"
										? "font-medium text-foreground"
										: "text-muted-foreground",
								)}
							>
								{phase.label}
							</span>
						</div>
						{i < visiblePhases.length - 1 && (
							<div
								className={cn(
									"h-px w-12 mx-2 -translate-y-3",
									phase.status === "completed" ? "bg-primary/40" : "bg-border",
								)}
							/>
						)}
					</Fragment>
				))}
			</div>

			<div className="space-y-3">
				{phases.map((phase) => {
					if (phase.status === "skipped") return null;

					const Icon = phase.icon;
					const isLocked = phase.status === "locked";
					const isActive = phase.status === "active";
					const isCompleted = phase.status === "completed";

					return (
						<Card
							key={phase.id}
							className={cn(
								"transition-all py-4",
								isActive && "ring-1 ring-primary/30 border-primary/20",
								isLocked && "opacity-50",
							)}
						>
							<CardContent className="p-4 py-0 flex max-sm:flex-col md:items-start justify-between gap-4">
								<div className="flex gap-4">
									<div
										className={cn(
											"flex size-10 shrink-0 items-center justify-center rounded-lg",
											isCompleted || isActive
												? "bg-primary/10 text-primary"
												: "bg-muted text-muted-foreground",
										)}
									>
										{isCompleted ? (
											<CheckCircle2Icon className="size-5" />
										) : (
											<Icon className="size-5" />
										)}
									</div>
									<div className="flex-1 min-w-0">
										<div className="flex items-center gap-2">
											<h3 className="font-medium">{phase.label}</h3>
											{isCompleted && (
												<Badge
													variant="outline"
													className="text-[11px] h-5 px-1.5 text-emerald-600 border-emerald-200 bg-emerald-50"
												>
													Completed
												</Badge>
											)}
											{isLocked && (
												<Badge
													variant="secondary"
													className="text-[11px] h-5 px-1.5"
												>
													Locked
												</Badge>
											)}
										</div>
										<p className="text-sm text-muted-foreground mt-0.5">
											{phase.description}
										</p>
									</div>
								</div>
								<div className="shrink-0">
									{phase.action && (
										<Button
											className="w-full"
											variant={isActive ? "default" : "outline"}
											size="sm"
											onClick={phase.action.fn}
										>
											{phase.action.label}
											{isActive && <ChevronRightIcon className="size-4" />}
										</Button>
									)}
								</div>
							</CardContent>
						</Card>
					);
				})}
			</div>

			{isComplete && (
				<Card className="border-emerald-200 bg-emerald-50/50">
					<CardContent className="p-6 text-center space-y-3">
						<CheckCircle2Icon className="size-10 text-emerald-600 mx-auto" />
						<div>
							<h3 className="font-semibold text-lg">All steps completed!</h3>
							<p className="text-sm text-muted-foreground mt-1">
								You&apos;ve completed all phases for this assignment.
							</p>
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
