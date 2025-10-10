import { createFileRoute } from "@tanstack/react-router";
import { BarChart3 } from "lucide-react";

export const Route = createFileRoute("/dashboard/analytics")({
  component: AnalyticsPage,
});

function AnalyticsPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <BarChart3 className="size-4 text-muted-foreground" />
        Analytics
      </h2>

      <div className="rounded-lg border p-4 text-sm text-muted-foreground">
        Placeholder: Class analytics (precision, recall, F1 trend).
      </div>
    </div>
  );
}
