import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

import { Guard } from "@/components/auth/Guard";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy load the Learner Map Result page with React Flow
const LearnerMapResult = lazy(() =>
	import("@/features/learner-map/components/learner-map-result").then((m) => ({
		default: m.LearnerMapResult,
	})),
);

function ResultSkeleton() {
	return (
		<div className="h-full flex flex-col">
			{/* Header skeleton */}
			<div className="border-b bg-background p-4 flex items-center justify-between">
				<div className="flex items-center gap-4">
					<Skeleton className="h-10 w-10" />
					<div>
						<Skeleton className="h-5 w-24" />
						<Skeleton className="h-4 w-16 mt-1" />
					</div>
				</div>
				<Skeleton className="h-10 w-28" />
			</div>

			{/* Content skeleton */}
			<div className="flex-1 flex overflow-hidden">
				{/* Sidebar skeleton */}
				<div className="w-80 border-r p-4 space-y-4">
					<Skeleton className="h-48 w-full" />
					<Skeleton className="h-32 w-full" />
					<Skeleton className="h-40 w-full" />
				</div>

				{/* Map skeleton */}
				<div className="flex-1 relative bg-muted/50">
					<div className="absolute inset-0 flex items-center justify-center">
						<div className="flex flex-col items-center gap-4">
							<Skeleton className="h-8 w-48" />
							<Skeleton className="h-4 w-32" />
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

export const Route = createFileRoute("/dashboard/learner-map/$assignmentId/result")({
	component: () => (
		<Guard roles={["student"]}>
			<Suspense fallback={<ResultSkeleton />}>
				<LearnerMapResult />
			</Suspense>
		</Guard>
	),
});
