import { cn } from "@/lib/utils";

interface ContextMenuOverlayProps {
	/** Whether the overlay is visible */
	visible: boolean;
	/** Optional additional class names */
	className?: string;
}

/**
 * A dark overlay that appears when a context menu is open.
 * This provides visual feedback that the canvas is in a special interaction state.
 */
export function ContextMenuOverlay({
	visible,
	className,
}: ContextMenuOverlayProps) {
	if (!visible) return null;

	return (
		<div
			className={cn(
				"absolute inset-0 bg-black/30 z-40 pointer-events-none animate-in fade-in duration-150",
				className,
			)}
			aria-hidden="true"
		/>
	);
}
