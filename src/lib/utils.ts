import { createRandomStringGenerator } from "@better-auth/utils/random";
import { type ClassValue, clsx } from "clsx";
import { Data, Effect, Schema } from "effect";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

const randomStringGenerator = createRandomStringGenerator("a-z", "A-Z", "0-9");

export const randomString = (length = 32) => randomStringGenerator(length);

export class ParseJsonError extends Data.TaggedError("ParseJsonError")<{
	readonly message: string;
}> {}

export function parseJson<A = unknown>(
	input: string | unknown,
): Effect.Effect<A, ParseJsonError>;
export function parseJson<S extends Schema.Schema<any, any, any>>(
	input: string | unknown,
	schema: S,
): Effect.Effect<
	S extends Schema.Schema<infer A, any, any> ? A : never,
	ParseJsonError,
	S extends Schema.Schema<any, any, infer R> ? R : never
>;
export function parseJson<S extends Schema.Schema<any, any, any>>(
	input: string | unknown,
	schema?: S,
): Effect.Effect<any, ParseJsonError, any> {
	return Effect.gen(function* () {
		let parsed: unknown;
		if (typeof input === "string") {
			parsed = yield* Effect.try({
				try: () => JSON.parse(input),
				catch: () => new ParseJsonError({ message: "Invalid JSON string" }),
			});
		} else {
			parsed = input;
		}

		if (schema) {
			const result = yield* Schema.decodeUnknown(schema)(parsed);
			return result;
		}
		return parsed;
	}) as any;
}

export function safeParseJson<A = unknown>(
	input: string | unknown,
	defaultValue: A,
): Effect.Effect<A, never>;

export function safeParseJson<S extends Schema.Schema<any, any, any>>(
	input: string | unknown,
	defaultValue: S extends Schema.Schema<infer A, any, any> ? A : never,
	schema: S,
): Effect.Effect<
	S extends Schema.Schema<infer A, any, any> ? A : never,
	never,
	S extends Schema.Schema<any, any, infer R> ? R : never
>;

export function safeParseJson<S extends Schema.Schema<any, any, any>>(
	input: string | unknown,
	defaultValue: unknown,
	schema?: S,
): Effect.Effect<unknown, never, any> {
	return schema
		? parseJson(input, schema).pipe(
				Effect.orElse(() => Effect.succeed(defaultValue)),
			)
		: parseJson(input).pipe(Effect.orElse(() => Effect.succeed(defaultValue)));
}

export function roundToDecimals(value: number, decimals: number): number {
	const factor = 10 ** decimals;
	return Math.round(value * factor) / factor;
}
