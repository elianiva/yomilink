import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { Guard } from "@/components/auth/Guard";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy load the heavy Goal Map Editor with React Flow
const GoalMapEditorWrapper = lazy(() =>
	import("@/features/goal-map/components/goal-map-editor").then((m) => ({
		default: m.GoalMapEditorWrapper,
	})),
);

function GoalMapSkeleton() {
	return (
		<div className="h-full relative">
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

export const Route = createFileRoute("/dashboard/goal-map/$goalMapId")({
	component: () => (
		<Guard roles={["teacher", "admin"]}>
			<Suspense fallback={<GoalMapSkeleton />}>
				<GoalMapEditorWrapper />
			</Suspense>
		</Guard>
	),
});
