import { Handle, type Node, type NodeProps, Position } from "@xyflow/react";
import { memo } from "react";

export type ImageNodeData = {
	url: string;
	caption?: string;
	width?: number;
	height?: number;
};

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

			<Handle type="target" position={Position.Top} className="size-2" />
			<Handle type="source" position={Position.Right} className="size-2" />
			<Handle type="source" position={Position.Bottom} className="size-2" />
			<Handle type="target" position={Position.Left} className="size-2" />
		</div>
	);
}

export default memo(ImageNode);
