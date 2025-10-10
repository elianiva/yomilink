import { createFileRoute } from "@tanstack/react-router";
import { BookOpen } from "lucide-react";

export const Route = createFileRoute("/dashboard/assignments/archived")({
  component: ArchivedAssignmentsPage,
});

function ArchivedAssignmentsPage() {
  const archived = [
    { id: "aa1", title: "Unit 1: Ecosystems" },
    { id: "aa2", title: "Unit 2: Energy Flow" },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <BookOpen className="size-4 text-muted-foreground" />
        Archived Assignments
      </h2>

      <ul className="space-y-2">
        {archived.map((a) => (
          <li key={a.id} className="rounded-md border p-3">
            {a.title}
          </li>
        ))}
      </ul>
    </div>
  );
}
