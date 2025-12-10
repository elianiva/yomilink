"use client";

import { useConvexQuery } from "@convex-dev/react-query";
import { api } from "convex/_generated/api";
import { Activity, Map as MapIcon, ScanSearch, Settings } from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarRail,
} from "@/components/ui/sidebar";

const NAVBAR_ITEMS = [
	{
		title: "Concept Mapping",
		url: "/dashboard",
		icon: MapIcon,
		isActive: true,
	},
	{
		title: "Static Analyzer",
		url: "/dashboard/analytics",
		icon: ScanSearch,
	},
	{
		title: "Dynamic Analyzer",
		url: "/dashboard/results",
		icon: Activity,
	},
	{
		title: "System Administration",
		url: "/dashboard/rooms",
		icon: Settings,
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
	const me = useConvexQuery(api.users.me);
	const displayName = me?.name;
	const displayEmail = me?.email;
	const displayAvatar = me?.image;

	return (
		<Sidebar collapsible="icon" {...props}>
			<SidebarHeader>
				<div className="flex items-center gap-3 px-2 py-2">
					<div className="h-9 w-9 rounded-lg bg-primary/90 ring-4 ring-primary/10 flex items-center justify-center text-primary-foreground font-bold">
						Y
					</div>
					<div>
						<h1 className="text-base font-semibold">KitBuild</h1>
						<p className="text-xs text-muted-foreground">
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
