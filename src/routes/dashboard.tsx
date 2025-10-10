import { useAuthToken } from "@convex-dev/auth/react";
import { createFileRoute, Link, Navigate, Outlet, useLocation } from "@tanstack/react-router";
import { FolderOpen } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
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

type Role = "student" | "teacher";
const DISABLE_AUTH_GUARD = true;

function DashboardLayout() {
  const token = useAuthToken();
  void token; // keep hook call for future guard enablement
  const location = useLocation();
  const [role, setRole] = useState<Role>("student");

  const shouldRedirect = !DISABLE_AUTH_GUARD && !token;
  const isEditorRoute =
    location.pathname.startsWith("/dashboard/kit/") ||
    location.pathname.startsWith("/dashboard/goal/");

  const isActive = (to: string, exact = false) => {
    if (exact) return location.pathname === to;
    return location.pathname === to || location.pathname.startsWith(to + "/");
  };

  const sections = useMemo(
    () => [{ key: "kit", label: "Kit", icon: FolderOpen, to: "/dashboard" }],
    [],
  );

  if (shouldRedirect) {
    return <Navigate to="/login" />;
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
            <div className="text-xs text-muted-foreground px-2">Press ⌘B to toggle</div>
          </SidebarFooter>

          <SidebarRail />
        </Sidebar>
      )}

      <SidebarInset>
        <div className="sticky top-0 z-10 bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/50 border-b">
          <div className="h-14 px-4 flex items-center gap-3">
            {!isEditorRoute && <SidebarTrigger />}
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
