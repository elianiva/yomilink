import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, Users, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardHome,
});

function DashboardHome() {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border p-4">
        <h2 className="text-lg font-semibold">Welcome to Yomilink</h2>
        <p className="text-sm text-muted-foreground">
          Choose a section to get started.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border p-4 space-y-2">
          <div className="flex items-center gap-2">
            <BookOpen className="size-4 text-muted-foreground" />
            <div className="font-medium">Assignments</div>
          </div>
          <p className="text-sm text-muted-foreground">
            View active and archived assignments.
          </p>
          <Button asChild variant="outline" className="mt-1">
            <Link to="/dashboard/assignments" preload="intent">
              Open
            </Link>
          </Button>
        </div>

        <div className="rounded-lg border p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Users className="size-4 text-muted-foreground" />
            <div className="font-medium">Rooms</div>
          </div>
          <p className="text-sm text-muted-foreground">
            Join or manage your rooms.
          </p>
          <Button asChild variant="outline" className="mt-1">
            <Link to="/dashboard/rooms" preload="intent">
              Open
            </Link>
          </Button>
        </div>

        <div className="rounded-lg border p-4 space-y-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="size-4 text-muted-foreground" />
            <div className="font-medium">Analytics / Results</div>
          </div>
          <p className="text-sm text-muted-foreground">
            Explore analytics (teacher) or results (student).
          </p>
          <div className="flex gap-2">
            <Button asChild variant="outline" className="mt-1">
              <Link to="/dashboard/analytics" preload="intent">
                Analytics
              </Link>
            </Button>
            <Button asChild variant="outline" className="mt-1">
              <Link to="/dashboard/results" preload="intent">
                Results
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
