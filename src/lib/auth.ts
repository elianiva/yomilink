import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { Effect, Layer, Schema } from "effect";

import { ServerConfig } from "@/config";
import { ac, roles } from "@/lib/auth-permissions";
import { AppLayer } from "@/server/app-layer";
import { Database, DatabaseLive } from "@/server/db/client";
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
			user: {
				additionalFields: {
					age: {
						type: "number",
						required: false,
					},
					jlptLevel: {
						type: "string",
						required: false,
					},
					japaneseLearningDuration: {
						type: "number",
						required: false,
					},
					previousJapaneseScore: {
						type: "number",
						required: false,
					},
					mediaConsumption: {
						type: "number",
						required: false,
					},
					motivation: {
						type: "string",
						required: false,
					},
				},
			},
			logger: { disabled: false },
		});
	}),
	dependencies: [DatabaseLive],
}) {}

// dummy function just for better-auth, do not use directly
export const auth = Auth.pipe(Effect.provide(Auth.Default), Effect.runSync);

export const Role = Schema.Literal("teacher", "admin", "student").annotations({
	message: (issue) => ({ message: `Invalid role: ${issue}`, override: true }),
});

export const AuthUser = Schema.Struct({
	id: Schema.String,
	role: Schema.optionalWith(Role, { default: () => "student" }),
	email: Schema.optionalWith(Schema.NonEmptyString, { nullable: true }),
	name: Schema.optionalWith(Schema.NonEmptyString, { nullable: true }),
	image: Schema.optionalWith(Schema.NonEmptyString, { nullable: true }),
	age: Schema.optionalWith(Schema.Number, { nullable: true }),
	jlptLevel: Schema.optionalWith(
		Schema.Union(Schema.Literal("N5", "N4", "N3", "N2", "N1", "None")),
		{ nullable: true },
	),
	japaneseLearningDuration: Schema.optionalWith(Schema.Number, {
		nullable: true,
	}),
	previousJapaneseScore: Schema.optionalWith(Schema.Number, { nullable: true }),
	mediaConsumption: Schema.optionalWith(Schema.Number, { nullable: true }),
	motivation: Schema.optionalWith(Schema.String, { nullable: true }),
});

export function getServerUser(headers: Headers) {
	return Effect.gen(function* () {
		const auth = yield* Auth;
		const session = yield* Effect.tryPromise(() => auth.api.getSession({ headers })).pipe(
			Effect.catchTag("UnknownException", (e) => {
				const errorDetails =
					e instanceof Error
						? {
								message: e.message,
								stack: e.stack,
							}
						: {
								message: String(e),
							};
				return Effect.logError("Failed to get user session from auth", errorDetails).pipe(
					Effect.andThen(Effect.succeed(null)),
				);
			}),
		);
		if (!session) return null;

		const user = yield* Schema.decodeUnknown(AuthUser)(session.user);
		return user;
	}).pipe(
		Effect.withSpan("getServerUser"),
		Effect.provide(Layer.mergeAll(Auth.Default, AppLayer)),
		Effect.runPromise,
	);
}
