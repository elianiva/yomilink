import { createFileRoute } from "@tanstack/react-router";

import { Guard } from "@/components/auth/Guard";
import { GoalMapEditorWrapper } from "@/features/goal-map/components/goal-map-editor";

export const Route = createFileRoute("/dashboard/goal-map/$goalMapId")({
    component: () => (
        <Guard roles={["teacher", "admin"]}>
            <div className="h-full flex flex-col">
                <GoalMapEditorWrapper />
            </div>
        </Guard>
    ),
});
