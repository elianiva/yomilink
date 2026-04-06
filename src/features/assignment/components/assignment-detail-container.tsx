import { useParams } from "@tanstack/react-router";
import { useSetAtom } from "jotai";

import { ErrorCard } from "@/components/error-card";
import { NotFoundCard } from "@/components/not-found-card";
import { useRpcQuery } from "@/hooks/use-rpc-query";
import { pageTitleAtom } from "@/lib/page-title";
import { AssignmentRpc } from "@/server/rpc/assignment";

import { AssignmentDetailPage } from "./assignment-detail-page";
import { AssignmentDetailSkeleton } from "./assignment-detail-skeleton";

export function AssignmentDetailContainer() {
	const { assignmentId } = useParams({ from: "/dashboard/assignments/manage/$assignmentId" });
	const setPageTitle = useSetAtom(pageTitleAtom);

	const {
		data: assignment,
		rpcError,
		isLoading,
	} = useRpcQuery(AssignmentRpc.getAssignmentById(assignmentId));

	if (isLoading) {
		setPageTitle(null);
		return <AssignmentDetailSkeleton />;
	}

	if (rpcError) {
		setPageTitle(null);
		return <ErrorCard title="Failed to load assignment" description={rpcError} />;
	}

	if (!assignment) {
		setPageTitle(null);
		return <NotFoundCard resource="Assignment" />;
	}

	setPageTitle(assignment.title);
	return <AssignmentDetailPage assignment={assignment} />;
}
