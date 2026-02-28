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

/**
 * ErrorCard component variants using class-variance-authority.
 */
const errorCardVariants = cva("flex flex-col gap-3 rounded-lg border p-4 text-sm", {
	variants: {
		variant: {
			error: "border-destructive/50 bg-destructive/10 text-destructive dark:border-destructive/40 dark:bg-destructive/15",
			warning:
				"border-amber-500/50 bg-amber-500/10 text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-400",
			info: "border-blue-500/50 bg-blue-500/10 text-blue-700 dark:border-blue-500/40 dark:bg-blue-500/15 dark:text-blue-400",
		},
	},
	defaultVariants: {
		variant: "error",
	},
});

/**
 * Icon mapping for each variant.
 */
const variantIcons = {
	error: AlertCircleIcon,
	warning: AlertTriangleIcon,
	info: InfoIcon,
} as const;

/**
 * Props for the ErrorCard component.
 */
export type ErrorCardProps = VariantProps<typeof errorCardVariants> & {
	/** Main title/heading for the error */
	title: string;
	/** Optional description with more details */
	description?: string | React.ReactNode;
	/** Whether to show a retry button (default: true if onRetry is provided) */
	showRetry?: boolean;
	/** Callback when retry button is clicked */
	onRetry?: () => void;
	/** Whether retry is in progress (shows loading state) */
	isRetrying?: boolean;
	/** Whether the card can be dismissed (default: false) */
	dismissible?: boolean;
	/** Callback when dismiss button is clicked */
	onDismiss?: () => void;
	/** Additional actions to render */
	actions?: React.ReactNode;
	/** Additional className for the root element */
	className?: string;
	/** Additional content to render below the description */
	children?: React.ReactNode;
};

/**
 * ErrorCard - A reusable component for displaying inline error, warning, or info messages.
 *
 * @example
 * ```tsx
 * // Basic error
 * <ErrorCard
 *   title="Failed to load data"
 *   description="Please try again later."
 * />
 *
 * // With retry button
 * <ErrorCard
 *   title="Connection Error"
 *   description="Unable to reach the server."
 *   onRetry={() => refetch()}
 *   isRetrying={isLoading}
 * />
 *
 * // Warning variant
 * <ErrorCard
 *   variant="warning"
 *   title="Unsaved Changes"
 *   description="You have unsaved changes that will be lost."
 *   dismissible
 *   onDismiss={() => setShowWarning(false)}
 * />
 *
 * // Info variant with custom actions
 * <ErrorCard
 *   variant="info"
 *   title="New Feature Available"
 *   description="Check out the new dashboard improvements."
 *   actions={<Button size="sm">Learn More</Button>}
 * />
 * ```
 */
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
			{/* Header with icon and title */}
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

				{/* Dismiss button (top right) */}
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

			{/* Actions */}
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

/**
 * Convenience component for inline error messages without card styling.
 * Useful for form field errors or simple inline feedback.
 */
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
