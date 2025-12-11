import { createFileRoute } from "@tanstack/react-router";
import { Effect } from "effect";
import { Auth } from "@/server/auth/config";

const authHandler = (request: Request) =>
	Effect.gen(function* () {
		const auth = yield* Auth;
		const result = yield* Effect.tryPromise(() => auth.handler(request));
		return result;
	}).pipe(
		Effect.provide(Auth.Default),
		Effect.catchTag("UnknownException", (exception) => {
      // TODO: better logging with sentry
			Effect.log(exception);
			return Effect.succeed(
				Response.json({ message: "Internal Server Error" }, { status: 500 }),
			);
		}),
		Effect.runPromise,
	);

export const Route = createFileRoute("/api/auth/$")({
	server: {
		handlers: {
			GET: ({ request }) => authHandler(request),
			POST: ({ request }) => authHandler(request),
		},
	},
});
