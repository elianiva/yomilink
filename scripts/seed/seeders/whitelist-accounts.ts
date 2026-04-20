import { eq } from "drizzle-orm";
import { Effect } from "effect";

import { Auth } from "@/lib/auth";
import { randomString } from "@/lib/utils";
import { Database } from "@/server/db/client";
import { user, whitelistEntries } from "@/server/db/schema/auth-schema";

import { WHITELIST_FLOW_ACCOUNTS } from "../data/whitelist-flow.js";

export function seedWhitelistAccounts() {
	return Effect.gen(function* () {
		const authService = yield* Auth;
		const db = yield* Database;

		yield* Effect.log("--- Seeding whitelist flow accounts ---");

		const userIdsByEmail: Record<string, string> = {};
		const userIdsByStudentId: Record<string, string> = {};

		for (const account of WHITELIST_FLOW_ACCOUNTS) {
			const existingUser = yield* db.select().from(user).where(eq(user.email, account.email)).limit(1);

			let userId = existingUser[0]?.id ?? "";
			if (!userId) {
				const signupResult = yield* Effect.tryPromise({
					try: () =>
						authService.api.signUpEmail({
							body: {
								email: account.email,
								password: account.password,
								name: account.name,
								studyGroup: "experiment",
							},
						}),
					catch: (error) => {
						console.error("Failed to create whitelist account " + account.email + ":", error);
						return { user: null };
					},
				});

				if (signupResult.user) {
					userId = signupResult.user.id;
					yield* Effect.log("Created whitelist account: " + account.email);
				}
			} else {
				yield* Effect.log("Whitelist account already exists: " + account.email);
			}

			if (!userId) continue;

			yield* db
				.update(user)
				.set({
					role: "student",
					studentId: account.studentId,
					age: account.age,
					jlptLevel: account.jlptLevel,
					japaneseLearningDuration: account.japaneseLearningDuration,
					previousJapaneseScore: account.previousJapaneseScore,
					mediaConsumption: account.mediaConsumption,
					motivation: account.motivation,
									studyGroup: "experiment",
				})
				.where(eq(user.id, userId));

			userIdsByEmail[account.email] = userId;
			userIdsByStudentId[account.studentId] = userId;
		}

		for (const account of WHITELIST_FLOW_ACCOUNTS) {
			const userId = userIdsByStudentId[account.studentId];
			if (!userId) continue;

			const existingWhitelist = yield* db
				.select()
				.from(whitelistEntries)
				.where(eq(whitelistEntries.studentId, account.studentId))
				.limit(1);

			if (existingWhitelist[0]) {
				yield* db
					.update(whitelistEntries)
					.set({
						claimedUserId: userId,
						claimedAt: new Date(),
						updatedAt: new Date(),
					})
					.where(eq(whitelistEntries.id, existingWhitelist[0].id));
			} else {
				yield* db.insert(whitelistEntries).values({
					id: randomString(),
					studentId: account.studentId,
					name: account.name,
					claimedUserId: userId,
					claimedAt: new Date(),
				});
			}
		}

		return { userIdsByEmail, userIdsByStudentId };
	});
}
