import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { Guard } from "@/features/auth/components/Guard";
import { useRpcQuery } from "@/hooks/use-rpc-query";
import { LearnerMapRpc } from "@/server/rpc/learner-map";

const LearnerMapEditorWrapper = lazy(() =>
	import("@/features/learner-map/components/learner-map-editor").then((m) => ({
		default: m.LearnerMapEditorWrapper,
	})),
);

function LearnerMapSkeleton() {
	return (
		<div className="h-full relative bg-card overflow-hidden">
			<div className="absolute inset-0 flex items-center justify-center">
				<div className="flex flex-col items-center gap-4">
					<Skeleton className="h-8 w-48" />
					<Skeleton className="h-4 w-32" />
					<div className="flex gap-2 mt-4">
						<Skeleton className="h-10 w-20" />
						<Skeleton className="h-10 w-20" />
						<Skeleton className="h-10 w-20" />
					</div>
				</div>
			</div>
		</div>
	);
}

function LearnerMapPage() {
	const { assignmentId } = Route.useParams();

	const { isLoading } = useRpcQuery(LearnerMapRpc.getAssignmentForStudent({ assignmentId }));

	if (isLoading) {
		return <LearnerMapSkeleton />;
	}

	return (
		<Suspense fallback={<LearnerMapSkeleton />}>
			<LearnerMapEditorWrapper />
		</Suspense>
	);
}

export const Route = createFileRoute("/dashboard/learner-map/$assignmentId/")({
	component: () => (
		<Guard roles={["student"]}>
			<LearnerMapPage />
		</Guard>
	),
});
