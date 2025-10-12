import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/")({
	beforeLoad: async (opts) => {
		return null;
	},
	component: IndexPage,
});

function IndexPage() {
	const { user } = useAuth();
	if (user === null) {
		return <Navigate to="/login" />;
	}
	return <Navigate to="/dashboard" />;
}
