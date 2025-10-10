import { useAuthToken } from "@convex-dev/auth/react";
import {
  createFileRoute,
  Link,
  Navigate,
  Outlet,
  useLocation,
} from "@tanstack/react-router";
import {
  BarChart3,
  BookOpen,
  ChevronRight,
  ClipboardList,
  FolderOpen,
  Home as HomeIcon,
  LogIn,
  Plus,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export const Route = createFileRoute("/dashboard")({
  component: DashboardLayout,
});

type Role = "student" | "teacher";
const DISABLE_AUTH_GUARD = true;

function QuickAction({ role }: { role: Role }) {
  if (role === "teacher") {
    return (
      <Button className="gap-2">
        <Plus className="size-4" /> Create Assignment
      </Button>
    );
  }
  return (
    <Button variant="outline" className="gap-2">
      <LogIn className="size-4" /> Join Room
    </Button>
  );
}

function DashboardLayout() {
  const token = useAuthToken();
  void token; // keep hook call for future guard enablement
  const location = useLocation();
  const [role, setRole] = useState<Role>("student");
  const [openMap, setOpenMap] = useState<Record<string, boolean>>({
    assignments: false,
  });

  const shouldRedirect = !DISABLE_AUTH_GUARD && !token;

  const isActive = (to: string, exact = false) => {
    if (exact) return location.pathname === to;
    return location.pathname === to || location.pathname.startsWith(to + "/");
  };

  const sections = useMemo(
    () => [
      { key: "home", label: "Home", icon: HomeIcon, to: "/dashboard" },
      {
        key: "assignments",
        label: "Assignments",
        icon: BookOpen,
        to: "/dashboard/assignments",
        children: [
          { key: "assign-active", label: "Active", to: "/dashboard/assignments" },
          {
            key: "assign-archived",
            label: "Archived",
            to: "/dashboard/assignments/archived",
          },
        ],
      },
      { key: "rooms", label: "Rooms", icon: Users, to: "/dashboard/rooms" },
      {
        key: role === "teacher" ? "analytics" : "results",
        label: role === "teacher" ? "Analytics" : "Results",
        icon: BarChart3,
        to: role === "teacher" ? "/dashboard/analytics" : "/dashboard/results",
      },
    ],
    [role],
  );

  const toggleOpen = (key: string) =>
    setOpenMap((m) => ({ ...m, [key]: !m[key] }));

  if (shouldRedirect) {
    return <Navigate to="/login" />;
  }

  return (
    <SidebarProvider>
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
                  const parentActive = isActive(s.to);
                  const hasChildren = Array.isArray(s.children) && s.children.length > 0;
                  const open = hasChildren
                    ? openMap[s.key] || parentActive
                    : false;

                  return (
                    <SidebarMenuItem key={s.key}>
                      {hasChildren ? (
                        <>
                          <SidebarMenuButton
                            data-state={open ? "open" : "closed"}
                            isActive={parentActive}
                            onClick={(e) => {
                              // Navigate on text/icon click; expansion is controlled via the action chevron
                              // Prevent accidental focus side effects
                              e.stopPropagation();
                            }}
                            asChild
                          >
                            <Link to={s.to} preload="intent">
                              <s.icon />
                              <span>{s.label}</span>
                            </Link>
                          </SidebarMenuButton>

                          <SidebarMenuBadge>2</SidebarMenuBadge>

                          <SidebarMenuAction
                            aria-label="Toggle submenu"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              toggleOpen(s.key);
                            }}
                            className={open ? "rotate-90 transition-transform" : "transition-transform"}
                          >
                            <ChevronRight className="size-4" />
                          </SidebarMenuAction>

                          {open ? (
                            <SidebarMenuSub>
                              {s.children!.map((c) => (
                                <SidebarMenuSubItem key={c.key}>
                                  <SidebarMenuSubButton
                                    isActive={isActive(c.to, true)}
                                    asChild
                                  >
                                    <Link to={c.to} preload="intent">
                                      <span>{c.label}</span>
                                    </Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              ))}
                            </SidebarMenuSub>
                          ) : null}
                        </>
                      ) : (
                        <SidebarMenuButton isActive={parentActive} asChild>
                          <Link to={s.to} preload="intent">
                            <s.icon />
                            <span>{s.label}</span>
                          </Link>
                        </SidebarMenuButton>
                      )}
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarSeparator />

          <SidebarGroup>
            <SidebarGroupLabel>Quick Actions</SidebarGroupLabel>
            <SidebarGroupAction aria-label="More" />
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link to="/dashboard/assignments" preload="intent">
                      <Plus className="size-4" />
                      <span>Create Assignment</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link to="/dashboard/rooms" preload="intent">
                      <LogIn className="size-4" />
                      <span>Join Room</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel>Shortcuts</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton variant="outline">
                    <FolderOpen className="size-4" />
                    <span>Sample Maps</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton variant="outline">
                    <ClipboardList className="size-4" />
                    <span>Rubrics</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel>Loading</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuSkeleton />
              <SidebarMenuSkeleton showIcon />
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <div className="text-xs text-muted-foreground px-2">
            Press ⌘B to toggle
          </div>
        </SidebarFooter>

        <SidebarRail />
      </Sidebar>

      <SidebarInset>
        <div className="sticky top-0 z-10 bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/50 border-b">
          <div className="h-14 px-4 flex items-center gap-3">
            <SidebarTrigger />
            <div className="font-semibold">
              {role === "teacher" ? "Teacher Dashboard" : "Student Dashboard"}
            </div>

            <div className="ml-auto flex items-center gap-2">
              <div className="inline-flex rounded-md border p-0.5">
                <Button
                  variant={role === "student" ? "default" : "ghost"}
                  size="sm"
                  className="rounded-[4px]"
                  onClick={() => setRole("student")}
                >
                  Student
                </Button>
                <Button
                  variant={role === "teacher" ? "default" : "ghost"}
                  size="sm"
                  className="rounded-[4px]"
                  onClick={() => setRole("teacher")}
                >
                  Teacher
                </Button>
              </div>

              <QuickAction role={role} />
            </div>
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
