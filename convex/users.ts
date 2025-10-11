import { query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

/**
 * Current authenticated user profile (minimal) with role.
 * Returns null if not authenticated.
 */
export const me = query({
	args: {},
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			return null;
		}

		const tokenIdentifier = (identity as { tokenIdentifier?: string })
			.tokenIdentifier;

		const user = tokenIdentifier
			? await ctx.db
					.query("users")
					.withIndex("by_tokenIdentifier", (q) =>
						q.eq("tokenIdentifier", tokenIdentifier),
					)
					.unique()
			: null;

		if (!user) {
			return null;
		}

		const userId: Id<"users"> = user._id;

		const roleDoc = await ctx.db
			.query("user_roles")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.first();

		const role = roleDoc?.role ?? "student";

		return {
			id: userId,
			role,
			email: user.email ?? tokenIdentifier ?? null,
			name: user.name ?? null,
		};
	},
});
