import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/forms/$formId")({
	beforeLoad: async () => {
		throw redirect({ to: "/dashboard/forms" });
	},
});
