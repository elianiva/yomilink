import { mutationOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { Data, Effect, Layer, Schema } from "effect";

import { Auth } from "@/lib/auth";
import { authMiddlewareOptional } from "@/middlewares/auth";

import { AppLayer } from "../app-layer";
import { Rpc, logRpcError } from "../rpc-helper";

export const JlptLevelSchema = Schema.Union(Schema.Literal("N5", "N4", "N3", "N2", "N1", "None"));

export const SignUpInput = Schema.Struct({
	name: Schema.NonEmptyString,
	email: Schema.NonEmptyString,
	password: Schema.String.pipe(Schema.minLength(8)),
	age: Schema.NullOr(Schema.Number),
	jlptLevel: JlptLevelSchema,
	japaneseLearningDuration: Schema.NullOr(Schema.Number),
	previousJapaneseScore: Schema.NullOr(Schema.Number),
	mediaConsumption: Schema.NullOr(Schema.Number),
	motivation: Schema.NullOr(Schema.String),
});

export type SignUpInput = typeof SignUpInput.Type;

export class SignUpFailedError extends Data.TaggedError("SignUpFailedError")<{
	readonly message: string;
}> {}

function getFriendlySignUpError(err: unknown): string {
	const raw = err instanceof Error ? err.message : String(err ?? "");
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

export const signUpRpc = createServerFn()
	.middleware([authMiddlewareOptional])
	.inputValidator((raw) => Schema.decodeUnknownSync(SignUpInput)(raw))
	.handler(({ data }) =>
		Effect.gen(function* () {
			const auth = yield* Auth;

			const result = yield* Effect.tryPromise({
				try: () =>
					auth.api.signUpEmail({
						body: {
							name: data.name,
							email: data.email,
							password: data.password,
							age: data.age ?? undefined,
							jlptLevel: data.jlptLevel,
							japaneseLearningDuration: data.japaneseLearningDuration ?? undefined,
							previousJapaneseScore: data.previousJapaneseScore ?? undefined,
							mediaConsumption: data.mediaConsumption ?? undefined,
							motivation: data.motivation ?? undefined,
						},
					}),
				catch: (e) => new SignUpFailedError({ message: getFriendlySignUpError(e) }),
			});

			if (!result) {
				return yield* new SignUpFailedError({ message: "Signup returned no result" });
			}

			return Rpc.ok({ success: true });
		}).pipe(
			Effect.withSpan("signUp"),
			Effect.tapError(logRpcError("signUp")),
			Effect.catchTags({
				SignUpFailedError: (e) => Rpc.err(e.message),
			}),
			Effect.catchAll(() => Rpc.err("Internal server error")),
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
};
