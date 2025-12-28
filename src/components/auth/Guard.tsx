import { useQuery } from "@tanstack/react-query";
import { Navigate, useLocation } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { ProfileRpc } from "@/server/rpc/profile";

export type Role = "teacher" | "admin" | "student";

type GuardProps = {
	roles?: Role[];
	children: ReactNode;
	fallback?: ReactNode;
	redirectTo?: string;
};

/**
 * Role-based UI/page guard. Place around page content to restrict by role.
 * Example:
 * ```tsx
 *   <Guard roles={["teacher", "admin"]}>...</Guard>
 *   <Guard roles={["student"]}>...</Guard>
 * ```
 *
 * If roles is omitted or empty, it allows any authenticated user (or anyone when auth gate is disabled).
 */
export function Guard({
	roles,
	children,
	fallback,
	redirectTo = "/dashboard",
}: GuardProps) {
	const location = useLocation();
	const { data: user } = useQuery(ProfileRpc.getMe());

	// No roles means allow-through (useful when Dashboard layout already handles auth)
	if (!roles || roles.length === 0) {
		return <>{children}</>;
	}

	const role = user?.role ?? "";

	if (role && roles.includes(role as Role)) {
		return <>{children}</>;
	}

	if (fallback) {
		return <>{fallback}</>;
	}

	// Avoid redirect loop if already at redirect target
	if (location.pathname !== redirectTo) {
		return <Navigate to={redirectTo} />;
	}

	return (
		<div className="p-4 text-sm text-muted-foreground">Access restricted.</div>
	);
}
