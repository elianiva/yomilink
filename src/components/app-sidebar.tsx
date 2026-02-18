import { useQuery } from "@tanstack/react-query";
import {
	BookOpenIcon,
	ClipboardListIcon,
	FileTextIcon,
	LayoutPanelLeftIcon,
	type LucideIcon,
	ScanSearchIcon,
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
		url: "/dashboard/forms/builder",
		icon: FileTextIcon,
		roles: ["teacher", "admin"],
	},
	// Student items
	{
		title: "My Assignments",
		url: "/dashboard/assignments",
		icon: BookOpenIcon,
		roles: ["student"],
	},
];

type AppSidebarProps = React.ComponentProps<typeof Sidebar>;

export function AppSidebar(props: AppSidebarProps) {
	const { data: me } = useQuery(ProfileRpc.getMe());
	const displayName = me?.name ?? null;
	const displayEmail = me?.email ?? null;
	const displayAvatar = me?.image ?? null;
	const userRole = me?.role ?? "student";

	// Filter navbar items based on user role
	const filteredItems = useMemo(() => {
		return NAVBAR_ITEMS.filter((item) => {
			// If no roles specified, show to everyone
			if (!item.roles) return true;
			// Check if user's role is in the allowed roles
			return item.roles.includes(userRole);
		}).map(({ roles, ...item }) => item); // Remove roles from the item before passing to NavMain
	}, [userRole]);

	return (
		<Sidebar collapsible="icon" {...props}>
			<SidebarHeader>
				<div className="flex items-center transition-all duration-200 ease-linear">
					<div className="size-8 transition-all duration-200 ease-linear rounded-lg bg-primary/90 ring-4 ring-primary/10 flex items-center justify-center text-primary-foreground font-bold">
						K
					</div>
					<div className="transition-all ml-2 duration-200 ease-linear group-data-[collapsible=icon]:ml-0 group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:w-0 overflow-hidden">
						<h1 className="text-base font-medium whitespace-nowrap">
							KitBuild
						</h1>
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
				<NavUser
					user={{
						name: displayName as string,
						email: displayEmail as string,
						avatar: displayAvatar as string,
					}}
				/>
			</SidebarFooter>
			<SidebarRail />
		</Sidebar>
	);
}
