import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { BookOpenIcon } from "lucide-react";

import { Guard } from "@/features/auth/components/Guard";
import { Skeleton } from "@/components/ui/skeleton";
import {
	AssignmentList,
	type AssignmentListItem,
} from "@/features/assignment/components/assignment-list";
import { useRpcQuery } from "@/hooks/use-rpc-query";
import { LearnerMapRpc } from "@/server/rpc/learner-map";

export const Route = createFileRoute("/dashboard/assignments/")({
	component: () => (
		<Guard roles={["student"]}>
			<AssignmentsPage />
		</Guard>
	),
});

function AssignmentsPage() {
	const navigate = useNavigate();
	const { data: assignments, isLoading } = useRpcQuery(LearnerMapRpc.listStudentAssignments());

	const mappedAssignments: AssignmentListItem[] =
		assignments?.map((a) => ({
			id: a.id,
			title: a.title,
			description: a.description,
			goalMapTitle: a.goalMapTitle,
			dueAt: a.dueAt,
			createdAt: a.createdAt ?? Date.now(),
			status: a.status as "not_started" | "draft" | "submitted",
			attempt: a.attempt,
			isLate: a.isLate,
			lastUpdated: a.lastUpdated,
			preTestFormId: a.preTestFormId,
			postTestFormId: a.postTestFormId,
			delayedPostTestFormId: a.delayedPostTestFormId,
			tamFormId: a.tamFormId,
		})) ?? [];

	const handleClick = (assignment: AssignmentListItem) => {
		const path =
			assignment.status === "submitted"
				? "/dashboard/learner-map/$assignmentId/result"
				: "/dashboard/learner-map/$assignmentId";
		void navigate({ to: path, params: { assignmentId: assignment.id } });
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-3">
				<BookOpenIcon className="size-6 text-primary" />
				<div>
					<h1 className="text-2xl font-semibold">My Assignments</h1>
					<p className="text-muted-foreground">
						View and complete your assigned concept maps
					</p>
				</div>
			</div>

			{isLoading ? (
				<div className="flex items-center justify-center">
					<Skeleton className="h-24 w-full rounded-lg" />
				</div>
			) : (
				<AssignmentList
					assignments={mappedAssignments}
					viewMode="student"
					onClick={handleClick}
				/>
			)}
		</div>
	);
}
