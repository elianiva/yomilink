import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

import { Guard } from "@/components/auth/Guard";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy load the heavy Learner Map Editor with React Flow
const LearnerMapEditorWrapper = lazy(() =>
	import("@/features/learner-map/components/learner-map-editor").then((m) => ({
		default: m.LearnerMapEditorWrapper,
	})),
);

function LearnerMapSkeleton() {
	return (
		<div className="h-full relative">
			{/* Header skeleton */}
			<div className="absolute top-4 left-4 z-10 bg-background/80 backdrop-blur-sm border rounded-lg px-4 py-2">
				<Skeleton className="h-5 w-48" />
				<Skeleton className="h-4 w-32 mt-1" />
			</div>

			{/* Canvas skeleton */}
			<div className="rounded-xl border bg-card relative h-full overflow-hidden">
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
		</div>
	);
}

export const Route = createFileRoute("/dashboard/learner-map/$assignmentId")({
	component: () => (
		<Guard roles={["student"]}>
			<Suspense fallback={<LearnerMapSkeleton />}>
				<LearnerMapEditorWrapper />
			</Suspense>
		</Guard>
	),
});
