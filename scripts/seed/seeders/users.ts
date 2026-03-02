import { eq } from "drizzle-orm";
import { Effect } from "effect";
import { Auth } from "@/lib/auth";
import { Database } from "@/server/db/client";
import { user } from "@/server/db/schema/auth-schema";
import {
	ALL_USERS,
	DEMO_STUDENTS,
} from "../data/users.js";

export function seedUsers() {
	return Effect.gen(function* () {
		const authService = yield* Auth;
		const db = yield* Database;

		yield* Effect.log(`Seeding ${ALL_USERS.length} users...`);

		const userIdsByEmail: Record<string, string> = {};
		let teacherId = "";

		const userResults = yield* Effect.all(
			ALL_USERS.map((seedUser) =>
				Effect.gen(function* () {
					const existingUser = yield* db
						.select()
						.from(user)
						.where(eq(user.email, seedUser.email))
						.limit(1);

					let userId = "";
					if (existingUser[0]) {
						userId = existingUser[0].id;
						yield* Effect.log(`User ${seedUser.email} already exists`);
					} else {
						const result = yield* Effect.tryPromise({
							try: () =>
								authService.api.signUpEmail({
									body: {
										email: seedUser.email,
										password: seedUser.password,
										name: seedUser.name as string,
									},
								}),
							catch: () =>
								Effect.gen(function* () {
									yield* Effect.logError(
										`Failed to create user ${seedUser.email}`,
									);
									return { user: null };
								}),
						});
						if (result.user) {
							userId = result.user.id;
							yield* Effect.log(`Created user: ${seedUser.email}`);
						}
					}

					if (userId && seedUser.roles?.[0]) {
						yield* db
							.update(user)
							.set({ role: seedUser.roles?.[0] })
							.where(eq(user.id, userId));
						yield* Effect.log(
								`Set role '${seedUser.roles?.[0]}' for ${seedUser.email}`,
							);
					}

					const demoStudent = DEMO_STUDENTS.find(
						(s) => s.email === seedUser.email,
					);
					if (userId && demoStudent) {
						yield* db
							.update(user)
							.set({
								age: demoStudent.age,
								jlptLevel: demoStudent.jlptLevel,
								japaneseLearningDuration:
									demoStudent.japaneseLearningDuration,
								previousJapaneseScore:
									demoStudent.previousJapaneseScore,
								mediaConsumption: demoStudent.mediaConsumption,
								motivation: demoStudent.motivation,
							})
							.where(eq(user.id, userId));
						yield* Effect.log(
								`Set demographic data for ${seedUser.email}`,
							);
					}

					return {
						email: seedUser.email,
						userId,
						roles: seedUser.roles,
					};
				}),
			),
			{ concurrency: 10 },
		);

		for (const result of userResults) {
			userIdsByEmail[result.email] = result.userId;
			if (result.roles?.includes("teacher")) {
				teacherId = result.userId;
			}
		}

		return { userIdsByEmail, teacherId };
	});
}
