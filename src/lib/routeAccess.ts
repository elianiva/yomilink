export type Role = "teacher" | "admin" | "student";

export const PUBLIC_ROUTES: string[] = [
  "/dashboard",
];

export const ALLOWED_ROUTE_PATTERNS: Record<Role, string[]> = {
  student: [
    "/dashboard",
    "/dashboard/kit/*",
    "/dashboard/assignments/*",
  ],
  teacher: [
    "/dashboard",
    "/dashboard/goal/*",
    "/dashboard/analytics",
    "/dashboard/results",
    "/dashboard/rooms",
    "/dashboard/assignments/*",
    "/dashboard/kit/*",
  ],
  admin: [
    "/dashboard",
    "/dashboard/goal/*",
    "/dashboard/analytics",
    "/dashboard/results",
    "/dashboard/rooms",
    "/dashboard/assignments/*",
    "/dashboard/kit/*",
  ],
};

/**
 * Simple glob-like matcher supporting:
 * - exact paths: "/dashboard"
 * - prefix wildcards: "/dashboard/kit/*" => matches "/dashboard/kit", "/dashboard/kit/123", etc.
 */
export function matchPattern(pattern: string, path: string): boolean {
  if (pattern.endsWith("/*")) {
    const base = pattern.slice(0, -2);
    if (path === base) return true;
    return path.startsWith(base + "/");
  }
  return path === pattern;
}

export function isRouteAllowed(path: string, role: Role | null | undefined): boolean {
  if (!role) {
    // Guests: only public routes
    return PUBLIC_ROUTES.some((p) => matchPattern(p, path));
  }
  const patterns = ALLOWED_ROUTE_PATTERNS[role] ?? [];
  return patterns.some((p) => matchPattern(p, path));
}

/**
 * Utility to filter arbitrary links/menu items for the current role.
 */
export function filterLinksForRole<T extends { to: string }>(
  items: T[],
  role: Role | null | undefined,
): T[] {
  return items.filter((it) => isRouteAllowed(it.to, role));
}
