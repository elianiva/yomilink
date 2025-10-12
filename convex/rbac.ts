// Lightweight RBAC helper for Convex using Better Auth admin plugin
// Ensures server-side enforcement of role gates.

export type Principal = {
  userId: string;
  roles: string[];
};

export async function requireRoleFrom<T extends string>(
  allowedRoles: readonly T[],
  getPrincipal: () => Promise<Principal>
): Promise<Principal> {
  const principal = await getPrincipal();
  const hasRole =
    (principal.roles ?? []).some((r) => allowedRoles.includes(r as T));
  if (!hasRole) {
    throw new Error("forbidden");
  }
  return principal;
}

export function hasAnyRole<T extends string>(
  roles: readonly T[],
  principal: Principal
): boolean {
  return (principal.roles ?? []).some((r) => roles.includes(r as T));
}
