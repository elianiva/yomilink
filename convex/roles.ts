import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Upsert a role mapping for a user into the user_roles table.
 * Internal-only to be called from server-side code like the seed action.
 */
export const upsertRole = internalMutation({
  args: {
    userId: v.id("users"),
    role: v.union(v.literal("admin"), v.literal("teacher"), v.literal("student")),
  },
  handler: async (ctx, args) => {
    const existing = await (ctx as any).db
      .query("user_roles")
      .withIndex("by_user" as any, (q: any) => q.eq("userId", args.userId as any))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { role: args.role as any });
      return { id: existing._id };
    }

    const id = await ctx.db.insert("user_roles", {
      userId: args.userId as any,
      role: args.role as any,
    });
    return { id };
  },
});
