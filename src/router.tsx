import { MutationCache, QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";

import { ErrorPage } from "./components/error-page";
import { routeTree } from "./routeTree.gen";

const queryClient = new QueryClient({
	mutationCache: new MutationCache({
		onSuccess: (data, _variables, _context, mutation) => {
			if (
				data &&
				typeof data === "object" &&
				"success" in data &&
				(data as Record<string, unknown>).success === false
			) {
				return;
			}
			if (mutation.options.mutationKey) {
				void queryClient.invalidateQueries({
					queryKey: mutation.options.mutationKey,
				});
			} else {
				void queryClient.invalidateQueries();
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

	return router;
};
