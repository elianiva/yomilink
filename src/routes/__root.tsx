import { ProgressProvider } from "@bprogress/react";
import { TanStackDevtools } from "@tanstack/react-devtools";
import type { QueryClient } from "@tanstack/react-query";
import {
	createRootRouteWithContext,
	HeadContent,
	Scripts,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { fetchAuth } from "@/auth/fetch-auth";
import NotFound from "../components/not-found";
import RouteProgress from "../components/progress/route-progress";
import TanStackQueryDevtools from "../integrations/tanstack-query/devtools";
import appCss from "../styles.css?url";

interface MyRouterContext {
	queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{ name: "viewport", content: "width=device-width, initial-scale=1" },
			{ title: "Yomilink" },
		],
		links: [{ rel: "stylesheet", href: appCss }],
	}),
	beforeLoad: async () => {
		const { userId } = await fetchAuth();
		return { userId };
	},
	notFoundComponent: NotFound,
	shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<head>
				<HeadContent />
			</head>
			<body>
				<ProgressProvider
					height="3px"
					color="hsl(var(--primary))"
					options={{ showSpinner: true }}
				>
					<RouteProgress />
					{children}
					<TanStackDevtools
						config={{ position: "bottom-right" }}
						plugins={[
							{
								name: "Tanstack Router",
								render: <TanStackRouterDevtoolsPanel />,
							},
							TanStackQueryDevtools,
						]}
					/>
				</ProgressProvider>
				<Scripts />
			</body>
		</html>
	);
}
