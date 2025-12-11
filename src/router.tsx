import * as Sentry from "@sentry/tanstackstart-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { ErrorPage } from "./components/error-page";
import { routeTree } from "./routeTree.gen";

const queryClient = new QueryClient();

export const getRouter = () => {
	const router = createRouter({
		routeTree,
		context: { queryClient } as any,
		defaultPreload: "intent",
		defaultErrorComponent: ErrorPage,
		Wrap: (props: { children: React.ReactNode }) => {
			return (
				<QueryClientProvider client={queryClient}>
					{props.children}
				</QueryClientProvider>
			);
		},
	});

	if (!router.isServer) {
		Sentry.init({
			dsn: import.meta.env.VITE_SENTRY_DSN,
			sendDefaultPii: true,
		});
	}

	return router;
};
