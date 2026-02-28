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

export function parseJson<A = unknown>(input: string | unknown): Effect.Effect<A, ParseJsonError>;

export function parseJson<S extends Schema.Schema<any, any, any>>(
	input: string | unknown,
	schema: S,
): Effect.Effect<Schema.Schema.Type<S>, ParseJsonError, Schema.Schema.Context<S>>;

export function parseJson<S extends Schema.Schema<any, any, any>>(
	input: string | unknown,
	schema?: S,
): Effect.Effect<unknown, ParseJsonError, never> {
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
	});
}

export function safeParseJson<A = unknown>(
	input: string | unknown,
	defaultValue: A,
): Effect.Effect<A, never>;

export function safeParseJson<S extends Schema.Schema<any, any, any>>(
	input: string | unknown,
	defaultValue: Schema.Schema.Type<S>,
	schema: S,
): Effect.Effect<Schema.Schema.Type<S>, never, Schema.Schema.Context<S>>;

export function safeParseJson<S extends Schema.Schema<any, any, any>>(
	input: string | unknown,
	defaultValue: unknown,
	schema?: S,
): Effect.Effect<unknown, never, never> {
	return schema
		? parseJson(input, schema).pipe(Effect.orElse(() => Effect.succeed(defaultValue)))
		: parseJson(input).pipe(Effect.orElse(() => Effect.succeed(defaultValue)));
}

export function roundToDecimals(value: number, decimals: number): number {
	const factor = 10 ** decimals;
	return Math.round(value * factor) / factor;
}

/**
 * Converts a URL path to breadcrumb segments.
 * @param pathname - The URL pathname (e.g., "/dashboard/forms/edit/abc123")
 * @param dynamicTitle - Optional dynamic title to use for the last segment
 * @returns Array of breadcrumb items with href and label
 */
export function pathToCrumbs(
	pathname: string,
	dynamicTitle?: string | null,
): Array<{ href: string; label: string }> {
	const segments = pathname.split("/").filter(Boolean);
	return segments.map((seg, idx) => {
		const href = `/${segments.slice(0, idx + 1).join("/")}`;
		let label = decodeURIComponent(seg)
			.replace(/[-_]/g, " ")
			.split(" ")
			.filter(Boolean)
			.map((w) => w.charAt(0).toUpperCase() + w.slice(1))
			.join(" ");

		if (idx === segments.length - 1 && dynamicTitle) {
			label = dynamicTitle;
		}

		return { href, label };
	});
}
