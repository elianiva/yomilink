import { createFileRoute } from "@tanstack/react-router";

import { AssignmentDetailContainer } from "@/features/assignment/components/assignment-detail-container";
import { AssignmentDetailSkeleton } from "@/features/assignment/components/assignment-detail-skeleton";
import { Guard } from "@/features/auth/components/Guard";

export const Route = createFileRoute("/dashboard/assignments/manage/$assignmentId")({
	component: () => (
		<Guard roles={["teacher", "admin"]}>
			<AssignmentDetailContainer />
		</Guard>
	),
	pendingComponent: AssignmentDetailSkeleton,
});
