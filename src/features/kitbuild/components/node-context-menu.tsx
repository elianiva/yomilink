import { ArrowLeft, ArrowRight, Pencil, Trash2 } from "lucide-react";
import { memo, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
	createTooltipHandle,
	Tooltip,
	TooltipArrow,
	TooltipPopup,
	TooltipPortal,
	TooltipPositioner,
	TooltipProvider,
	TooltipTrigger,
	TooltipViewport,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const tooltipHandle = createTooltipHandle();

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
		<TooltipTrigger
			handle={tooltipHandle}
			render={
				<Button
					variant="ghost"
					size="icon"
					role="menuitem"
					aria-label={label}
					className={cn(
						"size-8",
						variant === "destructive" &&
							"text-destructive hover:text-destructive hover:bg-destructive/10",
					)}
					onClick={(e) => {
						e.stopPropagation();
						onClick();
					}}
				/>
			}
			payload={label}
		>
			{icon}
		</TooltipTrigger>
	);
}

function NodeContextMenuImpl({
	nodeType,
	position,
	onEdit,
	onDelete,
	onConnectTo,
	onConnectFrom,
	onClose,
}: NodeContextMenuProps) {
	const menuRef = useRef<HTMLDivElement>(null);

	// Auto-focus menu when it opens
	useEffect(() => {
		if (menuRef.current) {
			menuRef.current.focus();
		}
	}, []);

	// Handle keyboard navigation
	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			const menuItems =
				menuRef.current?.querySelectorAll<HTMLButtonElement>(
					'[role="menuitem"]',
				);
			if (!menuItems?.length) return;

			const currentIndex = Array.from(menuItems).indexOf(
				document.activeElement as HTMLButtonElement,
			);

			switch (e.key) {
				case "ArrowRight":
				case "ArrowDown": {
					e.preventDefault();
					const nextIndex = (currentIndex + 1) % menuItems.length;
					menuItems[nextIndex]?.focus();
					break;
				}
				case "ArrowLeft":
				case "ArrowUp": {
					e.preventDefault();
					const prevIndex =
						currentIndex <= 0 ? menuItems.length - 1 : currentIndex - 1;
					menuItems[prevIndex]?.focus();
					break;
				}
				case "Home": {
					e.preventDefault();
					menuItems[0]?.focus();
					break;
				}
				case "End": {
					e.preventDefault();
					menuItems[menuItems.length - 1]?.focus();
					break;
				}
				case "Escape": {
					e.preventDefault();
					onClose();
					break;
				}
			}
		},
		[onClose],
	);

	return (
		<TooltipProvider delay={300}>
			{/* Wrapper for positioning - keeps transform separate from animation */}
			<div
				className="fixed z-50"
				style={{
					left: position.x,
					top: position.y,
					transform: "translate(-50%, -100%) translateY(-8px)",
				}}
			>
				<div
					ref={menuRef}
					role="menu"
					aria-label="Node actions"
					tabIndex={-1}
					className="flex items-center gap-0.5 rounded-lg border bg-background px-1 py-1 shadow-lg animate-in fade-in zoom-in-95 duration-150 origin-bottom focus:outline-none"
					onClick={(e) => e.stopPropagation()}
					onKeyDown={handleKeyDown}
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
							<div className="mx-1 h-5 w-px bg-border" aria-hidden="true" />
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
				<Tooltip handle={tooltipHandle}>
					{({ payload }) => (
						<TooltipPortal>
							<TooltipPositioner>
								<TooltipPopup>
									<TooltipArrow />
									<TooltipViewport>
										{payload as React.ReactNode}
									</TooltipViewport>
								</TooltipPopup>
							</TooltipPositioner>
						</TooltipPortal>
					)}
				</Tooltip>
			</div>
		</TooltipProvider>
	);
}

export const NodeContextMenu = memo(NodeContextMenuImpl);
