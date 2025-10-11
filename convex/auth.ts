import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";
import type { DataModel } from "./_generated/dataModel";

type Role = "admin" | "teacher" | "student";
function isRole(val: unknown): val is Role {
  return val === "admin" || val === "teacher" || val === "student";
}

// Map extra profile fields (like role) into users documents when present.
// Password provider requires `email` to be a string (not undefined).
const PasswordProvider = Password<DataModel>({
  profile(params) {
    const rawEmail = (params as any)?.email;
    const email = typeof rawEmail === "string" && rawEmail.length > 0 ? rawEmail : undefined;
    if (!email) {
      throw new Error("email is required for Password provider");
    }

    const name = (params as any)?.name as string | undefined;
    const maybeRole = (params as any)?.role;
    const role = isRole(maybeRole) ? maybeRole : undefined;

    return {
      email, // required
      ...(name ? { name } : {}),
      ...(role ? { role } : {}),
    };
  },
});

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [PasswordProvider],
  callbacks: {
    async afterUserCreatedOrUpdated(ctx, args) {
      // Ensure a role row exists for this user; use user's profile role if present, else "student"
      const existing = await (ctx as any).db
        .query("user_roles")
        .withIndex("by_user" as any, (q: any) => q.eq("userId", args.userId as any))
        .first();

      if (!existing) {
        await ctx.db.insert("user_roles", {
          userId: args.userId as any,
          role: "student",
        });
      }
    },
  },
});
