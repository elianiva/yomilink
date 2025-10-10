import { Handle, type Node, type NodeProps, Position } from "@xyflow/react";
import { memo } from "react";

export type TextNodeData = {
	label: string;
	variant?: "green" | "blue" | "default";
};

function TextNode({ data }: NodeProps<Node<TextNodeData>>) {
	const variantClasses =
		data?.variant === "green"
			? "ring-emerald-500 text-emerald-800 bg-background"
			: data?.variant === "blue"
				? "ring-sky-500 text-sky-800 bg-background"
				: "ring-border text-foreground bg-background";

	return (
		<div
			className={`min-w-28 rounded-md px-3 py-2 shadow-sm ring-2 ${variantClasses}`}
		>
			<div className="text-sm font-medium leading-tight">
				{data?.label ?? "Text"}
			</div>

			<Handle type="target" position={Position.Top} className="size-2" />
			<Handle type="source" position={Position.Right} className="size-2" />
			<Handle type="source" position={Position.Bottom} className="size-2" />
			<Handle type="target" position={Position.Left} className="size-2" />
		</div>
	);
}

export default memo(TextNode);
