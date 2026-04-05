import { queryOptions, mutationOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { Data, Effect, Layer, Schema } from "effect";

import { Auth } from "@/lib/auth";
import { randomString } from "@/lib/utils";
import { authMiddlewareOptional } from "@/middlewares/auth";
import { Database } from "@/server/db/client";
import { cohortMembers, cohorts } from "@/server/db/schema/auth-schema";

import { AppLayer } from "../app-layer";
import {
	Rpc,
	logRpcError,
	logAndReturnError,
	logAndReturnDefect,
	type RpcResult,
} from "../rpc-helper";

export const JlptLevelSchema = Schema.Union(Schema.Literal("N5", "N4", "N3", "N2", "N1", "None"));

export const StudyGroupSchema = Schema.NullOr(
	Schema.Union(Schema.Literal("experiment", "control")),
);

export const SignUpInput = Schema.Struct({
	name: Schema.NonEmptyString,
	email: Schema.NonEmptyString,
	password: Schema.String.pipe(Schema.minLength(8)),
	age: Schema.NullOr(Schema.Number),
	studentId: Schema.NullOr(Schema.String),
	jlptLevel: JlptLevelSchema,
	cohortId: Schema.NonEmptyString,
	studyGroup: StudyGroupSchema,
	japaneseLearningDuration: Schema.NullOr(Schema.Number),
	previousJapaneseScore: Schema.NullOr(Schema.Number),
	mediaConsumption: Schema.NullOr(Schema.Number),
	motivation: Schema.NullOr(Schema.String),
	consentGiven: Schema.Boolean,
});

export type SignUpInput = typeof SignUpInput.Type;

export class SignUpFailedError extends Data.TaggedError("SignUpFailedError")<{
	readonly message: string;
}> {}

function getFriendlySignUpError(err: unknown): string {
	const raw =
		err instanceof Error ? err.message : typeof err === "string" ? err : "Unknown error";
	const msg = raw.toLowerCase();

	if (msg.includes("already exists") || msg.includes("duplicate")) {
		return "An account with this email already exists.";
	}
	if (msg.includes("password")) {
		return "Password does not meet requirements.";
	}
	if (msg.includes("email")) {
		return "Please enter a valid email address.";
	}

	return "Signup failed. Please try again.";
}

export const signUpRpc = createServerFn({ method: "POST" })
	.middleware([authMiddlewareOptional])
	.inputValidator((raw) => Schema.decodeUnknownSync(SignUpInput)(raw))
	.handler(({ data }) =>
		Effect.gen(function* () {
			const auth = yield* Auth;
			const db = yield* Database;

			const result = yield* Effect.tryPromise({
				try: () =>
					auth.api.signUpEmail({
						body: {
							name: data.name,
							email: data.email,
							password: data.password,
							age: data.age ?? undefined,
							studentId: data.studentId ?? undefined,
							jlptLevel: data.jlptLevel,
							japaneseLearningDuration: data.japaneseLearningDuration ?? undefined,
							previousJapaneseScore: data.previousJapaneseScore ?? undefined,
							mediaConsumption: data.mediaConsumption ?? undefined,
							motivation: data.motivation ?? undefined,
							studyGroup: data.studyGroup,
							consentGiven: data.consentGiven,
						},
					}),
				catch: (e) => new SignUpFailedError({ message: getFriendlySignUpError(e) }),
			});

			if (!result || !result.user) {
				return yield* new SignUpFailedError({ message: "Signup returned no result" });
			}

			// Add user to the selected cohort
			yield* db.insert(cohortMembers).values({
				id: randomString(),
				userId: result.user.id,
				cohortId: data.cohortId,
				role: "member",
			});

			return Rpc.ok({ success: true });
		}).pipe(
			Effect.withSpan("signUp"),
			Effect.tapError(logRpcError("signUp")),
			Effect.catchTags({
				SignUpFailedError: (e) => Rpc.err(e.message),
			}),
			Effect.catchAll(logAndReturnError("signUp")),
			Effect.catchAllDefect(logAndReturnDefect("signUp")),
			Effect.provide(Layer.merge(AppLayer, Auth.Default)),
			Effect.runPromise,
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
			queryFn: () => listCohortsRpc() as Promise<RpcResult<{ id: string; name: string }[]>>,
		}),
};

export const listCohortsRpc = createServerFn()
	.middleware([authMiddlewareOptional])
	.handler(() =>
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
			Effect.provide(AppLayer),
			Effect.runPromise,
		),
	);
