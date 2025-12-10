import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { AuthSentryBridge } from "@/app/AuthSentryBridge";
import { routeTree } from "./routeTree.gen";
import * as Sentry from "@sentry/tanstackstart-react";

const queryClient = new QueryClient();

export const getRouter = () => {
	const router = createRouter({
		routeTree,
		context: { queryClient } as any,
		defaultPreload: "intent",
		Wrap: (props: { children: React.ReactNode }) => {
			return (
				<QueryClientProvider client={queryClient}>
					<AuthSentryBridge />
					{props.children}
				</QueryClientProvider>
			);
		},
	});

	if (!router.isServer) {
		Sentry.init({
			dsn: process.env.VITE_SENTRY_DSN,
			sendDefaultPii: true,
		});
	}

	return router;
};
