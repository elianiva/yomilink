import { createFileRoute } from "@tanstack/react-router";

import { MetricsContent } from "@/features/analyzer/components/metrics-content";
import { Guard } from "@/features/auth/components/Guard";

export const Route = createFileRoute("/dashboard/analytics/$assignmentId/metrics")({
	component: function AnalyticsMetricsRoute() {
		const { assignmentId } = Route.useParams();
		return (
			<Guard roles={["teacher", "admin"]}>
				<MetricsContent assignmentId={assignmentId} />
			</Guard>
		);
	},
});
