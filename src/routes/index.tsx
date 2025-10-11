import { useAuthToken } from "@convex-dev/auth/react";
import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
	component: IndexPage,
});

function IndexPage() {
	const token = useAuthToken();
	// Wait for auth token to resolve to avoid redirect loops
	if (typeof token === "undefined") {
		return null;
	}
	if (token === null) {
		return <Navigate to="/login" />;
	}
	return <Navigate to="/dashboard" />;
}
