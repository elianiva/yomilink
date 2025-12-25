import { Handle, type Node, type NodeProps, Position } from "@xyflow/react";
import { useAtomValue } from "jotai";
import { memo } from "react";
import { contextMenuAtom } from "@/features/goal-map/lib/atoms";
import { cn } from "@/lib/utils";
import type { ConnectorNodeData } from "../types";

// Small invisible handles at center - only used for edge anchoring, not for initiating connections
const ANCHOR_HANDLE_STYLE =
	"!absolute !opacity-0 !w-1 !h-1 !min-w-0 !min-h-0 !border-none !pointer-events-none";

function ConnectorNodeComponent({
	id,
	data,
}: NodeProps<Node<ConnectorNodeData>>) {
	const contextMenu = useAtomValue(contextMenuAtom);
	const isActive = contextMenu?.nodeId === id;

	return (
		<div
			className={cn(
				"min-w-24 rounded-md bg-background px-3 py-1.5 shadow-sm ring-2 ring-sky-500 text-sky-800 transition-all duration-150",
				isActive && "ring-4 scale-105 z-50 shadow-lg",
				"connector-node",
			)}
			data-tour-step="connector-nodes"
		>
			<div className="text-sm font-medium leading-tight">
				{data?.label ?? "rel"}
			</div>

			{/* Small invisible handles at center - only for edge anchoring, not for initiating connections */}
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

export const ConnectorNode = memo(ConnectorNodeComponent);
