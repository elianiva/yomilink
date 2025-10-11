import { Id } from "./_generated/dataModel";
import { internalQuery } from "./_generated/server";
import type { Role } from "./roles";

export const currentPrincipal = internalQuery({
	args: {},
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("unauthorized");
		}

		const userId = identity.subject.split("|").at(0);

		const user = await ctx.db
			.query("users")
      .withIndex("by_id", (q) => q.eq("_id", userId as Id<"users">))
			.unique();

		if (!user) {
			throw new Error("user_not_found");
		}

		const roleDoc = await ctx.db
			.query("user_roles")
			.withIndex("by_user", (q) => q.eq("userId", user._id))
			.first();

		const role: Role = roleDoc?.role ?? "student";
		return { userId: user._id, role };
	},
});
