import { convexClient } from "@convex-dev/better-auth/client/plugins";
import { adminClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { env } from "@/env";
import { ac, admin as adminRole, student, teacher } from "@/auth/permissions";

export const authClient = createAuthClient({
	baseURL: env.VITE_APP_URL,
	plugins: [
		convexClient(),
		adminClient({
			ac,
			roles: {
				admin: adminRole,
				student,
				teacher,
			},
		} as any),
	],
});

export const { signIn, signUp, signOut, useSession } = authClient;
