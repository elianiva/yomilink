import { v } from "convex/values";
import { components } from "./_generated/api";
import { mutation } from "./_generated/server";
import { createAuth } from "./auth";

export const seedUsers = mutation({
	args: {
		key: v.optional(v.string()),
		users: v.array(
			v.object({
				email: v.string(),
				password: v.string(),
				name: v.optional(v.string()),
				roles: v.optional(
					v.array(
						v.union(
							v.literal("admin"),
							v.literal("teacher"),
							v.literal("student"),
						),
					),
				),
			}),
		),
	},
	handler: async (ctx, args) => {
		// Optional seeding guard: require matching secret when provided in env
		const secret = process.env.SEED_SECRET;
		if (secret && args.key !== secret) {
			throw new Error("forbidden");
		}

		// Use Better Auth instance so we call the Admin plugin APIs programmatically
		const auth = createAuth(ctx);

		const results: Array<
			| { email: string; created: true; userId: string }
			| { email: string; created: false; error: string }
		> = [];

		for (const u of args.users) {
			try {
				// Prefer provided display name; fallback to prefix of email
				const displayName = u.name ?? u.email.split("@")[0];

				// Use the roles array as provided, default to ["student"] if none
				const roles = u.roles || ["student"];

				// Call Better Auth Admin plugin: create-user (role applied server-side)
				// The admin plugin response includes user id as "id" (mirrors HTTP API)
				const res = await auth.api.createUser({
					body: {
						email: u.email,
						password: u.password,
						name: displayName,
						role: roles as any,
					},
				});

				const userId: string = res?.user?.id ?? "unknown";

				results.push({ email: u.email, created: true, userId });
			} catch (e: any) {
				// Gracefully capture error per user to continue the batch
				results.push({
					email: u.email,
					created: false,
					error: e?.message ?? "unknown error",
				});
			}
		}

		return { ok: true, results };
	},
});

/**
 * Clean all Better Auth users and related records (sessions, accounts, passkeys, etc).
 * Does not touch application tables.
 */
export const cleanUsers = mutation({
	args: {
		key: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const secret = process.env.SEED_SECRET;
		if (secret && args.key !== secret) {
			throw new Error("forbidden");
		}

		// Wipe Better Auth user-related models
		const models = [
			"session",
			"account",
			"verification",
			"twoFactor",
			"passkey",
			"oauthAccessToken",
			"oauthConsent",
			"oauthApplication",
			"user",
		] as const;

		for (const model of models) {
			try {
				await ctx.runMutation(components.betterAuth.adapter.deleteMany, {
					input: { model },
					paginationOpts: { cursor: null, numItems: 100_000 },
				});
			} catch {
				// ignore to keep idempotent
			}
		}

		return { ok: true };
	},
});

/**
 * Nuke the database: truncate all application data and Better Auth data.
 */
export const nukeDb = mutation({
	args: {
		key: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const secret = process.env.SEED_SECRET;
		if (secret && args.key !== secret) {
			throw new Error("forbidden");
		}

		// 1) Delete application tables (extend this if you add more tables)
		const goalMaps = await ctx.db.query("goal_maps").collect();
		for (const g of goalMaps) {
			await ctx.db.delete(g._id);
		}

		// 2) Delete Better Auth models (full set)
		const authModels = [
			"session",
			"account",
			"verification",
			"twoFactor",
			"passkey",
			"oauthAccessToken",
			"oauthConsent",
			"oauthApplication",
			"user",
			"jwks",
			"rateLimit",
			"ratelimit",
		] as const;

		for (const model of authModels) {
			try {
				await ctx.runMutation(components.betterAuth.adapter.deleteMany, {
					input: { model },
					paginationOpts: { cursor: null, numItems: 100_000 },
				});
			} catch {
				// ignore
			}
		}

		return { ok: true, appDeleted: goalMaps.length };
	},
});
