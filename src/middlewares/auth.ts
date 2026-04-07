import { redirect } from "@tanstack/react-router";
import { createMiddleware } from "@tanstack/react-start";
import { Runtime } from "effect";

import { getServerUser } from "@/lib/auth";
import { requireAnyRole } from "@/lib/auth-authorization";
import { AppRuntime } from "@/server/app-runtime";

/**
 * Auth middleware that redirects to /login if not authenticated.
 * Use for protected routes/server functions that require authentication.
 */
export const authMiddleware = createMiddleware().server(async ({ next, request }) => {
	const user = await Runtime.runPromise(AppRuntime, getServerUser(request.headers));
	if (!user) throw redirect({ to: "/login" });
	return await next({
		context: {
			user,
		},
	});
});

/**
 * Auth middleware that does NOT redirect.
 * Returns null for user if not authenticated.
 * Use for routes that need to check auth state without forcing a redirect.
 */
export const authMiddlewareOptional = createMiddleware().server(async ({ next, request }) => {
	const user = await Runtime.runPromise(AppRuntime, getServerUser(request.headers));
	return await next({
		context: {
			user,
		},
	});
});

/**
 * Creates a middleware that requires specific roles.
 *
 * @param roles - Array of role names that are allowed
 * @returns A middleware that checks user roles
 */
export const requireRoleMiddleware = (...roles: string[]) =>
	createMiddleware()
		.middleware([authMiddleware])
		.server(async ({ next, context }) => {
			try {
				await Runtime.runPromise(AppRuntime, requireAnyRole(...roles)(context.user.id));
			} catch (error) {
				throw new Error((error as { message: string })?.message || "Authorization failed");
			}

			return next({ context });
		});
