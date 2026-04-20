import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { getMe, ProfileRpc } from "@/server/rpc/profile";

export const Route = createFileRoute("/dashboard")({
	beforeLoad: async () => {
		const me = await getMe();
		if (!me.success) throw redirect({ to: "/login" });

		return { me };
	},
	loader: async ({ context }) => {
		context.queryClient.setQueryData(ProfileRpc.me(), context.me);
	},
	component: DashboardLayout,
});

function DashboardLayout() {
	return (
		<SidebarProvider>
			<AppSidebar className="border-none" />
			<SidebarInset className="p-2 pl-0 bg-background">
				<main className="bg-card h-full rounded-xl flex flex-col shadow-sm border border-border/50">
					<header className="flex h-14 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
						<div className="flex items-center gap-2 px-4">
							<SidebarTrigger className="-ml-1" />
							<Separator
								orientation="vertical"
								className="data-[orientation=vertical]:h-4"
							/>
						</div>
					</header>
					<div className="p-4 pt-0 flex-1">
						<Outlet />
					</div>
				</main>
			</SidebarInset>
		</SidebarProvider>
	);
}
