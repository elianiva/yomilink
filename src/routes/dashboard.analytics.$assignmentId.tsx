import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/analytics/$assignmentId")({
	beforeLoad: async () => {
		throw redirect({ to: "/dashboard/analytics" });
	},
});
