import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/analytics/$assignmentId/sheet")({
	beforeLoad: () => {
		throw redirect({ to: "/dashboard/sheet-analytics" });
	},
});
