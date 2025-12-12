import {
	ActivityIcon,
	LayoutPanelLeftIcon,
	ScanSearchIcon,
	SettingsIcon,
} from "lucide-react";
import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarRail,
} from "@/components/ui/sidebar";
import { useSession } from "@/lib/auth-client";

const NAVBAR_ITEMS = [
	{
		title: "Dashboard",
		url: "/dashboard",
		icon: LayoutPanelLeftIcon,
		isActive: true,
	},
	{
		title: "Static Analyzer",
		url: "/dashboard/analytics",
		icon: ScanSearchIcon,
	},
	{
		title: "Dynamic Analyzer",
		url: "/dashboard/results",
		icon: ActivityIcon,
	},
	{
		title: "System Administration",
		url: "/dashboard/rooms",
		icon: SettingsIcon,
	},
];

type SidebarUser = {
	name: string | null;
	email: string | null;
	image?: string | null;
	role?: "teacher" | "admin" | "student" | null;
};

type AppSidebarProps = {
	user?: SidebarUser;
} & React.ComponentProps<typeof Sidebar>;

export function AppSidebar(props: AppSidebarProps) {
	const { data: me } = useSession();
	const displayName = me?.user.name ?? null;
	const displayEmail = me?.user.email ?? null;
	const displayAvatar = me?.user.image ?? null;

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
				<NavMain items={NAVBAR_ITEMS} />
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
