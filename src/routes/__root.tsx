import { ProgressProvider } from "@bprogress/react";
import fredokaFont from "@fontsource-variable/fredoka/index.css?url";
import type { QueryClient } from "@tanstack/react-query";
import {
	createRootRouteWithContext,
	HeadContent,
	Scripts,
} from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/sonner";
import { NotFound } from "../components/not-found";
import RouteProgress from "../components/progress/route-progress";
import appCss from "../styles.css?url";

interface MyRouterContext {
	queryClient: QueryClient;
}

const isDev = import.meta.env.DEV;

// Lazy load dev tools only in development
const DevTools = lazy(() =>
	import("../components/devtools.tsx").then((m) => ({ default: m.DevTools })),
);

export const Route = createRootRouteWithContext<MyRouterContext>()({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{ name: "viewport", content: "width=device-width, initial-scale=1" },
			{ title: "KitBuild" },
		],
		links: [
			{ rel: "stylesheet", href: appCss },
			{ rel: "stylesheet", href: fredokaFont },
		],
		scripts: isDev
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
					<Toaster position="top-right" />
					{isDev && (
						<Suspense fallback={null}>
							<DevTools />
						</Suspense>
					)}
				</ProgressProvider>
				<Scripts />
			</body>
		</html>
	);
}
