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
			spotlight: import.meta.env.DEV,
			tracesSampleRate: import.meta.env.DEV ? 1.0 : 0.1,
			profilesSampleRate: import.meta.env.DEV ? 1.0 : 0.1,
			replaysSessionSampleRate: import.meta.env.DEV ? 1.0 : 0.05,
			replaysOnErrorSampleRate: 1.0,
			beforeSend(event: { request?: { url?: string } }) {
				// Filter out health check requests
				if (event.request?.url?.includes("/health")) {
					return null;
				}
				// Filter out specific errors if needed
				return event;
			},
			beforeSendTransaction(event: {
				contexts?: { trace?: { data?: { url?: string } } };
			}) {
				// Filter out health check transactions
				if (event.contexts?.trace?.data?.url?.includes("/health")) {
					return null;
				}
				return event;
			},
			integrations: [
				Sentry.tanstackRouterBrowserTracingIntegration(router),
				Sentry.spotlightBrowserIntegration(),
				Sentry.captureConsoleIntegration({
					levels: ["log", "info", "warn", "error", "debug"],
				}),
				Sentry.replayIntegration({
					maskAllText: false,
					blockAllMedia: false,
				}),
			],
		} as unknown as Sentry.BrowserOptions);
	}

	return router;
};
