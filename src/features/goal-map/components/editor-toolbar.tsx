import { useAtomValue, useSetAtom } from "jotai";
import {
	ArrowRight,
	FileText,
	Grid3X3,
	Loader2,
	Maximize2,
	Plus,
	RotateCcw,
	RotateCw,
	Save,
	Search,
	Shuffle,
	Trash2,
	ZoomIn,
	ZoomOut,
} from "lucide-react";
import { memo } from "react";
import { Button } from "@/components/ui/button";
import {
	ButtonGroup,
	ButtonGroupSeparator,
} from "@/components/ui/button-group";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import {
	conceptDialogOpenAtom,
	directionEnabledAtom,
	importDialogOpenAtom,
	linkDialogOpenAtom,
	saveAsOpenAtom,
	saveOpenAtom,
	searchOpenAtom,
} from "../lib/atoms";

export type EditorToolbarProps = {
	// History
	onUndo: () => void;
	onRedo: () => void;
	// Zoom
	onZoomIn: () => void;
	onZoomOut: () => void;
	onFit: () => void;
	// Map tools
	onCenterMap: () => void;
	onToggleDirection: () => void;
	onAutoLayout: () => void;
	onDelete: () => void;
	// Actions
	onCreateKit: () => void;
	saving: boolean;
};

type IconButtonProps = {
	icon: React.ReactNode;
	label: string;
	onClick: () => void;
	variant?: "ghost" | "secondary";
	className?: string;
	disabled?: boolean;
};

function IconButton({
	icon,
	label,
	onClick,
	variant = "ghost",
	className,
	disabled,
}: IconButtonProps) {
	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<Button
					size="icon-sm"
					variant={variant}
					onClick={onClick}
					aria-label={label}
					className={className}
					disabled={disabled}
				>
					{icon}
				</Button>
			</TooltipTrigger>
			<TooltipContent side="top" sideOffset={8}>
				{label}
			</TooltipContent>
		</Tooltip>
	);
}

function ToolbarSeparator() {
	return <div className="mx-1 h-6 w-px bg-border" />;
}

function EditorToolbarImpl({
	// History
	onUndo,
	onRedo,
	// Zoom
	onZoomIn,
	onZoomOut,
	onFit,
	// Map tools
	onCenterMap,
	onToggleDirection,
	onAutoLayout,
	onDelete,
	// Actions
	onCreateKit,
	saving,
}: EditorToolbarProps) {
	const setConceptDialogOpen = useSetAtom(conceptDialogOpenAtom);
	const setLinkDialogOpen = useSetAtom(linkDialogOpenAtom);
	const setImportDialogOpen = useSetAtom(importDialogOpenAtom);
	const setSearchOpen = useSetAtom(searchOpenAtom);
	const directionEnabled = useAtomValue(directionEnabledAtom);
	const setSaveOpen = useSetAtom(saveOpenAtom);
	const setSaveAsOpen = useSetAtom(saveAsOpenAtom);

	return (
		<TooltipProvider delayDuration={100} skipDelayDuration={300}>
			{/* Bottom toolbar - all controls in one bar */}
			<div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-0.5 rounded-xl border bg-white/95 p-1.5 shadow-lg backdrop-blur-sm">
				{/* Add nodes */}
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							size="sm"
							variant="outline"
							onClick={() => setConceptDialogOpen(true)}
						>
							<Plus className="size-4" />
							Concept
						</Button>
					</TooltipTrigger>
					<TooltipContent side="top" sideOffset={8}>
						Add concept node
					</TooltipContent>
				</Tooltip>
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							size="sm"
							variant="outline"
							onClick={() => setLinkDialogOpen(true)}
						>
							<Plus className="size-4" />
							Link
						</Button>
					</TooltipTrigger>
					<TooltipContent side="top" sideOffset={8}>
						Add link node
					</TooltipContent>
				</Tooltip>
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							size="sm"
							variant="outline"
							onClick={() => setImportDialogOpen(true)}
						>
							<FileText className="size-4" />
							Import
						</Button>
					</TooltipTrigger>
					<TooltipContent side="top" sideOffset={8}>
						Import learning material
					</TooltipContent>
				</Tooltip>

				<ToolbarSeparator />

				{/* Undo/Redo */}
				<IconButton
					icon={<RotateCcw className="size-4" />}
					label="Undo"
					onClick={onUndo}
				/>
				<IconButton
					icon={<RotateCw className="size-4" />}
					label="Redo"
					onClick={onRedo}
				/>

				<ToolbarSeparator />

				{/* Zoom */}
				<IconButton
					icon={<ZoomIn className="size-4" />}
					label="Zoom in"
					onClick={onZoomIn}
				/>
				<IconButton
					icon={<ZoomOut className="size-4" />}
					label="Zoom out"
					onClick={onZoomOut}
				/>
				<IconButton
					icon={<Maximize2 className="size-4" />}
					label="Fit to screen"
					onClick={onFit}
				/>

				<ToolbarSeparator />

				{/* Map tools */}
				<IconButton
					icon={<Grid3X3 className="size-4" />}
					label="Center map"
					onClick={onCenterMap}
				/>
				<IconButton
					icon={<Search className="size-4" />}
					label="Search nodes"
					onClick={() => setSearchOpen(true)}
				/>
				<IconButton
					icon={<ArrowRight className="size-4" />}
					label={
						directionEnabled
							? "Disable edge direction"
							: "Enable edge direction"
					}
					onClick={onToggleDirection}
					variant={directionEnabled ? "secondary" : "ghost"}
				/>
				<IconButton
					icon={<Shuffle className="size-4" />}
					label="Auto-layout nodes"
					onClick={onAutoLayout}
				/>

				<ToolbarSeparator />

				{/* Delete */}
				<IconButton
					icon={<Trash2 className="size-4" />}
					label="Delete selected"
					onClick={onDelete}
					className="text-destructive hover:text-destructive hover:bg-destructive/10"
				/>

				<ToolbarSeparator />

				{/* Actions */}
				<ButtonGroup>
					<Button
						size="sm"
						variant="default"
						onClick={() => setSaveOpen(true)}
						disabled={saving}
						className="bg-blue-600 hover:bg-blue-700"
					>
						{saving ? (
							<Loader2 className="size-4 animate-spin" />
						) : (
							<Save className="size-4" />
						)}
						Save
					</Button>
					<ButtonGroupSeparator />
					<Button
						size="sm"
						variant="default"
						onClick={() => setSaveAsOpen(true)}
						disabled={saving}
						className="bg-blue-600 hover:bg-blue-700"
					>
						Save As
					</Button>
					<ButtonGroupSeparator />
					<Button
						size="sm"
						variant="default"
						onClick={onCreateKit}
						className="bg-teal-600 hover:bg-teal-700"
					>
						<Plus className="size-4" />
						Create Kit
					</Button>
				</ButtonGroup>
			</div>
		</TooltipProvider>
	);
}

export const EditorToolbar = memo(EditorToolbarImpl);
