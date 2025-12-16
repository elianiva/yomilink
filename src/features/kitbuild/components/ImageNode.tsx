import { Handle, type Node, type NodeProps, Position } from "@xyflow/react";
import { memo } from "react";
import type { ImageNodeData } from "../types";

const INVISIBLE_HANDLE_STYLE =
	"!absolute !opacity-0 !w-full !h-full !top-0 !left-0 !transform-none !rounded-none !border-none !min-w-0 !min-h-0";

function ImageNode({ data }: NodeProps<Node<ImageNodeData>>) {
	const w = data?.width ?? 160;
	const h = data?.height ?? 110;

	return (
		<div className="overflow-hidden rounded-md bg-background shadow-sm ring-1 ring-border">
			<div className="relative" style={{ width: w, height: h }}>
				{/* eslint-disable-next-line @next/next/no-img-element */}
				<img
					src={data?.url}
					alt={data?.caption ?? "image"}
					className="h-full w-full object-cover"
					draggable={false}
				/>
			</div>
			{data?.caption ? (
				<div className="px-2 py-1 text-xs text-muted-foreground">
					{data.caption}
				</div>
			) : null}

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

export default memo(ImageNode);
