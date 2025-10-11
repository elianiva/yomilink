import { internalQuery } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import type { Role } from "./roles";

export const currentPrincipal = internalQuery({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("unauthorized");
    }
    const tokenIdentifier = (identity as { tokenIdentifier?: string }).tokenIdentifier;
    const user =
      tokenIdentifier
        ? await ctx.db
            .query("users")
            .withIndex("by_tokenIdentifier", (q) => q.eq("tokenIdentifier", tokenIdentifier))
            .unique()
        : null;

    if (!user) {
      throw new Error("user_not_found");
    }

    const roleDoc = await ctx.db
      .query("user_roles")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();
    const role: Role = roleDoc?.role ?? "student";
    const userId: Id<"users"> = user._id;
    return { userId, role };
  },
});
