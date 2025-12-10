import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/")({
	component: function IndexRedirect() {
		const { user } = useAuth();
		if (user === null) {
			return <Navigate to="/login" />;
		}
		return <Navigate to="/dashboard" />;
	},
});
