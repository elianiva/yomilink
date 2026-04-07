import { cn } from "@/lib/utils";

export interface CenteredContainerProps {
	children: React.ReactNode;
	className?: string;
}

/**
 * Standard centered container for full-page centered content.
 * Provides consistent padding and flex centering across the app.
 */
export function CenteredContainer({ children, className }: CenteredContainerProps) {
	return <div className={cn("flex items-center justify-center p-8", className)}>{children}</div>;
}
