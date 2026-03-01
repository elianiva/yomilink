import { createFileRoute, Link, Outlet, redirect, useLocation } from "@tanstack/react-router";
import { useAtomValue } from "jotai";

import { AppSidebar } from "@/components/app-sidebar";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import type { AuthUser } from "@/lib/auth";
import { pageTitleAtom } from "@/lib/page-title";
import { pathToCrumbs } from "@/lib/utils";
import { getRegistrationFormStatusRpc } from "@/server/rpc/form";
import { getMe, ProfileRpc } from "@/server/rpc/profile";

export const Route = createFileRoute("/dashboard")({
	beforeLoad: async () => {
		const me = await getMe();
		if (!me.success) throw redirect({ to: "/login" });

		// Check registration form completion for students
		if (me.data.role === "student") {
			const result = await getRegistrationFormStatusRpc();

			// Check if result is an error response
			if (!result.success) {
				// Error checking registration status
				// TODO: figure out what to do here, for now just redirect
				throw redirect({
					to: "/dashboard",
				});
			} else {
				// If there's a registration form and it's not completed, redirect to it
				if (
					result.data.hasRegistrationForm &&
					!result.data.isCompleted &&
					result.data.formId
				) {
					throw redirect({
						to: "/dashboard/forms/take",
						search: { formId: result.data.formId },
					});
				}
			}
		}

		return { me };
	},
	loader: async ({ context }) => {
		context.queryClient.setQueryData(ProfileRpc.me(), context.me);
	},
	component: DashboardLayout,
});

function DashboardLayout() {
	const location = useLocation();
	const dynamicTitle = useAtomValue(pageTitleAtom);

	const crumbs = pathToCrumbs(location.pathname, dynamicTitle);

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
								className="mr-2 data-[orientation=vertical]:h-4"
							/>
							<Breadcrumb>
								<BreadcrumbList>
									{crumbs.flatMap((c, i) => {
										const item = (
											<BreadcrumbItem key={c.href}>
												{i < crumbs.length - 1 ? (
													<BreadcrumbLink asChild>
														<Link to={c.href} preload="intent">
															{c.label}
														</Link>
													</BreadcrumbLink>
												) : (
													<BreadcrumbPage>{c.label}</BreadcrumbPage>
												)}
											</BreadcrumbItem>
										);
										return i < crumbs.length - 1
											? [item, <BreadcrumbSeparator key={`sep-${c.href}`} />]
											: [item];
									})}
								</BreadcrumbList>
							</Breadcrumb>
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
