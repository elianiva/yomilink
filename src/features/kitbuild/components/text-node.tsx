import { Handle, type Node, type NodeProps, Position } from "@xyflow/react";
import { useAtomValue } from "jotai";
import { memo } from "react";

import { contextMenuAtom } from "@/features/goal-map/lib/atoms";
import { cn } from "@/lib/utils";

// Small invisible handles at center - only used for edge anchoring, not for initiating connections
const ANCHOR_HANDLE_STYLE =
	"!absolute !opacity-0 !w-1 !h-1 !min-w-0 !min-h-0 !border-none !pointer-events-none";

/**
 * Maps color values to Tailwind classes.
 * We need explicit mappings because Tailwind purges dynamic class names.
 */
const COLOR_CLASSES: Record<string, { ring: string; text: string }> = {
	"red": { ring: "ring-red-500", text: "text-red-800" },
	"orange": { ring: "ring-orange-500", text: "text-orange-800" },
	"amber": { ring: "ring-amber-500", text: "text-amber-800" },
	"yellow": { ring: "ring-yellow-500", text: "text-yellow-800" },
	"lime": { ring: "ring-lime-500", text: "text-lime-800" },
	"green": { ring: "ring-green-500", text: "text-green-800" },
	"emerald": { ring: "ring-emerald-500", text: "text-emerald-800" },
	"teal": { ring: "ring-teal-500", text: "text-teal-800" },
	"cyan": { ring: "ring-cyan-500", text: "text-cyan-800" },
	"sky": { ring: "ring-sky-500", text: "text-sky-800" },
	"blue": { ring: "ring-blue-500", text: "text-blue-800" },
	"indigo": { ring: "ring-indigo-500", text: "text-indigo-800" },
	"violet": { ring: "ring-violet-500", text: "text-violet-800" },
	"purple": { ring: "ring-purple-500", text: "text-purple-800" },
	"fuchsia": { ring: "ring-fuchsia-500", text: "text-fuchsia-800" },
	"pink": { ring: "ring-pink-500", text: "text-pink-800" },
};

type TextNodeData = {
	label: string;
	color?: string;
};

function getColorClasses(data?: TextNodeData): string {
	const colour = data?.color ?? "amber";
	const c = COLOR_CLASSES[colour];
	return cn(c.ring, c.text, "bg-background");
}

function TextNodeComponent({ id, data }: Partial<NodeProps<Node<TextNodeData>>>) {
	const contextMenu = useAtomValue(contextMenuAtom);
	const isActive = contextMenu?.nodeId === id;
	const colorClasses = getColorClasses(data);

	return (
		<div
			className={cn(
				"w-fit min-h-16 min-w-24 max-w-52 rounded-md px-3 py-2 shadow-sm ring-2 transition-all duration-150 flex items-center justify-center",
				colorClasses,
				isActive && "ring-4 scale-105 z-50 shadow-lg",
			)}
		>
			<p className="text-sm font-medium leading-tight text-center">{data?.label ?? "Text"}</p>
			<Handle
				type="target"
				id="target"
				position={Position.Top}
				className={ANCHOR_HANDLE_STYLE}
				isConnectable={false}
			/>
			<Handle
				type="source"
				id="source"
				position={Position.Bottom}
				className={ANCHOR_HANDLE_STYLE}
				isConnectable={false}
			/>
		</div>
	);
}

export const TextNode = memo(TextNodeComponent);
