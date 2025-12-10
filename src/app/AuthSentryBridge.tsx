import * as Sentry from "@sentry/tanstackstart-react";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";

/**
 * Bridges Better Auth session to Sentry user context on the client.
 * - Sets Sentry user on login
 * - Clears Sentry user on logout
 */
export function AuthSentryBridge() {
	const { user } = useAuth();

	useEffect(() => {
		try {
			if (user) {
				Sentry.setUser({
					id: user.id,
					email: user.email ?? undefined,
					username: user.name ?? undefined,
				});
			} else {
				Sentry.setUser(null);
			}
		} catch {
			// ignore Sentry errors in dev
		}
	}, [user]);

	return null;
}
