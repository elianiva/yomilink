import {
	createFileRoute,
	Link,
	Outlet,
	redirect,
	useLocation,
} from "@tanstack/react-router";
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
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from "@/components/ui/sidebar";
import { getMe } from "@/server/rpc/profile";

export const Route = createFileRoute("/dashboard")({
	beforeLoad: async () => {
		const me = await getMe();
		if (!me) throw redirect({ to: "/login" });
		return me;
	},
	component: DashboardLayout,
});

function DashboardLayout() {
	const location = useLocation();

	const segments = location.pathname.split("/").filter(Boolean);
	const crumbs = segments.map((seg, idx) => {
		const href = `/${segments.slice(0, idx + 1).join("/")}`;
		const label = decodeURIComponent(seg)
			.replace(/[-_]/g, " ")
			.split(" ")
			.filter(Boolean)
			.map((w) => w.charAt(0).toUpperCase() + w.slice(1))
			.join(" ");
		return { href, label };
	});

	return (
		<SidebarProvider>
			<AppSidebar className="border-none" />
			<SidebarInset className="p-3 bg-sidebar">
				<main className="bg-white h-full rounded-xl flex flex-col">
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
														<Link to={c.href}>{c.label}</Link>
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

function DashboardContent() {}
