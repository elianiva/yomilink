import { useConvexQuery } from "@convex-dev/react-query";
import {
	createFileRoute,
	Link,
	Navigate,
	Outlet,
	useLocation,
} from "@tanstack/react-router";
import { api } from "convex/_generated/api";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { Activity, Map as MapIcon, ScanSearch, Settings } from "lucide-react";
import { useMemo } from "react";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarInput,
	SidebarInset,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarProvider,
	SidebarRail,
	SidebarTrigger,
} from "@/components/ui/sidebar";

export const Route = createFileRoute("/dashboard")({
	component: DashboardLayout,
});

const DISABLE_AUTH_GUARD = false;

type Me = {
	id: string;
	role: "teacher" | "admin" | "student";
	email: string | null;
	name: string | null;
};

function DashboardLayout() {
	if (DISABLE_AUTH_GUARD) {
		// In dev mode, render content without auth gates
		return <DashboardContent />;
	}
	return (
		<>
			<AuthLoading>
				<div className="p-4 text-sm text-muted-foreground">Loading...</div>
			</AuthLoading>
			<Unauthenticated>
				<Navigate to="/login" />
			</Unauthenticated>
			<Authenticated>
				<DashboardContent />
			</Authenticated>
		</>
	);
}

function DashboardContent() {
	const location = useLocation();
	const me = useConvexQuery(api.users.me) as Me | undefined | null;

	const isEditorRoute =
		location.pathname.startsWith("/dashboard/kit/") ||
		location.pathname.startsWith("/dashboard/goal/");
	const isStudentAllowedRoute =
		location.pathname === "/dashboard" ||
		location.pathname.startsWith("/dashboard/kit/");

	const isActive = (to: string, exact = false) => {
		if (exact) return location.pathname === to;
		return location.pathname === to || location.pathname.startsWith(to + "/");
	};

	const sections = useMemo(
		() => [
			{
				key: "concept",
				label: "Concept Mapping",
				icon: MapIcon,
				to: "/dashboard",
			},
			{
				key: "static",
				label: "Static Analyzer",
				icon: ScanSearch,
				to: "/dashboard/analytics",
			},
			{
				key: "dynamic",
				label: "Dynamic Analyzer",
				icon: Activity,
				to: "/dashboard/results",
			},
			{
				key: "admin",
				label: "System Administration",
				icon: Settings,
				to: "/dashboard/rooms",
			},
		],
		[],
	);

	// Wait for user profile to load after authentication
	if (typeof me === "undefined") {
		return (
			<div className="p-4 text-sm text-muted-foreground">Loading...</div>
		);
	}

	// Role-based guard:
	// - Teachers/Admins: full access
	// - Students: only allowed to access student kit workspace route
	const role = me?.role ?? null;
	const allowed =
		role === "teacher" ||
		role === "admin" ||
		(isStudentAllowedRoute && role === "student");

	if (!allowed) {
		// Avoid looping via "/" (which redirects to /dashboard when authed)
		if (location.pathname !== "/dashboard") {
			return <Navigate to="/dashboard" />;
		}
		return (
			<div className="p-4 text-sm text-muted-foreground">
				Access restricted.
			</div>
		);
	}

	return (
		<SidebarProvider>
			{!isEditorRoute && (
				<Sidebar collapsible="icon" className="border-r">
					<SidebarHeader>
						<div className="flex items-center gap-2 px-2">
							<div className="h-8 w-8 rounded-md bg-primary text-primary-foreground flex items-center justify-center font-bold">
								Y
							</div>
							<div className="leading-tight">
								<div className="text-sm font-semibold">Yomilink</div>
								<div className="text-xs text-muted-foreground">
									Kit-Build Concept
								</div>
							</div>
						</div>
						<div className="px-2 pt-2">
							<SidebarInput placeholder="Search…" />
						</div>
					</SidebarHeader>

					<SidebarContent>
						<SidebarGroup>
							<SidebarGroupLabel>General</SidebarGroupLabel>
							<SidebarGroupContent>
								<SidebarMenu>
									{sections.map((s) => {
										const active = isActive(s.to);
										return (
											<SidebarMenuItem key={s.key}>
												<SidebarMenuButton isActive={active} asChild>
													<Link to={s.to} preload="intent">
														<s.icon />
														<span>{s.label}</span>
													</Link>
												</SidebarMenuButton>
											</SidebarMenuItem>
										);
									})}
								</SidebarMenu>
							</SidebarGroupContent>
						</SidebarGroup>
					</SidebarContent>

					<SidebarFooter>
						<div className="text-xs text-muted-foreground px-2">
							Press ⌘B to toggle
						</div>
					</SidebarFooter>

					<SidebarRail />
				</Sidebar>
			)}

			<SidebarInset>
				<div className="sticky top-0 z-10 bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/50 border-b">
					<div className="h-14 px-4 flex items-center gap-3">
						{!isEditorRoute && <SidebarTrigger />}
						<div className="font-semibold">Teacher Dashboard</div>

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
