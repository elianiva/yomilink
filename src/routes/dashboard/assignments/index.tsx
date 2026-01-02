import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
	AlertCircleIcon,
	BookOpenIcon,
	CalendarIcon,
	CheckCircleIcon,
	ChevronRightIcon,
	ClockIcon,
} from "lucide-react";
import { Guard } from "@/components/auth/Guard";
import { Button } from "@/components/ui/button";
import { LearnerMapRpc } from "@/server/rpc/learner-map";

export const Route = createFileRoute("/dashboard/assignments/")({
	component: () => (
		<Guard roles={["student"]}>
			<AssignmentsPage />
		</Guard>
	),
});

function AssignmentsPage() {
	const { data: assignmentsRaw } = useQuery(
		LearnerMapRpc.listStudentAssignments(),
	);

	// Filter out error responses and ensure array type
	const assignments = Array.isArray(assignmentsRaw) ? assignmentsRaw : [];

	const getStatusInfo = (
		status: string,
		isLate?: boolean,
	): { label: string; color: string; icon: React.ElementType } => {
		if (status === "submitted") {
			return {
				label: "Submitted",
				color: "text-green-600 bg-green-50",
				icon: CheckCircleIcon,
			};
		}
		if (status === "draft") {
			return {
				label: isLate ? "In Progress (Late)" : "In Progress",
				color: isLate
					? "text-amber-600 bg-amber-50"
					: "text-blue-600 bg-blue-50",
				icon: ClockIcon,
			};
		}
		// not_started
		return {
			label: isLate ? "Not Started (Late)" : "Not Started",
			color: isLate ? "text-red-600 bg-red-50" : "text-gray-600 bg-gray-50",
			icon: isLate ? AlertCircleIcon : ClockIcon,
		};
	};

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-semibold flex items-center gap-2">
					<BookOpenIcon className="size-6" />
					My Assignments
				</h1>
				<p className="text-muted-foreground">
					View and complete your assigned concept maps
				</p>
			</div>

			{assignments && assignments.length > 0 ? (
				<div className="grid gap-4 md:grid-cols-2">
					{assignments.map((assignment) => {
						const statusInfo = getStatusInfo(
							assignment.status,
							assignment.isLate ?? false,
						);
						const StatusIcon = statusInfo.icon;

						return (
							<div
								key={assignment.id}
								className="rounded-lg border bg-card p-4 space-y-3 hover:shadow-md transition-shadow"
							>
								<div className="flex items-start justify-between">
									<div className="flex-1">
										<h3 className="font-medium">{assignment.title}</h3>
										{assignment.description && (
											<p className="text-sm text-muted-foreground line-clamp-2 mt-1">
												{assignment.description}
											</p>
										)}
									</div>
									<span
										className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}
									>
										<StatusIcon className="size-3" />
										{statusInfo.label}
									</span>
								</div>

								<div className="flex items-center justify-between">
									<div className="flex items-center gap-4 text-sm text-muted-foreground">
										{assignment.goalMapTitle && (
											<span>{assignment.goalMapTitle}</span>
										)}
										{assignment.dueAt && (
											<div className="flex items-center gap-1">
												<CalendarIcon className="size-4" />
												<span>
													Due {new Date(assignment.dueAt).toLocaleDateString()}
												</span>
											</div>
										)}
										{assignment.attempt > 0 && (
											<span>Attempt {assignment.attempt}</span>
										)}
									</div>

									<Button asChild size="sm" className="gap-1">
										<a
											href={
												assignment.status === "submitted"
													? `/dashboard/learner-map/${assignment.id}/result`
													: `/dashboard/learner-map/${assignment.id}`
											}
										>
											{assignment.status === "not_started"
												? "Start"
												: assignment.status === "submitted"
													? "View Result"
													: "Continue"}
											<ChevronRightIcon className="size-4" />
										</a>
									</Button>
								</div>
							</div>
						);
					})}
				</div>
			) : (
				<div className="text-center py-12 border rounded-lg bg-card">
					<BookOpenIcon className="size-12 mx-auto text-muted-foreground mb-4" />
					<h3 className="font-medium mb-1">No assignments yet</h3>
					<p className="text-sm text-muted-foreground">
						Your teacher hasn't assigned any concept maps to you yet.
					</p>
				</div>
			)}
		</div>
	);
}
