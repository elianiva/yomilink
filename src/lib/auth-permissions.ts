import { createAccessControl } from "better-auth/plugins/access";
import { adminAc, defaultStatements } from "better-auth/plugins/admin/access";

export const statements = {
	...defaultStatements,
} as const;
export const ac = createAccessControl(statements);
export const roles = {
	student: ac.newRole({
		// Explicitly include known resources with no actions
		user: [],
		session: [],
	}),
	teacher: ac.newRole({
		// Read-only access to user listing
		user: ["list"],
		session: [],
	}),
	admin: ac.newRole({
		// Full privileges matching the default admin
		...adminAc.statements,
	}),
};
