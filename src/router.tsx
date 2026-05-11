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
				// Invalidate at the resource level so sibling queries
				// (e.g. mutation key ["forms","delete"] invalidates query ["forms","list"])
				const resourceKey =
					mutation.options.mutationKey.length > 1
						? [mutation.options.mutationKey[0]]
						: mutation.options.mutationKey;
				void queryClient.invalidateQueries({ queryKey: resourceKey });
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
