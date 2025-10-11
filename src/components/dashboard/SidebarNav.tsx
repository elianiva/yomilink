import { Link } from "@tanstack/react-router";
import { Activity, Map as MapIcon, ScanSearch, Settings } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { filterLinksForRole, type Role } from "@/lib/routeAccess";

type Section = {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  to: string;
};

const sections: Section[] = [
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
];

function isActive(pathname: string, to: string, exact = false) {
  if (exact) return pathname === to;
  return pathname === to || pathname.startsWith(to + "/");
}

export default function DashboardSidebar({
  pathname,
  role,
}: {
  pathname: string;
  role: Role | null;
}) {
  const items = filterLinksForRole(sections, role);

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2">
          <div className="h-8 w-8 rounded-md bg-primary text-primary-foreground flex items-center justify-center font-bold">
            Y
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold">Yomilink</div>
            <div className="text-xs text-muted-foreground">Kit-Build Concept</div>
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
              {items.map((s) => {
                const active = isActive(pathname, s.to);
                const Icon = s.icon;
                return (
                  <SidebarMenuItem key={s.key}>
                    <SidebarMenuButton isActive={active} asChild>
                      <Link to={s.to} preload="intent">
                        <Icon />
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
        <div className="text-xs text-muted-foreground px-2">Press ⌘B to toggle</div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
