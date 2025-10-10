import { Handle, type Node, type NodeProps, Position } from "@xyflow/react";
import { memo } from "react";

export type ConnectorNodeData = { label: string };

function ConnectorNode({ data }: NodeProps<Node<ConnectorNodeData>>) {
	return (
		<div className="min-w-24 rounded-md bg-background px-3 py-1.5 shadow-sm ring-2 ring-sky-500 text-sky-800">
			<div className="text-sm font-medium leading-tight">
				{data?.label ?? "rel"}
			</div>

			<Handle type="target" position={Position.Top} className="size-2" />
			<Handle type="source" position={Position.Right} className="size-2" />
			<Handle type="source" position={Position.Bottom} className="size-2" />
			<Handle type="target" position={Position.Left} className="size-2" />
		</div>
	);
}

export default memo(ConnectorNode);
