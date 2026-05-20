import { redirect } from "@tanstack/react-router";
import { createCsrfMiddleware, createMiddleware } from "@tanstack/react-start";
import { Effect } from "effect";

import { getServerUser } from "@/lib/auth";
import { requireAnyRole } from "@/lib/auth-authorization";
import { AppRuntime } from "@/server/app-runtime";

/** Redirects to /login if not authenticated */
export const authMiddleware = createMiddleware().server(async ({ next, request }) => {
	const user = await AppRuntime.runPromise(getServerUser(request.headers));
	if (!user) throw redirect({ to: "/login" });
	return await next({
		context: {
			user,
		},
	});
});

/** Returns null for user if not authenticated */
/**
 * CSRF protection middleware for POST server functions.
 * Checks Sec-Fetch-Site, Origin, or Referer headers.
 */
export const csrfMiddleware = createCsrfMiddleware();

export const authMiddlewareOptional = createMiddleware().server(async ({ next, request }) => {
	const user = await AppRuntime.runPromise(getServerUser(request.headers));
	const clientIp = request.headers.get("CF-Connecting-IP") ?? undefined;
	return await next({
		context: {
			user,
			clientIp,
		},
	});
});

export const requireRoleMiddleware = (...roles: string[]) =>
	createMiddleware()
		.middleware([authMiddleware])
		.server(async ({ next, context }) => {
			await AppRuntime.runPromise(
				requireAnyRole(...roles)(context.user.id).pipe(
					Effect.mapError((e) => new Error(e.message)),
				),
			);

			return next({ context });
		});
