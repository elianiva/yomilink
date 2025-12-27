import { createRandomStringGenerator } from "@better-auth/utils/random";
import { type ClassValue, clsx } from "clsx";
import { Data, Effect } from "effect";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

const randomStringGenerator = createRandomStringGenerator("a-z", "A-Z", "0-9");

export const randomString = (length = 32) => randomStringGenerator(length);

export class ParseJsonError extends Data.TaggedError("ParseJsonError")<{
	readonly message: string;
}> {}

export const parseJson = <A = unknown>(
	input: string | unknown,
): Effect.Effect<A, ParseJsonError> =>
	Effect.gen(function* () {
		if (typeof input === "string") {
			return yield* Effect.try({
				try: () => JSON.parse(input) as A,
				catch: () => new ParseJsonError({ message: "Invalid JSON string" }),
			});
		}
		return input as A;
	});

export const safeParseJson = <A = unknown>(
	input: string | unknown,
	defaultValue: A,
): Effect.Effect<A, never> =>
	parseJson<A>(input).pipe(Effect.orElse(() => Effect.succeed(defaultValue)));
