import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { Guard } from "@/features/auth/components/Guard";

const LearnerMapResult = lazy(() =>
	import("@/features/learner-map/components/learner-map-result").then((m) => ({
		default: m.LearnerMapResult,
	})),
);

function ResultSkeleton() {
	return (
		<div className="relative h-full overflow-hidden -mx-6">
			<div className="border-b-[0.5px] bg-background/70 backdrop-blur h-12 px-3 flex items-center gap-2">
				<Skeleton className="h-4 w-32" />
				<Skeleton className="h-5 w-14 rounded-full" />
				<Skeleton className="h-5 w-18 rounded-full" />
				<div className="ml-auto flex items-center gap-1.5">
					<Skeleton className="size-8 rounded-md" />
					<Skeleton className="h-8 w-24 rounded-md" />
				</div>
			</div>

			<div className="absolute inset-0 top-12 flex items-center justify-center bg-muted/30">
				<div className="flex flex-col items-center gap-4">
					<Skeleton className="h-8 w-48" />
					<Skeleton className="h-4 w-32" />
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
