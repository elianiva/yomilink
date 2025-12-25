import * as Sentry from "@sentry/tanstackstart-react";
import { MutationCache, QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import { ErrorPage } from "./components/error-page";
import { routeTree } from "./routeTree.gen";

const queryClient = new QueryClient({
	mutationCache: new MutationCache({
		onSuccess: (_data, _variables, _context, mutation) => {
			if (mutation.options.mutationKey) {
				queryClient.invalidateQueries({
					queryKey: mutation.options.mutationKey,
				});
			} else {
				queryClient.invalidateQueries();
			}
		},
	}),
});

export const getRouter = () => {
	const router = createRouter({
		routeTree,
		context: { queryClient },
		defaultPreload: "intent",
		defaultErrorComponent: ErrorPage,
	});

	setupRouterSsrQueryIntegration({
		router,
		queryClient,
	});

	if (!router.isServer) {
		Sentry.init({
			dsn: import.meta.env.VITE_SENTRY_DSN,
			sendDefaultPii: true,
		});
	}

	return router;
};
