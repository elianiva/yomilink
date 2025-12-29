import { createFileRoute } from "@tanstack/react-router";
import { Effect } from "effect";
import { env } from "cloudflare:workers";
import { DatabaseLive } from "@/server/db/client";
import { getServerUser } from "@/lib/auth";
import { requireGoalMapAccess } from "@/lib/auth-authorization";

export const Route = createFileRoute(
	"/api/materials/images/$goalMapId/$imageId",
)({
	server: {
		handlers: {
			GET: async ({ params, request }) => {
				const { goalMapId, imageId } = params;

				const result = await Effect.gen(function* () {
					const user = yield* Effect.tryPromise(() =>
						getServerUser(request.headers),
					);

					if (!user) {
						return new Response("Unauthorized", { status: 401 });
					}

					yield* requireGoalMapAccess(user.id, goalMapId).pipe(
						Effect.catchTag("ForbiddenError", () =>
							Effect.succeed(new Response("Forbidden", { status: 403 })),
						),
						Effect.catchTag("GoalMapNotFoundError", () =>
							Effect.succeed(
								new Response("Goal map not found", { status: 404 }),
							),
						),
					);

					const key = `materials/${goalMapId}/${imageId}`;

					const object = yield* Effect.tryPromise(() =>
						env.MATERIAL_IMAGES.get(key),
					);

					if (!object) {
						return new Response("Not Found", { status: 404 });
					}

					const headers = new Headers();
					object.writeHttpMetadata(headers);
					headers.set("Cache-Control", "public, max-age=86400");

					return new Response(object.body, { headers });
				}).pipe(
					Effect.provide(DatabaseLive),
					Effect.catchTag("UnknownException", (e) =>
						Effect.succeed(
							new Response(e instanceof Error ? e.message : "Unknown error", {
								status: 500,
							}),
						),
					),
					Effect.runPromise,
				);

				return result;
			},
		},
	},
});
