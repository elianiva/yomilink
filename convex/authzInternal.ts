import { internalQuery } from "./_generated/server";
import { getAuthSubject } from "./auth";

export const currentPrincipal = internalQuery({
	args: {},
	handler: async (ctx) => {
		const subject = await getAuthSubject(ctx);
		if (!subject) {
			throw new Error("unauthorized");
		}
		return { userId: subject.id, roles: subject.roles };
	},
});
