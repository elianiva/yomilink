import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { cn } from "@/lib/utils";

export interface AnalyzerNodeData {
	isAbandoned?: boolean;
	isUsed?: boolean;
	label: string;
}

export function AnalyzerNode({ data }: { data: AnalyzerNodeData }) {
	const { isAbandoned, isUsed, label } = data;

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
				{label}
			</div>
		</div>
	);
}

export default memo(AnalyzerNode);
