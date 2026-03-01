import { Handle, type Node, type NodeProps, Position } from "@xyflow/react";
import { useAtomValue } from "jotai";
import { memo } from "react";

import { contextMenuAtom } from "@/features/goal-map/lib/atoms";
import { cn } from "@/lib/utils";

const HANDLE_CLASSES = "!w-3 !h-3 !bg-background !border-2 !border-sky-500";

function ConnectorNodeComponent({ id, data }: NodeProps<Node<{ label: string }>>) {
	const contextMenu = useAtomValue(contextMenuAtom);
	const isActive = contextMenu?.nodeId === id;

	return (
		<div
			className={cn(
				"min-w-24 rounded-md bg-background px-3 py-1.5 shadow-sm ring-2 ring-sky-500 text-sky-800 transition-all duration-150 relative flex items-center justify-center",
				isActive && "ring-4 scale-105 z-50 shadow-lg",
			)}
		>
			<p className="text-sm font-medium leading-tight text-center w-full">
				{data?.label ?? "rel"}
			</p>

			{/* Target handle - left side */}
			<Handle
				type="target"
				id="target"
				position={Position.Left}
				isConnectable={true}
				className={HANDLE_CLASSES}
			/>
			{/* Source handle - right side */}
			<Handle
				type="source"
				id="source"
				position={Position.Right}
				isConnectable={true}
				className={HANDLE_CLASSES}
			/>
		</div>
	);
}

export const ConnectorNode = memo(ConnectorNodeComponent);
