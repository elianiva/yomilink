import { Link, Navigate, useLocation } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { useRpcQuery } from "@/hooks/use-rpc-query";
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
export function Guard({ roles, children, fallback, redirectTo = "/dashboard" }: GuardProps) {
	const location = useLocation();
	const { data: user } = useRpcQuery(ProfileRpc.getMe());

	// No roles means allow-through (useful when Dashboard layout already handles auth)
	if (!roles || roles.length === 0) {
		return <>{children}</>;
	}

	if (!user) {
		return <Navigate to="/login" />;
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

	// Full-page access denied UI when already at redirect target
	return (
		<div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
			<div className="rounded-2xl border border-border/60 bg-white shadow-sm p-8 max-w-md w-full text-center">
				<div className="mx-auto h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
					<ShieldAlert className="h-8 w-8 text-destructive" />
				</div>
				<h1 className="text-xl font-semibold mb-2">Access Restricted</h1>
				<p className="text-sm text-muted-foreground mb-6">
					You don&apos;t have permission to access this page.
				</p>
				<Button asChild variant="outline">
					<Link to="/dashboard" preload="intent">
						Go to Dashboard
					</Link>
				</Button>
			</div>
		</div>
	);
}
