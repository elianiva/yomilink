import { createFileRoute } from "@tanstack/react-router";
import { env } from "cloudflare:workers";
import { Effect, Runtime } from "effect";

import { getServerUser } from "@/lib/auth";
import { requireGoalMapAccess } from "@/lib/auth-authorization";
import { AppRuntime } from "@/server/app-runtime";

export const Route = createFileRoute("/api/materials/images/$goalMapId/$imageId")({
	server: {
		handlers: {
			GET: async ({ params, request }) => {
				const { goalMapId, imageId } = params;

				const effect = Effect.gen(function* () {
					const user = yield* getServerUser(request.headers);

					if (!user) {
						return new Response("Unauthorized", { status: 401 });
					}

					yield* requireGoalMapAccess(user.id, goalMapId).pipe(
						Effect.catchTags({
							ForbiddenError: () =>
								Effect.succeed(new Response("Forbidden", { status: 403 })),
							GoalMapNotFoundError: () =>
								Effect.succeed(new Response("Goal map not found", { status: 404 })),
						}),
					);

					const key = `materials/${goalMapId}/${imageId}`;

					const object = yield* Effect.tryPromise(() => env.MATERIAL_IMAGES.get(key));

					if (!object) {
						return new Response("Not Found", { status: 404 });
					}

					const headers = new Headers();
					object.writeHttpMetadata(headers);
					headers.set("Cache-Control", "public, max-age=86400");

					return new Response(object.body, { headers });
				});

				const result = await Runtime.runPromise(AppRuntime, effect);

				return result;
			},
		},
	},
});
