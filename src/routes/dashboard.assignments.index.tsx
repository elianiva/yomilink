import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { BookOpenIcon } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import {
	AssignmentList,
	type AssignmentListItem,
} from "@/features/assignment/components/assignment-list";
import { Guard } from "@/features/auth/components/Guard";
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

	const mappedAssignments =
		assignments?.map((a) => ({
			id: a.id,
			title: a.title,
			description: a.description,
			goalMapTitle: a.goalMapTitle,
			dueAt: a.dueAt,
			createdAt: a.createdAt ?? Date.now(),
			status: a.status as "not_started" | "draft" | "submitted",
			preTestCompleted: a.preTestCompleted,
			postTestCompleted: a.postTestCompleted,
			attempt: a.attempt,
			isLate: a.isLate,
			lastUpdated: a.lastUpdated,
			preTestFormId: a.preTestFormId,
			postTestFormId: a.postTestFormId,
			delayedPostTestFormId: a.delayedPostTestFormId,
			tamFormId: a.tamFormId,
		})) ?? [];

	const handleClick = (assignment: AssignmentListItem) => {
		void navigate({
			to: "/dashboard/assignments/$assignmentId",
			params: { assignmentId: assignment.id },
		});
	};

	return (
		<div className="space-y-4 py-4">
			<PageHeader
				icon={BookOpenIcon}
				title="My Assignments"
				description="View and complete your assigned concept maps"
			/>
			{isLoading ? (
				<div className="space-y-4 items-center justify-center h-full">
					{Array.from({ length: 4 }).map((_, i) => (
						<Skeleton key={i} className="h-24 w-full rounded-lg" />
					))}
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
