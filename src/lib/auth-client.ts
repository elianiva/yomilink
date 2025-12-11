import { adminClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { ac, roles } from "./auth-permissions";

export const authClient = createAuthClient({
	baseURL: import.meta.env.VITE_APP_URL,
	plugins: [
		adminClient({
			ac,
			roles,
		}),
	],
});

export const { signIn, signUp, signOut, useSession } = authClient;
