import { redirect } from "@tanstack/react-router";
import { createMiddleware } from "@tanstack/react-start";
import { getServerUser } from "@/lib/auth";

/**
 * Auth middleware that redirects to /login if not authenticated.
 * Use for protected routes/server functions that require authentication.
 */
export const authMiddleware = createMiddleware().server(
	async ({ next, request }) => {
		const user = await getServerUser(request.headers);
		if (!user) throw redirect({ to: "/login" });
		return await next({
			context: {
				user,
			},
		});
	},
);

/**
 * Auth middleware that does NOT redirect.
 * Returns null for user if not authenticated.
 * Use for routes that need to check auth state without forcing a redirect.
 */
export const authMiddlewareOptional = createMiddleware().server(
	async ({ next, request }) => {
		const user = await getServerUser(request.headers);
		return await next({
			context: {
				user,
			},
		});
	},
);
