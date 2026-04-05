import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/goal-map/")({
	component: () => null,
	beforeLoad: () => {
		throw redirect({ to: "/dashboard/goal-map/$goalMapId", params: { goalMapId: "new" } });
	},
});
