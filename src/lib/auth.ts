import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { Effect, Schema } from "effect";
import { ServerConfig } from "@/config";
import { ac, roles } from "@/lib/auth-permissions";
import { Database } from "@/server/db/client";
import { Telemetry } from "@/server/telemetry";
import * as appSchema from "@/server/db/schema/app-schema";
import * as authSchema from "@/server/db/schema/auth-schema";

export class Auth extends Effect.Service<Auth>()("Auth", {
	effect: Effect.gen(function* () {
		const config = yield* ServerConfig;
		const db = yield* Database;

		return betterAuth({
			baseURL: config.siteUrl,
			database: drizzleAdapter(db, {
				provider: "sqlite",
				schema: {
					...authSchema,
					...appSchema,
				},
			}),
			plugins: [
				admin({
					defaultRole: "student",
					ac,
					roles,
				}),
				tanstackStartCookies(), // needs to be last
			],
			emailAndPassword: {
				enabled: true,
				requireEmailVerification: false,
			},
			logger: { disabled: false },
		});
	}),
	dependencies: [Database.Default],
}) {}

// dummy function just for better-auth, do not use directly
export const auth = Effect.gen(function* () {
	return yield* Auth;
}).pipe(Effect.provide(Auth.Default), Effect.runSync);

export const Role = Schema.Literal("teacher", "admin", "student").annotations({
	message: (issue) => ({ message: `Invalid role: ${issue}`, override: true }),
});

export const AuthUser = Schema.Struct({
	id: Schema.String,
	role: Schema.optionalWith(Role, { default: () => "student" }),
	email: Schema.optionalWith(Schema.NonEmptyString, { nullable: true }),
	name: Schema.optionalWith(Schema.NonEmptyString, { nullable: true }),
	image: Schema.optionalWith(Schema.NonEmptyString, { nullable: true }),
});

export function getServerUser(headers: Headers) {
	return Effect.gen(function* () {
		const auth = yield* Auth;
		const session = yield* Effect.tryPromise(() =>
			auth.api.getSession({ headers }),
		).pipe(
			Effect.catchTag("UnknownException", (e) => {
				// TODO: better error handling
				console.log(e);
				return Effect.succeed(null);
			}),
		);
		if (!session) return null;

		const user = yield* Schema.decodeUnknown(AuthUser)(session.user);
		return user;
	}).pipe(
		Effect.withSpan("getServerUser"),
		Effect.provide(Auth.Default),
		Effect.provide(Telemetry),
		Effect.runPromise,
	);
}
