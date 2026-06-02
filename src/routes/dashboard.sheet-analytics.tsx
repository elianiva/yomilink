import { createFileRoute } from "@tanstack/react-router";

import { SheetAnalyticsContent } from "@/features/analyzer/components/sheet-analytics-content";
import { Guard } from "@/features/auth/components/Guard";

export const Route = createFileRoute("/dashboard/sheet-analytics")({
	component: () => (
		<Guard roles={["teacher", "admin"]}>
			<SheetAnalyticsPage />
		</Guard>
	),
});

function SheetAnalyticsPage() {
	return <SheetAnalyticsContent />;
}
