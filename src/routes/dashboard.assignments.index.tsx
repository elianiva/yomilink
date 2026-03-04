import { createFileRoute, Link } from "@tanstack/react-router";
import {
	AlertCircleIcon,
	BookOpenIcon,
	CalendarIcon,
	CheckCircleIcon,
	ChevronRightIcon,
	ClockIcon,
} from "lucide-react";

import { Guard } from "@/components/auth/Guard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRpcQuery } from "@/hooks/use-rpc-query";
import { formatDate } from "@/lib/date-utils";
import { LearnerMapRpc } from "@/server/rpc/learner-map";

export const Route = createFileRoute("/dashboard/assignments/")({
	component: () => (
		<Guard roles={["student"]}>
			<AssignmentsPage />
		</Guard>
	),
});

function AssignmentsPage() {
	const { data: assignments } = useRpcQuery(LearnerMapRpc.listStudentAssignments());

	const getStatusBadge = (
		status: string,
		isLate?: boolean,
	): {
		label: string;
		variant: "default" | "secondary" | "destructive" | "outline";
		icon: React.ElementType;
	} => {
		if (status === "submitted") {
			return {
				label: "Submitted",
				variant: "secondary",
				icon: CheckCircleIcon,
			};
		}
		if (status === "draft") {
			return {
				label: isLate ? "In Progress (Late)" : "In Progress",
				variant: isLate ? "destructive" : "default",
				icon: ClockIcon,
			};
		}
		// not_started
		return {
			label: isLate ? "Not Started (Late)" : "Not Started",
			variant: isLate ? "destructive" : "outline",
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
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{assignments.map((assignment) => {
						const statusBadge = getStatusBadge(
							assignment.status,
							assignment.isLate ?? false,
						);
						const StatusIcon = statusBadge.icon;

						return (
							<div
								key={assignment.id}
								className="rounded-lg border bg-card p-4 space-y-4"
							>
								<div className="flex items-start justify-between gap-3">
									<div className="space-y-1 min-w-0">
										<div className="flex items-center gap-2 flex-wrap">
											<h3 className="font-medium truncate">
												{assignment.title}
											</h3>
											<Badge variant={statusBadge.variant} className="gap-1">
												<StatusIcon className="size-3" />
												{statusBadge.label}
											</Badge>
										</div>
										{assignment.description && (
											<p className="text-sm text-muted-foreground line-clamp-2">
												{assignment.description}
											</p>
										)}
									</div>
								</div>

								<div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
									{assignment.goalMapTitle && (
										<span>{assignment.goalMapTitle}</span>
									)}
									{assignment.dueAt && (
										<div className="flex items-center gap-1">
											<CalendarIcon className="size-4" />
											<span>Due {formatDate(assignment.dueAt)}</span>
										</div>
									)}
									{assignment.attempt > 0 && (
										<span>Attempt {assignment.attempt}</span>
									)}
								</div>

								{/* Related Forms for the Assignment */}
								{(assignment.preTestFormId ||
									assignment.postTestFormId ||
									assignment.delayedPostTestFormId ||
									assignment.tamFormId) && (
									<div className="rounded-md border p-3 space-y-2">
										<p className="text-sm font-medium">Available Forms</p>
										<div className="flex flex-wrap gap-2">
											{assignment.preTestFormId && (
												<Button
													asChild
													variant="outline"
													size="sm"
													className="h-7 text-[10px]"
												>
													<Link
														to="/dashboard/forms/take"
														search={{
															formId: assignment.preTestFormId,
														}}
													>
														Pre-Test
													</Link>
												</Button>
											)}
											{assignment.status === "submitted" &&
												assignment.postTestFormId && (
													<Button
														asChild
														variant="outline"
														size="sm"
														className="h-7 text-[10px]"
													>
														<Link
															to="/dashboard/forms/take"
															search={{
																formId: assignment.postTestFormId,
															}}
														>
															Post-Test
														</Link>
													</Button>
												)}
											{assignment.status === "submitted" &&
												assignment.tamFormId && (
													<Button
														asChild
														variant="outline"
														size="sm"
														className="h-7 text-[10px]"
													>
														<Link
															to="/dashboard/forms/take"
															search={{
																formId: assignment.tamFormId,
															}}
														>
															TAM Survey
														</Link>
													</Button>
												)}
											{assignment.status === "submitted" &&
												assignment.delayedPostTestFormId && (
													<Button
														asChild
														variant="outline"
														size="sm"
														className="h-7 text-[10px]"
													>
														<Link
															to="/dashboard/forms/take"
															search={{
																formId: assignment.delayedPostTestFormId,
															}}
														>
															Delayed-Test
														</Link>
													</Button>
												)}
										</div>
									</div>
								)}

								<Button asChild size="sm" className="gap-1 w-full">
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
