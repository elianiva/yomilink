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

	return (
		<div className="min-h-screen flex items-center justify-center bg-background">
			<div className="max-w-md w-full p-8 border rounded-xl bg-card shadow">
				<h1 className="text-2xl font-semibold mb-2">Welcome to Yomilink</h1>
				<p className="text-muted-foreground mb-6">You are signed in.</p>
			</div>
		</div>
	);
}
