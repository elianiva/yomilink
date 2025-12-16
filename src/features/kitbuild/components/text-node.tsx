import { Handle, type Node, type NodeProps, Position } from "@xyflow/react";
import { memo } from "react";
import { cn } from "@/lib/utils";
import type { TextNodeData } from "../types";

const INVISIBLE_HANDLE_STYLE =
	"!absolute !opacity-0 !w-full !h-full !top-0 !left-0 !transform-none !rounded-none !border-none !min-w-0 !min-h-0";

/**
 * Maps color values to Tailwind classes.
 * We need explicit mappings because Tailwind purges dynamic class names.
 */
const COLOR_CLASSES: Record<string, { ring: string; text: string }> = {
	"red-500": { ring: "ring-red-500", text: "text-red-800" },
	"orange-500": { ring: "ring-orange-500", text: "text-orange-800" },
	"amber-500": { ring: "ring-amber-500", text: "text-amber-800" },
	"yellow-500": { ring: "ring-yellow-500", text: "text-yellow-800" },
	"lime-500": { ring: "ring-lime-500", text: "text-lime-800" },
	"green-500": { ring: "ring-green-500", text: "text-green-800" },
	"emerald-500": { ring: "ring-emerald-500", text: "text-emerald-800" },
	"teal-500": { ring: "ring-teal-500", text: "text-teal-800" },
	"cyan-500": { ring: "ring-cyan-500", text: "text-cyan-800" },
	"sky-500": { ring: "ring-sky-500", text: "text-sky-800" },
	"blue-500": { ring: "ring-blue-500", text: "text-blue-800" },
	"indigo-500": { ring: "ring-indigo-500", text: "text-indigo-800" },
	"violet-500": { ring: "ring-violet-500", text: "text-violet-800" },
	"purple-500": { ring: "ring-purple-500", text: "text-purple-800" },
	"fuchsia-500": { ring: "ring-fuchsia-500", text: "text-fuchsia-800" },
	"pink-500": { ring: "ring-pink-500", text: "text-pink-800" },
};

function getColorClasses(data?: TextNodeData): string {
	// New color system takes precedence
	if (data?.color && COLOR_CLASSES[data.color]) {
		const c = COLOR_CLASSES[data.color];
		return cn(c.ring, c.text, "bg-background");
	}

	// Legacy variant support
	if (data?.variant === "green") {
		return "ring-emerald-500 text-emerald-800 bg-background";
	}
	if (data?.variant === "blue") {
		return "ring-sky-500 text-sky-800 bg-background";
	}

	// Default (amber for visibility)
	return "ring-amber-500 text-amber-800 bg-background";
}

function TextNodeComponent({ data }: NodeProps<Node<TextNodeData>>) {
	const colorClasses = getColorClasses(data);

	return (
		<div
			className={cn(
				"min-w-28 rounded-md px-3 py-2 shadow-sm ring-2",
				colorClasses,
			)}
		>
			<div className="text-sm font-medium leading-tight">
				{data?.label ?? "Text"}
			</div>

			{/* Invisible handles that cover the entire node for floating edges */}
			<Handle
				type="target"
				id="target"
				position={Position.Top}
				className={INVISIBLE_HANDLE_STYLE}
			/>
			<Handle
				type="source"
				id="source"
				position={Position.Bottom}
				className={INVISIBLE_HANDLE_STYLE}
			/>
		</div>
	);
}

export const TextNode = memo(TextNodeComponent);
