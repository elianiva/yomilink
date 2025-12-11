import { redirect } from "@tanstack/react-router";
import { createMiddleware } from "@tanstack/react-start";
import { Schema } from "effect";
import { getServerUser } from "@/lib/auth";

const Role = Schema.Literal("teacher", "admin", "student").annotations({
	message: (issue) => ({ message: `Invalid role: ${issue}`, override: true }),
});

export const AuthUser = Schema.TaggedStruct("AuthUser", {
	id: Schema.String,
	role: Schema.optionalWith(Role, { default: () => "student" }),
	email: Schema.optionalWith(Schema.NonEmptyString, { nullable: true }),
	name: Schema.optionalWith(Schema.NonEmptyString, { nullable: true }),
	image: Schema.optionalWith(Schema.NonEmptyString, { nullable: true }),
});

export const authMiddleware = createMiddleware().server(
	async ({ next, request }) => {
		const user = getServerUser(request.headers);
		if (!user) throw redirect({ to: "/login" });
		return await next({
			context: {
				user,
			},
		});
	},
);
