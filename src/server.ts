import handler, { createServerEntry } from "@tanstack/react-start/server-entry";

// Log unhandled errors for debugging in Cloudflare
export default createServerEntry({
    async fetch(request: Request) {
        try {
            console.log(
                "[SERVER] Request received:\n" +
                JSON.stringify({
                    url: request.url,
                    method: request.method,
                }),
            );
            return await handler.fetch(request);
        } catch (error) {
            console.error(
                "[SERVER] Unhandled error in fetch:\n" +
                JSON.stringify({
                    message: error instanceof Error ? error.message : String(error),
                    stack: error instanceof Error ? error.stack : undefined,
                    type: typeof error,
                }),
            );
            return new Response(
                JSON.stringify({
                    error: "Internal Server Error, check logs",
                    details: error instanceof Error ? error.message : String(error),
                }),
                {
                    status: 500,
                    headers: { "Content-Type": "application/json" },
                },
            );
        }
    },
});
