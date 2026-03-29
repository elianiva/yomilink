import { Link } from "@tanstack/react-router";
import { FileQuestion } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface NotFoundCardProps {
	resource?: string;
	backTo?: string;
	backLabel?: string;
	className?: string;
}

export function NotFoundCard({
	resource = "Resource",
	backTo = "/dashboard",
	backLabel = "Go to Dashboard",
	className,
}: NotFoundCardProps) {
	return (
		<div className={cn("rounded-xl border bg-card p-8 text-center", className)}>
			<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
				<FileQuestion className="h-8 w-8 text-muted-foreground" />
			</div>
			<h3 className="text-xl font-semibold">{resource} Not Found</h3>
			<p className="mt-2 text-sm text-muted-foreground">
				The {resource.toLowerCase()} you&apos;re looking for doesn&apos;t exist or you
				don&apos;t have access to it.
			</p>
			<Button asChild variant="outline" className="mt-6">
				<Link to={backTo}>{backLabel}</Link>
			</Button>
		</div>
	);
}
