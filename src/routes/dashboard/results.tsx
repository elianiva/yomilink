import { createFileRoute } from "@tanstack/react-router";
import { BarChart3 } from "lucide-react";

export const Route = createFileRoute("/dashboard/results")({
  component: ResultsPage,
});

function ResultsPage() {
  const results = [
    { id: "rr1", title: "Climate Change", score: 78, feedback: "Good structure. Improve linking phrases." },
    { id: "rr2", title: "The River", score: 64, feedback: "Add supporting nodes for main concepts." },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <BarChart3 className="size-4 text-muted-foreground" />
        Results
      </h2>

      <div className="space-y-3">
        {results.map((r) => (
          <div key={r.id} className="rounded-md border p-3">
            <div className="flex items-center justify-between">
              <div className="font-medium">{r.title}</div>
              <div className="text-sm font-semibold">
                {r.score}
                <span className="text-muted-foreground text-xs">/100</span>
              </div>
            </div>
            <div className="text-xs text-muted-foreground mt-1">{r.feedback}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
