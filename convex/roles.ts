import type { Id } from "./_generated/dataModel";
import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

export type Role = "admin" | "teacher" | "student";

/**
 * Helper that authorizes using a caller-provided role/user resolver.
 * This avoids passing Convex ctx through helpers to prevent type mismatches.
 */
export async function requireRoleFrom<
	T extends { userId: Id<"users">; role: Role },
>(allowed: Role[], resolve: () => Promise<T>) {
	const { role, userId } = await resolve();
	if (!allowed.includes(role)) {
		throw new Error("forbidden");
	}
	return { userId, role };
}

/**
 * Upsert a role mapping for a user into the user_roles table.
 * Internal-only to be called from server-side code like the seed action.
 */
export const upsertRole = internalMutation({
	args: {
		userId: v.id("users"),
		role: v.union(
			v.literal("admin"),
			v.literal("teacher"),
			v.literal("student"),
		),
	},
	handler: async (ctx, args) => {
		const existing = await ctx.db
			.query("user_roles")
			.withIndex("by_user", (q) => q.eq("userId", args.userId))
			.first();

		if (existing) {
			await ctx.db.patch(existing._id, { role: args.role });
			return { id: existing._id };
		}

		const id = await ctx.db.insert("user_roles", {
			userId: args.userId,
			role: args.role,
		});
		return { id };
	},
});
