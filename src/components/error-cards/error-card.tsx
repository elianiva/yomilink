import { AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ErrorCardProps {
	title: string;
	description?: string;
	onRetry?: () => void;
	className?: string;
}

export function ErrorCard({ title, description, onRetry, className }: ErrorCardProps) {
	return (
		<div
			className={cn(
				"rounded-xl border border-destructive/20 bg-destructive/5 p-6 text-center",
				className,
			)}
		>
			<div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
				<AlertCircle className="h-6 w-6 text-destructive" />
			</div>
			<h3 className="text-lg font-semibold text-destructive">{title}</h3>
			{description && (
				<p className="mt-2 text-sm text-muted-foreground">{description}</p>
			)}
			{onRetry && (
				<Button onClick={onRetry} variant="outline" className="mt-4">
					Retry
				</Button>
			)}
		</div>
	);
}
