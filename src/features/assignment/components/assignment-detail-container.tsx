import { useParams } from "@tanstack/react-router";

import { ErrorCard } from "@/components/error-card";
import { NotFoundCard } from "@/components/not-found-card";
import { useRpcQuery } from "@/hooks/use-rpc-query";
import { AssignmentRpc } from "@/server/rpc/assignment";

import { AssignmentDetailPage } from "./assignment-detail-page";
import { AssignmentDetailSkeleton } from "./assignment-detail-skeleton";

export function AssignmentDetailContainer() {
	const { assignmentId } = useParams({ from: "/dashboard/assignments/manage/$assignmentId" });

	const {
		data: assignment,
		rpcError,
		isLoading,
	} = useRpcQuery(AssignmentRpc.getAssignmentById(assignmentId));

	if (isLoading) {
		return <AssignmentDetailSkeleton />;
	}

	if (rpcError) {
		return <ErrorCard title="Failed to load assignment" description={rpcError} />;
	}

	if (!assignment) {
		return <NotFoundCard resource="Assignment" />;
	}

	return <AssignmentDetailPage assignment={assignment} />;
}
