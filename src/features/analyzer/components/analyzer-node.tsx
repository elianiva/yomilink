import { memo } from "react";
import { Handle, type Node, type NodeProps } from "@xyflow/react";
import { cn } from "@/lib/utils";

export interface AnalyzerNodeData {
	isAbandoned?: boolean;
	isUsed?: boolean;
}

export function AnalyzerNode({ data }: NodeProps<AnalyzerNodeData>) {
	const { isAbandoned, isUsed } = data || {};

	return (
		<div
			className={cn(
				"min-w-24 rounded-md px-3 py-2 shadow-sm ring-2",
				isAbandoned && "opacity-50 grayscale",
				!isUsed && "opacity-40 grayscale",
			)}
		>
			<Handle
				type="target"
				position={Position.Top}
				className="!opacity-0 !w-1 !h-1"
				isConnectable={false}
			/>
			<Handle
				type="source"
				position={Position.Bottom}
				className="!opacity-0 !w-1 !h-1"
				isConnectable={false}
			/>
			<div
				className={cn(
					"text-sm font-medium leading-tight",
					isAbandoned && "line-through text-muted-foreground",
					!isUsed && "text-muted-foreground",
				)}
			>
				{data?.label || "Node"}
			</div>
		</div>
	);
}

export default memo(AnalyzerNode);
