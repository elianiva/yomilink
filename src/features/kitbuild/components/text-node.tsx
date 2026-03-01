import { Handle, type Node, type NodeProps, Position } from "@xyflow/react";
import { useAtomValue } from "jotai";
import { memo } from "react";

import { contextMenuAtom } from "@/features/goal-map/lib/atoms";
import { cn } from "@/lib/utils";

/**
 * Maps color values to Tailwind classes.
 * We need explicit mappings because Tailwind purges dynamic class names.
 */
const COLOR_CLASSES: Record<string, { ring: string; text: string; border: string }> = {
	red: { ring: "ring-red-500", text: "text-red-800", border: "!border-red-500" },
	orange: { ring: "ring-orange-500", text: "text-orange-800", border: "!border-orange-500" },
	amber: { ring: "ring-amber-500", text: "text-amber-800", border: "!border-amber-500" },
	yellow: { ring: "ring-yellow-500", text: "text-yellow-800", border: "!border-yellow-500" },
	lime: { ring: "ring-lime-500", text: "text-lime-800", border: "!border-lime-500" },
	green: { ring: "ring-green-500", text: "text-green-800", border: "!border-green-500" },
	emerald: { ring: "ring-emerald-500", text: "text-emerald-800", border: "!border-emerald-500" },
	teal: { ring: "ring-teal-500", text: "text-teal-800", border: "!border-teal-500" },
	cyan: { ring: "ring-cyan-500", text: "text-cyan-800", border: "!border-cyan-500" },
	sky: { ring: "ring-sky-500", text: "text-sky-800", border: "!border-sky-500" },
	blue: { ring: "ring-blue-500", text: "text-blue-800", border: "!border-blue-500" },
	indigo: { ring: "ring-indigo-500", text: "text-indigo-800", border: "!border-indigo-500" },
	violet: { ring: "ring-violet-500", text: "text-violet-800", border: "!border-violet-500" },
	purple: { ring: "ring-purple-500", text: "text-purple-800", border: "!border-purple-500" },
	fuchsia: { ring: "ring-fuchsia-500", text: "text-fuchsia-800", border: "!border-fuchsia-500" },
	pink: { ring: "ring-pink-500", text: "text-pink-800", border: "!border-pink-500" },
};

type TextNodeData = {
	label: string;
	color?: string;
};

function getColorClasses(data?: TextNodeData) {
	const colour = data?.color ?? "amber";
	const c = COLOR_CLASSES[colour];
	return {
		container: cn(c.ring, c.text, "bg-background"),
		handle: c.border,
	};
}

const HANDLE_CLASSES = "!w-3 !h-3 !bg-background !border-2";

function TextNodeComponent({ id, data }: Partial<NodeProps<Node<TextNodeData>>>) {
	const contextMenu = useAtomValue(contextMenuAtom);
	const isActive = contextMenu?.nodeId === id;
	const colorClasses = getColorClasses(data);

	return (
		<div
			className={cn(
				"w-fit min-h-16 min-w-24 max-w-52 rounded-md px-3 py-2 shadow-sm ring-2 transition-all duration-150 flex items-center justify-center relative",
				colorClasses.container,
				isActive && "ring-4 scale-105 z-50 shadow-lg",
			)}
		>
			<p className="text-sm font-medium leading-tight text-center">{data?.label ?? "Text"}</p>
			{/* Target handle - left side */}
			<Handle
				type="target"
				id="target"
				position={Position.Left}
				isConnectable={true}
				className={cn(HANDLE_CLASSES, colorClasses.handle)}
			/>
			{/* Source handle - right side */}
			<Handle
				type="source"
				id="source"
				position={Position.Right}
				isConnectable={true}
				className={cn(HANDLE_CLASSES, colorClasses.handle)}
			/>
		</div>
	);
}

export const TextNode = memo(TextNodeComponent);
