import { createFileRoute } from "@tanstack/react-router";
import { Users } from "lucide-react";

export const Route = createFileRoute("/dashboard/rooms")({
  component: RoomsPage,
});

function RoomsPage() {
  const rooms = [
    { id: "r1", name: "Room 102", members: 28 },
    { id: "r2", name: "Room 207", members: 31 },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <Users className="size-4 text-muted-foreground" />
        Rooms
      </h2>

      <div className="space-y-2">
        {rooms.map((r) => (
          <div key={r.id} className="rounded-md border p-3 flex items-center justify-between">
            <div>
              <div className="font-medium">{r.name}</div>
              <div className="text-xs text-muted-foreground">{r.members} members</div>
            </div>
            <button className="text-sm underline underline-offset-4 hover:opacity-80">Manage</button>
          </div>
        ))}
      </div>
    </div>
  );
}
