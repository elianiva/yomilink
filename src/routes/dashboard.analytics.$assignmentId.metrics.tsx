import { createFileRoute } from "@tanstack/react-router";

import { MetricsContent } from "@/features/analyzer/components/metrics-content";
import { Guard } from "@/features/auth/components/Guard";

export const Route = createFileRoute("/dashboard/analytics/$assignmentId/metrics")({
	component: () => (
		<Guard roles={["teacher", "admin"]}>
			<AnalyticsMetricsPage />
		</Guard>
	),
});

function AnalyticsMetricsPage() {
	const { assignmentId } = Route.useParams();
	return <MetricsContent assignmentId={assignmentId} />;
}
