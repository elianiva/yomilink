import { createAccessControl } from "better-auth/plugins/access";
import { adminAc, defaultStatements } from "better-auth/plugins/admin/access";

export const ac = createAccessControl(defaultStatements);

export const roles = {
	student: ac.newRole({ user: [], session: [] }),
	teacher: ac.newRole({ user: ["list"], session: [] }),
	admin: adminAc,
} as const;
