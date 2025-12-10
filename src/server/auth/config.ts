import { tanstackStartCookies } from "better-auth/tanstack-start";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins";
import { createDb } from "../db/client";
import { ac, admin as adminRole, student, teacher } from "@/auth/permissions";
import { env } from "@/env";

export const auth = betterAuth({
	baseURL: env.SITE_URL,
	database: drizzleAdapter(
		createDb(env.TURSO_DATABASE_URL, env.TURSO_AUTH_TOKEN),
		{
			provider: "sqlite",
			transaction: false,
		},
	),
	plugins: [
		tanstackStartCookies(),
		admin({
			defaultRole: "student",
			ac,
			roles: { student, teacher, admin: adminRole },
		} as any),
	],
	emailAndPassword: { enabled: true, requireEmailVerification: false },
	logger: { disabled: false },
});
