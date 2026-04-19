import { queryOptions, mutationOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { Data, Effect, Schema } from "effect";

import { Auth } from "@/lib/auth";
import { randomString } from "@/lib/utils";
import { studentIdToAuthEmail } from "@/lib/student-id-auth";
import { NonEmpty, Password } from "@/lib/validation-schemas";
import { authMiddlewareOptional } from "@/middlewares/auth";
import { Database } from "@/server/db/client";
import { cohortMembers, cohorts } from "@/server/db/schema/auth-schema";

import { claimWhitelistEntry } from "@/features/whitelist/lib/whitelist-service.mutations";
import { getWhitelistEntryByStudentId } from "@/features/whitelist/lib/whitelist-service.queries";
import { WhitelistAlreadyClaimedError, WhitelistNotFoundError } from "@/features/whitelist/lib/whitelist-service.shared";

import { AppRuntime } from "../app-runtime";
import { Rpc, logRpcError, logAndReturnError, logAndReturnDefect } from "../rpc-helper";

export const JlptLevelSchema = Schema.Union(Schema.Literal("N5", "N4", "N3", "N2", "N1", "None"));

export const SignUpInput = Schema.Struct({
	studentId: NonEmpty("Student ID"),
	password: Password(8),
	age: Schema.NullOr(Schema.Number),
	jlptLevel: JlptLevelSchema,
	cohortId: NonEmpty("Cohort"),
	japaneseLearningDuration: Schema.NullOr(Schema.Number),
	previousJapaneseScore: Schema.NullOr(Schema.Number),
	mediaConsumption: Schema.NullOr(Schema.Number),
	motivation: Schema.NullOr(Schema.String),
	consentGiven: Schema.Boolean,
}).pipe(
	Schema.filter((data) => data.consentGiven === true, {
		message: () => "You must give consent to participate in this research",
	}),
);

export type SignUpInput = typeof SignUpInput.Type;

export class SignUpFailedError extends Data.TaggedError("SignUpFailedError")<{ readonly message: string }> {}

function getFriendlySignUpError(err: unknown): string {
	const raw = err instanceof Error ? err.message : typeof err === "string" ? err : "Unknown error";
	const msg = raw.toLowerCase();

	if (msg.includes("already exists") || msg.includes("duplicate")) {
		return "An account with this student ID already exists.";
	}
	if (msg.includes("not whitelisted") || msg.includes("whitelist")) {
		return "This student ID is not whitelisted.";
	}
	if (msg.includes("already claimed")) {
		return "This whitelist entry was already used.";
	}
	if (msg.includes("password")) {
		return "Password does not meet requirements.";
	}
	if (msg.includes("email")) {
		return "Unable to create account. Please contact support.";
	}

	return "Signup failed. Please try again.";
}

export const signUpRpc = createServerFn({ method: "POST" })
	.middleware([authMiddlewareOptional])
	.inputValidator((raw) => Schema.decodeUnknownSync(SignUpInput)(raw))
	.handler(({ data }) =>
		AppRuntime.runPromise(
			Effect.gen(function* () {
				const auth = yield* Auth;
				const db = yield* Database;

				const whitelist = yield* getWhitelistEntryByStudentId(data.studentId);
				if (whitelist.claimedUserId) {
					return yield* new WhitelistAlreadyClaimedError({ studentId: whitelist.studentId });
				}

				const result = yield* Effect.tryPromise({
					try: () =>
						auth.api.signUpEmail({
							body: {
								name: whitelist.name,
								email: studentIdToAuthEmail(whitelist.studentId),
								password: data.password,
								age: data.age ?? undefined,
								studentId: whitelist.studentId,
								jlptLevel: data.jlptLevel,
								japaneseLearningDuration: data.japaneseLearningDuration ?? undefined,
								previousJapaneseScore: data.previousJapaneseScore ?? undefined,
								mediaConsumption: data.mediaConsumption ?? undefined,
								motivation: data.motivation ?? undefined,
								consentGiven: data.consentGiven,
							},
						}),
					catch: (e) => new SignUpFailedError({ message: getFriendlySignUpError(e) }),
				});

				if (!result || !result.user) {
					return yield* new SignUpFailedError({ message: "Signup returned no result" });
				}

				yield* db.insert(cohortMembers).values({
					id: randomString(),
					userId: result.user.id,
					cohortId: data.cohortId,
					role: "member",
				});

				yield* claimWhitelistEntry(whitelist.studentId, result.user.id);

				return Rpc.ok({ success: true });
			}).pipe(
				Effect.withSpan("signUp"),
				Effect.tapError(logRpcError("signUp")),
				Effect.catchTags({
					WhitelistNotFoundError: () => Rpc.err("This student ID is not whitelisted."),
					WhitelistAlreadyClaimedError: () => Rpc.err("This whitelist entry was already used."),
					SignUpFailedError: (e) => Rpc.err(e.message),
				}),
				Effect.catchAll(logAndReturnError("signUp")),
				Effect.catchAllDefect(logAndReturnDefect("signUp")),
			),
		),
	);

export const AuthRpc = {
	auth: () => ["auth"],
	signUp: () =>
		mutationOptions({
			mutationKey: [...AuthRpc.auth(), "signUp"],
			mutationFn: (data: SignUpInput) => signUpRpc({ data }),
		}),
	listCohorts: () =>
		queryOptions({
			queryKey: [...AuthRpc.auth(), "cohorts"],
			queryFn: () => listCohortsRpc(),
		}),
};

export const listCohortsRpc = createServerFn()
	.middleware([authMiddlewareOptional])
	.handler(() =>
		AppRuntime.runPromise(
			Effect.gen(function* () {
				const db = yield* Database;
				const rows = yield* db
					.select({
						id: cohorts.id,
						name: cohorts.name,
					})
					.from(cohorts)
					.orderBy(cohorts.name);

				return Rpc.ok(rows);
			}).pipe(
				Effect.withSpan("listCohorts"),
				Effect.tapError(logRpcError("listCohorts")),
				Effect.catchAll(logAndReturnError("listCohorts")),
				Effect.catchAllDefect(logAndReturnDefect("listCohorts")),
			),
		),
	);
