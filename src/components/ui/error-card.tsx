import { cva, type VariantProps } from "class-variance-authority";
import {
	AlertCircleIcon,
	AlertTriangleIcon,
	InfoIcon,
	Loader2Icon,
	RefreshCwIcon,
	XIcon,
} from "lucide-react";
import type * as React from "react";

import { cn } from "@/lib/utils";

import { Button } from "./button";

const errorCardVariants = cva("flex flex-col gap-3 rounded-lg border p-4 text-sm", {
	variants: {
		variant: {
			error: "border-destructive/50 bg-destructive/10 text-destructive dark:border-destructive/40 dark:bg-destructive/15",
			warning:
				"border-warning/50 bg-warning/10 text-warning dark:border-warning/40 dark:bg-warning/15",
			info: "border-info/50 bg-info/10 text-info dark:border-info/40 dark:bg-info/15",
		},
	},
	defaultVariants: {
		variant: "error",
	},
});

const variantIcons = {
	error: AlertCircleIcon,
	warning: AlertTriangleIcon,
	info: InfoIcon,
} as const;

export type ErrorCardProps = VariantProps<typeof errorCardVariants> & {
	title: string;
	description?: string | React.ReactNode;
	showRetry?: boolean;
	onRetry?: () => void;
	isRetrying?: boolean;
	dismissible?: boolean;
	onDismiss?: () => void;
	actions?: React.ReactNode;
	className?: string;
	children?: React.ReactNode;
};

export function ErrorCard({
	variant = "error",
	title,
	description,
	showRetry,
	onRetry,
	isRetrying = false,
	dismissible = false,
	onDismiss,
	actions,
	className,
	children,
}: ErrorCardProps) {
	const Icon = variantIcons[variant || "error"];
	const shouldShowRetry = showRetry ?? !!onRetry;
	const hasActions = shouldShowRetry || dismissible || actions;

	return (
		<div
			role="alert"
			aria-live="polite"
			className={cn(errorCardVariants({ variant }), className)}
		>
			<div className="flex items-start gap-3">
				<Icon className="size-5 shrink-0 mt-0.5" aria-hidden="true" />
				<div className="flex-1 min-w-0">
					<p className="font-medium leading-tight">{title}</p>
					{description && (
						<div className="mt-1 text-sm opacity-90">
							{typeof description === "string" ? <p>{description}</p> : description}
						</div>
					)}
					{children && <div className="mt-2">{children}</div>}
				</div>

				{dismissible && onDismiss && (
					<button
						type="button"
						onClick={onDismiss}
						className="shrink-0 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
						aria-label="Dismiss"
					>
						<XIcon className="size-4" />
					</button>
				)}
			</div>

			{hasActions && (
				<div className="flex items-center gap-2 pl-8">
					{shouldShowRetry && onRetry && (
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={onRetry}
							disabled={isRetrying}
							className="gap-1.5"
						>
							{isRetrying ? (
								<Loader2Icon className="size-3.5 animate-spin" />
							) : (
								<RefreshCwIcon className="size-3.5" />
							)}
							{isRetrying ? "Retrying..." : "Retry"}
						</Button>
					)}
					{actions}
				</div>
			)}
		</div>
	);
}

export function InlineError({ message, className }: { message: string; className?: string }) {
	return (
		<p
			role="alert"
			className={cn("text-sm text-destructive flex items-center gap-1.5", className)}
		>
			<AlertCircleIcon className="size-3.5 shrink-0" aria-hidden="true" />
			{message}
		</p>
	);
}
