import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export function NotFound() {
	return (
		<main className="min-h-dvh grid place-items-center p-6">
			<section className="mx-auto max-w-xl text-center space-y-6">
				<div className="inline-flex items-center justify-center rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">
					404 — Page not found
				</div>
				<h1 className="text-5xl sm:text-6xl font-bold tracking-tight">
					<span className="bg-gradient-to-br from-primary to-primary/60 bg-clip-text text-transparent">
						Lost in the links?
					</span>
				</h1>
				<p className="text-muted-foreground">
					The page you’re looking for doesn’t exist or has been moved.
				</p>
				<div className="flex flex-wrap items-center justify-center gap-3">
					<Button asChild>
						<Link to="/" preload="intent">
							Go home
						</Link>
					</Button>
					<Button
						variant="ghost"
						onClick={() => {
							if (typeof window !== "undefined") window.history.back();
						}}
					>
						Go back
					</Button>
				</div>
			</section>
		</main>
	);
}
