import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements, adminAc } from "better-auth/plugins/admin/access";

// Base statements include default admin resources: `user` and `session`
export const statements = {
	...defaultStatements,
} as const;

export const ac = createAccessControl(statements);

// Custom roles
export const student = ac.newRole({
	// Explicitly include known resources with no actions
	user: [],
	session: [],
});

export const teacher = ac.newRole({
	// Read-only access to user listing
	user: ["list"],
	session: [],
});

export const admin = ac.newRole({
	// Full privileges matching the default admin
	...adminAc.statements,
});
