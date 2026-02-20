import type { ErrorComponentProps } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export function ErrorPage({ error, reset }: ErrorComponentProps) {
	const [detailsOpen, setDetailsOpen] = useState(false);

	return (
		<div className="flex min-h-screen w-full items-center justify-center bg-neutral-50 text-neutral-900">
			<div className="mx-4 w-full max-w-xl rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
				<div className="flex items-center gap-3">
					<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white font-bold text-sm">
						KB
					</div>
					<h1 className="text-xl font-semibold">Something went wrong</h1>
				</div>
				<p className="mt-3 text-sm text-neutral-600">
					We hit a snag while loading this page. You can try again or head back
					home.
				</p>
				<div className="mt-6 flex gap-3">
					<Button onClick={() => reset?.()} variant="default">
						Retry
					</Button>
					<Link to="/" preload="intent">
						<Button variant="secondary">Go Home</Button>
					</Link>
					<Button variant="outline" onClick={() => setDetailsOpen((v) => !v)}>
						{detailsOpen ? "Hide Details" : "Show Details"}
					</Button>
				</div>
				{detailsOpen ? (
					<>
						<Separator className="my-6" />
						<div className="rounded-lg bg-neutral-100 p-4 text-xs text-neutral-800">
							<pre className="overflow-x-auto whitespace-pre-wrap">
								{error instanceof Error
									? (error.stack ?? error.message)
									: String(error)}
							</pre>
						</div>
					</>
				) : null}
			</div>
		</div>
	);
}
