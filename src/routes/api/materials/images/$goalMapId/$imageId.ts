import { createFileRoute } from "@tanstack/react-router";
import { env } from "cloudflare:workers";

export const Route = createFileRoute(
	"/api/materials/images/$goalMapId/$imageId",
)({
	server: {
		handlers: {
			GET: async ({ params }) => {
				const { goalMapId, imageId } = params;
				const key = `materials/${goalMapId}/${imageId}`;

				const object = await env.MATERIAL_IMAGES.get(key);

				if (!object) {
					return new Response("Not Found", { status: 404 });
				}

				const headers = new Headers();
				object.writeHttpMetadata(headers);
				headers.set("Cache-Control", "public, max-age=31536000, immutable");

				return new Response(object.body, { headers });
			},
		},
	},
});
