import { useConvexQuery } from "@convex-dev/react-query";
import {
	createFileRoute,
	Outlet,
	useLocation,
} from "@tanstack/react-router";
import { api } from "convex/_generated/api";
import DashboardSidebar from "@/components/dashboard/SidebarNav";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export const Route = createFileRoute("/dashboard")({
	component: DashboardLayout,
});

type Me = {
	id: string;
	role: "teacher" | "admin" | "student";
	email: string | null;
	name: string | null;
};

function DashboardLayout() {
	return <DashboardContent />;
}

function DashboardContent() {
	const location = useLocation();
	const me = useConvexQuery(api.users.me) as Me | undefined | null;

	const isEditorRoute =
		location.pathname.startsWith("/dashboard/kit/") ||
		location.pathname.startsWith("/dashboard/goal/");

	// Sidebar items moved to dedicated component and global route access handled via src/lib/routeAccess.ts

	// Wait for user profile to load after authentication
	if (typeof me === "undefined") {
		return (
			<div className="p-4 text-sm text-muted-foreground">Loading...</div>
		);
	}


	return (
		<SidebarProvider>
			{!isEditorRoute && (
				<DashboardSidebar pathname={location.pathname} role={me?.role ?? null} />
			)}

			<SidebarInset>
				<div className="sticky top-0 z-10 bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/50 border-b">
					<div className="h-14 px-4 flex items-center gap-3">
						{!isEditorRoute && <SidebarTrigger />}
						<div className="font-semibold">Dashboard</div>

						<div className="ml-auto" />
					</div>
				</div>

				{/* Nested routes will render here */}
				<div className="p-4">
					<Outlet />
				</div>
			</SidebarInset>
		</SidebarProvider>
	);
}
