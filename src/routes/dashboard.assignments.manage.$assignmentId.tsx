import { createFileRoute } from "@tanstack/react-router";

import { Guard } from "@/components/auth/Guard";
import { AssignmentDetailContainer } from "@/features/assignment/components/assignment-detail-container";
import { AssignmentDetailSkeleton } from "@/features/assignment/components/assignment-detail-skeleton";

export const Route = createFileRoute("/dashboard/assignments/manage/$assignmentId")({
	component: () => (
		<Guard roles={["teacher", "admin"]}>
			<AssignmentDetailContainer />
		</Guard>
	),
	pendingComponent: AssignmentDetailSkeleton,
});
