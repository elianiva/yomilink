import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { Guard } from "@/components/auth/Guard";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy load the heavy metrics content with Recharts
const MetricsContent = lazy(() =>
	import("@/features/analyzer/components/metrics-content").then((m) => ({
		default: m.MetricsContent,
	})),
);

function MetricsSkeleton() {
	return (
		<div className="space-y-6 p-6">
			<div className="flex items-center gap-4">
				<Skeleton className="h-9 w-32" />
				<div>
					<Skeleton className="h-8 w-48" />
					<Skeleton className="h-4 w-32 mt-1" />
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
				{Array(4)
					.fill(0)
					.map((_, i) => (
						<Card key={i}>
							<CardContent className="pt-6">
								<Skeleton className="h-4 w-24 mb-2" />
								<Skeleton className="h-8 w-16" />
							</CardContent>
						</Card>
					))}
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{Array(2)
					.fill(0)
					.map((_, i) => (
						<Card key={i}>
							<CardContent className="pt-6">
								<Skeleton className="h-6 w-32 mb-2" />
								<Skeleton className="h-4 w-48 mb-4" />
								<Skeleton className="h-64 w-full" />
							</CardContent>
						</Card>
					))}
			</div>
		</div>
	);
}

export const Route = createFileRoute(
	"/dashboard/analytics/$assignmentId/metrics",
)({
	component: () => {
		const { assignmentId } = Route.useParams();
		return (
			<Guard roles={["teacher", "admin"]}>
				<Suspense fallback={<MetricsSkeleton />}>
					<MetricsContent assignmentId={assignmentId} />
				</Suspense>
			</Guard>
		);
	},
});
