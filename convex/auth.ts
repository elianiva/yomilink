import { createClient, type GenericCtx } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { betterAuth } from "better-auth";
import { admin } from "better-auth/plugins";
import { components } from "./_generated/api";
import {
	ac,
	student,
	teacher,
	admin as adminRole,
} from "../src/auth/permissions";
import type { DataModel } from "./_generated/dataModel";

export const authComponent = createClient<DataModel>(components.betterAuth);

export const createAuth = (
	ctx: GenericCtx<DataModel>,
	{ optionsOnly } = { optionsOnly: false },
) => {
	return betterAuth({
		logger: {
			disabled: optionsOnly,
		},
		baseURL: process.env.SITE_URL,
		database: authComponent.adapter(ctx),
		emailAndPassword: {
			enabled: true,
			requireEmailVerification: false,
		},
		plugins: [
			convex(),
			admin({
				defaultRole: "student",
				ac,
				roles: {
					student,
					teacher,
					admin: adminRole,
				},
			} as any),
		],
	});
};

// Typed auth subject wrapper to avoid leaking raw Better Auth user shape
export type AppRole = "student" | "teacher" | "admin";

export type AuthSubject = {
	id: string;
	name: string | null;
	email: string | null;
	image: string | null;
	roles: AppRole[];
};

/**
 * getAuthSubject()
 * Wraps authComponent.getAuthUser and returns a safe, typed subset with roles as an array.
 * Returns null when unauthenticated.
 */
export async function getAuthSubject(
	ctx: GenericCtx<DataModel>,
): Promise<AuthSubject | null> {
	try {
		const u = await authComponent.getAuthUser(ctx);
		if (!u) return null;

		// Map and narrow values into our guaranteed subset
		// Keep the assertion inside this single utility to avoid `as any` anywhere else.
		const raw: {
			_id?: string;
			id?: string;
			name?: string | null;
			email?: string | null;
			image?: string | null;
			roles?: unknown;
		} = u as unknown as Record<string, unknown>;

		const id =
			(typeof raw._id === "string" ? raw._id : undefined) ??
			(typeof raw.id === "string" ? raw.id : undefined);
		if (!id) return null;

		const allowed: readonly AppRole[] = [
			"student",
			"teacher",
			"admin",
		] as const;
		const rolesRaw = Array.isArray(raw.roles) ? raw.roles : [];
		const roles = rolesRaw.filter(
			(r): r is AppRole =>
				typeof r === "string" && (allowed as readonly string[]).includes(r),
		);

		return {
			id,
			name: typeof raw.name === "string" ? raw.name : null,
			email: typeof raw.email === "string" ? raw.email : null,
			image: typeof raw.image === "string" ? raw.image : null,
			roles,
		};
	} catch {
		return null;
	}
}
