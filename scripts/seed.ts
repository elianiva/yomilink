import { Effect, Schema } from "effect";
import { Auth } from "@/lib/auth";
import { Database } from "@/server/db/client";

const SeedUserSchema = Schema.Struct({
	email: Schema.NonEmptyString,
	password: Schema.NonEmptyString,
	name: Schema.optionalWith(Schema.NonEmptyString, { nullable: true }),
	roles: Schema.optionalWith(
		Schema.Array(
			Schema.Union(
				Schema.Literal("admin"),
				Schema.Literal("teacher"),
				Schema.Literal("student"),
			),
		),
		{ nullable: true },
	),
});

type SeedUser = Schema.Schema.Type<typeof SeedUserSchema>;

const DEFAULT_USERS: readonly SeedUser[] = [
	{
		email: "admin@yomilink.local",
		password: "admin123",
		name: "Admin",
		roles: ["admin"],
	},
	{
		email: "teacher@yomilink.local",
		password: "teacher123",
		name: "Teacher One",
		roles: ["teacher"],
	},
	{
		email: "student@yomilink.local",
		password: "student123",
		name: "Student One",
		roles: ["student"],
	},
];

const program = Effect.gen(function* () {
	const authService = yield* Auth;

	console.log("Seeding database...");

	console.log(`Seeding ${DEFAULT_USERS.length} users...`);

	for (const user of DEFAULT_USERS) {
		yield* Effect.tryPromise({
			try: async () => {
				const result = await authService.api.signUpEmail({
					body: {
						email: user.email,
						password: user.password,
						name: user.name as string,
					},
				});

				if (result.user) {
					console.log(`Created user: ${user.email}`);
				} else {
					console.log(`User ${user.email} already exists`);
				}
			},
			catch: (error) =>
				new Error(`Failed to seed user ${user.email}: ${error}`),
		});
	}

	console.log("Seed completed.");
}).pipe(Effect.provide(Database.Default), Effect.provide(Auth.Default));

Effect.runPromise(program);
