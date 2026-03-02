import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/health")({
	server: {
		handlers: {
			GET: () =>
				new Response(
					JSON.stringify({
						status: "ok",
						timestamp: new Date().toISOString(),
					}),
					{
						status: 200,
						headers: { "Content-Type": "application/json" },
					},
				),
		},
	},
});
