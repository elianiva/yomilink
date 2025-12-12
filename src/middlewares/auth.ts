import { redirect } from "@tanstack/react-router";
import { createMiddleware } from "@tanstack/react-start";
import { getServerUser } from "@/lib/auth";

export const authMiddleware = createMiddleware().server(
	async ({ next, request }) => {
		const user = getServerUser(request.headers);
		if (!user) throw redirect({ to: "/login" });
		return await next({
			context: {
				user,
			},
		});
	},
);
