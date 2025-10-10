import { useAuthToken } from "@convex-dev/auth/react";
import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
	component: IndexPage,
});

function IndexPage() {
	const token = useAuthToken();
	if (!token) {
		return <Navigate to="/login" />;
	}
	return <Navigate to="/dashboard" />;
}
