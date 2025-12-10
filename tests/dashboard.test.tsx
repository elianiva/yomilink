import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { RouterProvider, createRootRoute, createRouter } from "@tanstack/react-router";
import { Route as DashboardRouteFile } from "@/routes/dashboard/index";
import type { AuthUser } from "@/hooks/use-auth";

// Minimal router harness to render the dashboard home
function AppHarness({ user }: { user: AuthUser }) {
  // Mock useAuth
  vi.mock("@/hooks/use-auth", () => ({ useAuth: () => ({ user }) }));

  const rootRoute = createRootRoute({ component: () => null });
  const routeTree = rootRoute.addChildren([DashboardRouteFile]);
  const router = createRouter({ routeTree, history: { kind: "memory", initialEntries: ["/dashboard/"] } as any });
  return <RouterProvider router={router} />;
}

describe("Dashboard Home", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("renders dashboard with Kits section", async () => {
    render(<AppHarness user={{ id: "u", role: "student", email: null, name: null }} />);
    expect(await screen.findByText(/Kits/i)).toBeDefined();
  });
});
