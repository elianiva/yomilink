import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/goal-map")({
	beforeLoad: async () => {
		throw redirect({ to: "/dashboard" });
	},
});
