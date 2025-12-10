import { query } from "./_generated/server";
import { getAuthSubject } from "./auth";

/**
 * Return the current authenticated user's profile details for the sidebar.
 * Uses Better Auth's server API via authComponent to read the session user.
 */
export const me = query({
	args: {},
	handler: async (ctx) => {
		const subject = await getAuthSubject(ctx);
		if (!subject) return null;

		return {
			name: subject.name,
			email: subject.email,
			image: subject.image,
			roles: subject.roles,
		};
	},
});
