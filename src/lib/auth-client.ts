import { adminClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

import { ac, roles } from "./auth-permissions";

export const authClient = createAuthClient({
	baseURL: import.meta.env.VITE_APP_URL ?? window.location.origin,
	plugins: [
		adminClient({
			ac,
			roles,
		}),
	],
});

export const { signIn, signUp, signOut, useSession } = authClient;
