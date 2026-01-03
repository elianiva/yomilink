import { cn } from "@/lib/utils";

interface ConnectionModeIndicatorProps {
	/** Whether the connection mode is active */
	active: boolean;
	/** The direction of the connection: "to" or "from" */
	direction: "to" | "from";
	/** Callback when the user cancels the connection mode */
	onCancel: () => void;
	/** Optional additional class names */
	className?: string;
}

/**
 * A visual indicator shown when the user is in "connection mode",
 * i.e., selecting a concept to connect to/from a link node.
 */
export function ConnectionModeIndicator({
	active,
	direction,
	onCancel,
	className,
}: ConnectionModeIndicatorProps) {
	if (!active) return null;

	return (
		<div
			className={cn(
				"absolute bottom-20 left-1/2 -translate-x-1/2 z-20",
				"bg-blue-500 text-white border border-blue-600 rounded-lg px-3 py-1.5 shadow-lg text-sm",
				"flex items-center gap-2",
				className,
			)}
		>
			<span>
				Click a concept to connect {direction === "to" ? "to" : "from"}
			</span>
			<button
				type="button"
				onClick={onCancel}
				className="text-xs text-white/80 hover:text-white underline"
			>
				Cancel
			</button>
		</div>
	);
}
