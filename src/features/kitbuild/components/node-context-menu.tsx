import { ArrowLeft, ArrowRight, Pencil, Trash2 } from "lucide-react";
import { memo } from "react";
import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export type NodeContextMenuProps = {
	nodeId: string;
	nodeType: "text" | "connector";
	position: { x: number; y: number };
	onEdit: () => void;
	onDelete: () => void;
	onConnectTo?: () => void;
	onConnectFrom?: () => void;
	onClose: () => void;
};

type ActionButtonProps = {
	icon: React.ReactNode;
	label: string;
	onClick: () => void;
	variant?: "default" | "destructive";
};

function ActionButton({
	icon,
	label,
	onClick,
	variant = "default",
}: ActionButtonProps) {
	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<Button
					variant="ghost"
					size="icon"
					className={cn(
						"size-8",
						variant === "destructive" &&
							"text-destructive hover:text-destructive hover:bg-destructive/10",
					)}
					onClick={(e) => {
						e.stopPropagation();
						onClick();
					}}
				>
					{icon}
				</Button>
			</TooltipTrigger>
			<TooltipContent side="bottom" sideOffset={4}>
				{label}
			</TooltipContent>
		</Tooltip>
	);
}

function NodeContextMenuImpl({
	nodeType,
	position,
	onEdit,
	onDelete,
	onConnectTo,
	onConnectFrom,
}: NodeContextMenuProps) {
	return (
		<TooltipProvider delayDuration={300}>
			{/* Wrapper for positioning - keeps transform separate from animation */}
			<div
				className="fixed z-50"
				style={{
					left: position.x,
					top: position.y,
					transform: "translate(-50%, -100%) translateY(-8px)",
				}}
			>
				{/* biome-ignore lint/a11y/useKeyWithClickEvents: context menu doesn't need keyboard interaction */}
				{/* biome-ignore lint/a11y/noStaticElementInteractions: stopPropagation needed to prevent closing */}
				<div
					className="flex items-center gap-0.5 rounded-lg border bg-background px-1 py-1 shadow-lg animate-in fade-in zoom-in-95 duration-150 origin-bottom"
					onClick={(e) => e.stopPropagation()}
				>
					{/* Connection actions - only for connector/link nodes */}
					{nodeType === "connector" && (
						<>
							{onConnectFrom && (
								<ActionButton
									icon={<ArrowLeft className="size-4" />}
									label="Connect From"
									onClick={onConnectFrom}
								/>
							)}
							{onConnectTo && (
								<ActionButton
									icon={<ArrowRight className="size-4" />}
									label="Connect To"
									onClick={onConnectTo}
								/>
							)}
							<div className="mx-1 h-5 w-px bg-border" />
						</>
					)}

					{/* Common actions */}
					<ActionButton
						icon={<Pencil className="size-4" />}
						label="Edit"
						onClick={onEdit}
					/>
					<ActionButton
						icon={<Trash2 className="size-4" />}
						label="Delete"
						onClick={onDelete}
						variant="destructive"
					/>
				</div>
			</div>
		</TooltipProvider>
	);
}

export const NodeContextMenu = memo(NodeContextMenuImpl);
