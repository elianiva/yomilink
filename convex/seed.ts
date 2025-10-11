import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { createAccount } from "@convex-dev/auth/server";

export const seedUsers = mutation({
  args: {
    key: v.optional(v.string()),
    users: v.array(
      v.object({
        email: v.string(),
        password: v.string(),
        name: v.optional(v.string()),
        role: v.optional(
          v.union(v.literal("admin"), v.literal("teacher"), v.literal("student")),
        ),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const requiredKey = process.env.SEED_SECRET;
    if (requiredKey && args.key !== requiredKey) {
      throw new Error("forbidden: invalid seed key");
    }

    const results: Array<
      | { email: string; created: true; userId: string }
      | { email: string; created: false; error: string }
    > = [];

    for (const u of args.users) {
      if (!u?.email || !u?.password) {
        results.push({
          email: u?.email ?? "",
          created: false,
          error: "missing email or password",
        });
        continue;
      }

      try {
        const res = await createAccount(ctx as any, {
          provider: "password",
          account: {
            id: u.email,
            secret: u.password,
          },
          profile: {
            email: u.email,
            name: u.name ?? u.email.split("@")[0],
            role: u.role ?? "student",
          },
          shouldLinkViaEmail: true,
        });

        const userId = (res.user as any)._id as string;

        // Upsert role into user_roles
        const existing = await (ctx as any).db
          .query("user_roles")
          .withIndex("by_user" as any, (q: any) => q.eq("userId", userId as any))
          .first();

        if (existing) {
          await ctx.db.patch(existing._id, {
            role: (u.role ?? "student") as any,
          });
        } else {
          await ctx.db.insert("user_roles", {
            userId: userId as any,
            role: (u.role ?? "student") as any,
          });
        }

        results.push({
          email: u.email,
          created: true,
          userId,
        });
      } catch (e: any) {
        const msg = typeof e?.message === "string" ? e.message : String(e);
        results.push({ email: u.email, created: false, error: msg });
      }
    }

    return { ok: true, results };
  },
});
