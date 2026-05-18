import { Handle, type Node, type NodeProps, Position, useReactFlow } from "@xyflow/react";
import { useAtomValue, useSetAtom } from "jotai";
import { Pencil, Trash2 } from "lucide-react";
import { memo } from "react";

import { contextMenuAtom, editNodeAtom } from "@/features/goal-map/lib/atoms";
import { cn } from "@/lib/utils";

const HANDLE_CLASSES = "!w-3 !h-3 !bg-background !border-2 !border-sky-500";

function ConnectorNodeComponent({
	id,
	data,
	selected,
}: Partial<NodeProps<Node<{ label: string }>>>) {
	const contextMenu = useAtomValue(contextMenuAtom);
	const isActive = contextMenu?.nodeId === id;
	const { deleteElements } = useReactFlow();
	const setEditNode = useSetAtom(editNodeAtom);

	return (
		<div
			className={cn(
				"w-fit min-w-24 rounded-md bg-background px-3 py-1.5 shadow-sm ring-2 ring-sky-500 text-sky-800 transition-all duration-150 relative",
				isActive && "ring-4 scale-105 z-50 shadow-lg",
			)}
		>
			{/* Toolbar — shown when selected */}
			{selected && (
				<div className="absolute -top-4 right-1/2 translate-x-1/2 z-20 flex items-center gap-0.5 rounded-md border bg-background p-0.5 shadow-md">
					<button
						type="button"
						className="flex items-center justify-center size-6 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer"
						title="Edit"
						onClick={(e) => {
							e.stopPropagation();
							setEditNode({
								id: id!,
								type: "connector",
								label: data?.label ?? "",
							});
						}}
					>
						<Pencil className="size-3.5" />
					</button>
					<button
						type="button"
						className="flex items-center justify-center size-6 rounded text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
						title="Delete"
						onClick={(e) => {
							e.stopPropagation();
							void deleteElements({ nodes: [{ id: id! }] });
						}}
					>
						<Trash2 className="size-3.5" />
					</button>
				</div>
			)}
			<p className="text-sm font-medium leading-tight text-center w-full">
				{data?.label ?? "rel"}
			</p>

			{/* Connection handles - both source type for ConnectionMode.Loose */}
			<Handle
				type="source"
				id="left"
				position={Position.Left}
				isConnectable={true}
				className={HANDLE_CLASSES}
			/>
			<Handle
				type="source"
				id="right"
				position={Position.Right}
				isConnectable={true}
				className={HANDLE_CLASSES}
			/>
		</div>
	);
}

export const ConnectorNode = memo(ConnectorNodeComponent);
