import { ProgressProvider } from "@bprogress/react";
import type { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, HeadContent, Scripts } from "@tanstack/react-router";

import { Toaster } from "@/components/ui/sonner";

import { DevTools } from "../components/devtools.tsx";
import { NotFound } from "../components/not-found";
import RouteProgress from "../components/progress/route-progress";

import appCss from "../styles.css?url";
import spaceGroteskFont from "@fontsource-variable/space-grotesk/index.css?url";
import geistFont from "@fontsource/geist/index.css?url";

interface MyRouterContext {
	queryClient: QueryClient;
}

const isDev = import.meta.env.DEV;
const disableReactScan = import.meta.env.VITE_DISABLE_REACT_SCAN === "true";

export const Route = createRootRouteWithContext<MyRouterContext>()({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{ name: "viewport", content: "width=device-width, initial-scale=1" },
			{ title: "KitBuild" },
		],
		links: [
			{ rel: "stylesheet", href: appCss },
			{ rel: "stylesheet", href: spaceGroteskFont },
			{ rel: "stylesheet", href: geistFont },
		],
		scripts:
			isDev && !disableReactScan
				? [
						{
							src: "https://cdn.jsdelivr.net/npm/react-scan/dist/auto.global.js",
						},
					]
				: [],
	}),
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
					<Toaster position="top-right" richColors />
					{isDev && <DevTools />}
				</ProgressProvider>
				<Scripts />
			</body>
		</html>
	);
}
