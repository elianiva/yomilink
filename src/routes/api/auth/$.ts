import { createFileRoute } from "@tanstack/react-router";
import { Effect } from "effect";
import { Auth } from "@/lib/auth";

const authHandler = (request: Request) =>
	Effect.gen(function* () {
		const auth = yield* Auth;
		const result = yield* Effect.tryPromise(() => auth.handler(request));
		return result;
	}).pipe(
		Effect.provide(Auth.Default),
		Effect.catchTag("UnknownException", (exception) =>
			Effect.gen(function* () {
				const errorDetails =
					exception instanceof Error
						? {
								message: exception.message,
								stack: exception.stack,
							}
						: {
								message: String(exception),
							};
				yield* Effect.logError("Auth handler failed", {
					...errorDetails,
					method: request.method,
					url: request.url,
				});
				return Response.json(
					{ message: "Internal Server Error" },
					{ status: 500 },
				);
			}),
		),
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
