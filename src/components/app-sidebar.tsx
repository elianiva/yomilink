import {
	BookOpenIcon,
	ClipboardListIcon,
	FileTextIcon,
	LayoutPanelLeftIcon,
	type LucideIcon,
	ScanSearchIcon,
	UsersIcon,
} from "lucide-react";
import { useMemo } from "react";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarRail,
} from "@/components/ui/sidebar";
import { useRpcQuery } from "@/hooks/use-rpc-query";
import { ProfileRpc } from "@/server/rpc/profile";

type Role = "teacher" | "admin" | "student";

type NavItemWithRoles = {
	title: string;
	url: string;
	icon: LucideIcon;
	isActive?: boolean;
	roles?: Role[]; // If undefined, visible to all roles
};

const NAVBAR_ITEMS: NavItemWithRoles[] = [
	// Teacher/Admin items
	{
		title: "Dashboard",
		url: "/dashboard",
		icon: LayoutPanelLeftIcon,
		roles: ["teacher", "admin"],
	},
	{
		title: "Assignments",
		url: "/dashboard/assignments/manage",
		icon: ClipboardListIcon,
		roles: ["teacher", "admin"],
	},
	{
		title: "Static Analyzer",
		url: "/dashboard/analytics",
		icon: ScanSearchIcon,
		roles: ["teacher", "admin"],
	},
	{
		title: "Forms",
		url: "/dashboard/forms",
		icon: FileTextIcon,
		roles: ["teacher", "admin"],
	},
	{
		title: "Users",
		url: "/dashboard/users",
		icon: UsersIcon,
		roles: ["teacher", "admin"],
	},
	// Student items
	{
		title: "My Assignments",
		url: "/dashboard/assignments",
		icon: BookOpenIcon,
		roles: ["student"],
	},
	{
		title: "My Forms",
		url: "/dashboard/forms/student",
		icon: FileTextIcon,
		roles: ["student"],
	},
];

type AppSidebarProps = React.ComponentProps<typeof Sidebar>;

export function AppSidebar(props: AppSidebarProps) {
	const { data: me } = useRpcQuery(ProfileRpc.getMe());

	// Filter navbar items based on user role
	const filteredItems = useMemo(() => {
		// If no user data yet, show items visible to all (no roles restriction)
		if (!me) {
			return NAVBAR_ITEMS.filter((item) => !item.roles);
		}
		return NAVBAR_ITEMS.filter((item) => {
			// If no roles specified, show to everyone
			if (!item.roles) return true;
			// Check if user's role is in the allowed roles
			return item.roles.includes(me.role);
		});
	}, [me]);

	return (
		<Sidebar collapsible="icon" {...props}>
			<SidebarHeader>
				<div className="flex items-center transition-all duration-200 ease-linear">
					<div className="size-8 transition-all duration-200 ease-linear rounded-lg bg-gradient-to-br from-primary to-primary/80 shadow-sm flex items-center justify-center text-primary-foreground font-semibold text-sm tracking-wide">
						KB
					</div>
					<div className="transition-all ml-2 duration-200 ease-linear group-data-[collapsible=icon]:ml-0 group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:w-0 overflow-hidden">
						<h1 className="text-base font-medium whitespace-nowrap">KitBuild</h1>
						<p className="text-xs text-muted-foreground whitespace-nowrap">
							Kit-Build Concept Map
						</p>
					</div>
				</div>
			</SidebarHeader>
			<SidebarContent>
				<NavMain items={filteredItems} />
			</SidebarContent>
			<SidebarFooter>
				{me ? (
					<NavUser
						user={{
							name: me.name ?? "User",
							email: me.email ?? "user@example.com",
							avatar: me.image ?? "",
						}}
					/>
				) : (
					<div className="flex items-center gap-2 px-2 py-1.5">
						<div className="size-8 rounded-lg bg-muted animate-pulse" />
						<div className="group-data-[collapsible=icon]:hidden space-y-1.5 flex-1 min-w-0">
							<div className="h-4 w-20 bg-muted animate-pulse rounded" />
							<div className="h-3 w-28 bg-muted animate-pulse rounded" />
						</div>
					</div>
				)}
			</SidebarFooter>
			<SidebarRail />
		</Sidebar>
	);
}
