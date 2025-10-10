import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/dashboard/assignments/")({
  component: AssignmentsPage,
});

function AssignmentsPage() {
  const assignments = [
    { id: "a1", title: "Reading: Climate Change", room: "Room 102", due: "Due in 2d", progress: 45 },
    { id: "a2", title: "Article: Photosynthesis", room: "Room 207", due: "Due in 5d", progress: 10 },
    { id: "a3", title: "Short Story: The River", room: "Room 102", due: "Due in 1w", progress: 0 },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <BookOpen className="size-4 text-muted-foreground" />
          Assignments
        </h2>
        <Button asChild variant="outline" size="sm">
          <Link to="/dashboard/assignments/archived" preload="intent">
            View archived
          </Link>
        </Button>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {assignments.map((a) => (
          <div key={a.id} className="rounded-lg border p-3">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-medium">{a.title}</div>
                <div className="text-xs text-muted-foreground">
                  {a.room} • {a.due}
                </div>
              </div>
              <Button size="sm" variant="outline" className="gap-1">
                Continue <ChevronRight className="size-4" />
              </Button>
            </div>
            <div className="mt-3">
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-primary transition-all" style={{ width: `${a.progress}%` }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
