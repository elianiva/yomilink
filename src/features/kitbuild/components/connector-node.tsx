import { Handle, type Node, type NodeProps, Position } from "@xyflow/react";
import { memo } from "react";
import type { ConnectorNodeData } from "../types";

const INVISIBLE_HANDLE_STYLE =
	"!absolute !opacity-0 !w-full !h-full !top-0 !left-0 !transform-none !rounded-none !border-none !min-w-0 !min-h-0";

function ConnectorNode({ data }: NodeProps<Node<ConnectorNodeData>>) {
	return (
		<div className="min-w-24 rounded-md bg-background px-3 py-1.5 shadow-sm ring-2 ring-sky-500 text-sky-800">
			<div className="text-sm font-medium leading-tight">
				{data?.label ?? "rel"}
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

export default memo(ConnectorNode);
