import { createFileRoute, redirect } from "@tanstack/react-router";

import { getMe } from "@/server/rpc/profile";

export const Route = createFileRoute("/")({
	ssr: true,
	component: () => null,
	beforeLoad: async () => {
		const me = await getMe();
		if (me.success) {
			// Redirect students to assignments, others to dashboard
			const target = me.data.role === "student" ? "/dashboard/assignments" : "/dashboard";
			throw redirect({ to: target });
		}
		throw redirect({ to: "/login" });
	},
});
