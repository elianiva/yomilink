import { adminClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { ac, admin as adminRole, student, teacher } from "@/auth/permissions";
import { env } from "@/env";

export const authClient = createAuthClient({
	baseURL: env.VITE_APP_URL,
	plugins: [
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
