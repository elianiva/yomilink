import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import { ConvexQueryClient } from "@convex-dev/react-query";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { ConvexReactClient } from "convex/react";
import { AuthSentryBridge } from "@/app/AuthSentryBridge";
import { env } from "./env";
import { authClient } from "./lib/auth-client";
import { routeTree } from "./routeTree.gen";

const CONVEX_URL = env.VITE_CONVEX_URL;
if (!CONVEX_URL) {
	throw new Error("missing envar VITE_CONVEX_URL");
}
const convex = new ConvexReactClient(CONVEX_URL, {
	unsavedChangesWarning: false,
});
const convexQueryClient = new ConvexQueryClient(convex);
const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			queryKeyHashFn: convexQueryClient.hashFn(),
			queryFn: convexQueryClient.queryFn(),
		},
	},
});
convexQueryClient.connect(queryClient);

export const getRouter = () => {
	const router = createRouter({
		routeTree,
		context: { queryClient, convexClient: convex, convexQueryClient },
		defaultPreload: "intent",
		Wrap: (props: { children: React.ReactNode }) => {
			return (
				<ConvexBetterAuthProvider
					client={convexQueryClient.convexClient}
					authClient={authClient}
				>
					<QueryClientProvider client={queryClient}>
						<AuthSentryBridge />
						{props.children}
					</QueryClientProvider>
				</ConvexBetterAuthProvider>
			);
		},
	});

	return router;
};
