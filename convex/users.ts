import { query } from "./_generated/server";
import { getCurrentUser } from "./authz";

/**
 * Current authenticated user profile (minimal) with role.
 * Returns null if not authenticated.
 */
export const me = query({
  args: {},
  handler: async (ctx) => {
    try {
      const { userId, role, user, identity } = await getCurrentUser(ctx as any);
      return {
        id: userId,
        role,
        email: (user as any)?.email ?? (identity as any)?.tokenIdentifier ?? null,
        name: (user as any)?.name ?? null,
      };
    } catch {
      return null;
    }
  },
});
