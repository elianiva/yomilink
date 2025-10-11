import type { Id } from "./_generated/dataModel";

export type Role = "admin" | "teacher" | "student";

type Ctx = {
  auth: { getUserIdentity: () => Promise<{ subject: string } | null> };
  db: {
    get: (id: Id<"users">) => Promise<any | null>;
  };
};

export async function getCurrentUser(ctx: Ctx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("unauthorized");
  }
  const userId = identity.subject as Id<"users">;
  const user = await ctx.db.get(userId);
  if (!user) {
    throw new Error("user_not_found");
  }
  // Prefer role from user_roles table; fall back to legacy `users.role` or "student"
  const roleDoc = await (ctx as any).db
    .query("user_roles")
    .withIndex("by_user", (q: any) => q.eq("userId", userId))
    .first();
  const role = (roleDoc?.role as Role) ?? ((user as any).role as Role) ?? "student";
  return { userId, role, user, identity };
}

export async function requireRole(ctx: Ctx, allowed: Role[]) {
  const { userId, role } = await getCurrentUser(ctx);
  if (!allowed.includes(role)) {
    throw new Error("forbidden");
  }
  return { userId, role };
}

export async function requireTeacher(ctx: Ctx) {
  return requireRole(ctx, ["teacher", "admin"]);
}

export async function requireAdmin(ctx: Ctx) {
  return requireRole(ctx, ["admin"]);
}
