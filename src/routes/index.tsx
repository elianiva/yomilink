import { createFileRoute, redirect } from "@tanstack/react-router";
import { getMe } from "@/server/rpc/me";

export const Route = createFileRoute("/")({
  ssr: true,
	component: () => null,
	beforeLoad: async () => {
		const me = await getMe();
		if (me) throw redirect({ to: "/dashboard" });
		throw redirect({ to: "/login" });
	},
});
