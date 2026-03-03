import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/learner-map")({
	beforeLoad: async () => {
		throw redirect({ to: "/dashboard/assignments" });
	},
});
