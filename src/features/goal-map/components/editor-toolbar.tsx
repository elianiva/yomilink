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
import { Separator } from "@/components/ui/separator";
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
	onUndo: () => void;
	onRedo: () => void;
	onZoomIn: () => void;
	onZoomOut: () => void;
	onFit: () => void;
	onCenterMap: () => void;
	onToggleDirection: () => void;
	onAutoLayout: () => void;
	onDelete: () => void;
	onSave: () => void;
	onCreateKit: () => void;
	saving: boolean;
	isNewMap: boolean;
	kitStatus?: {
		exists: boolean;
		layout: "preset" | "random";
		nodeCount: number;
		updatedAt: number | null;
		isOutdated: boolean;
	} | null;
	isGeneratingKit?: boolean;
};

function EditorToolbarImpl({
	onUndo,
	onRedo,
	onZoomIn,
	onZoomOut,
	onFit,
	onCenterMap,
	onToggleDirection,
	onAutoLayout,
	onDelete,
	onSave,
	onCreateKit,
	saving,
	isNewMap,
	kitStatus,
	isGeneratingKit,
}: EditorToolbarProps) {
	const setConceptDialogOpen = useSetAtom(conceptDialogOpenAtom);
	const setLinkDialogOpen = useSetAtom(linkDialogOpenAtom);
	const setImportDialogOpen = useSetAtom(importDialogOpenAtom);
	const setSearchOpen = useSetAtom(searchOpenAtom);
	const directionEnabled = useAtomValue(directionEnabledAtom);
	const setSaveOpen = useSetAtom(saveOpenAtom);
	const setSaveAsOpen = useSetAtom(saveAsOpenAtom);

	const handleSave = () => {
		if (isNewMap) {
			setSaveOpen(true);
		} else {
			onSave();
		}
	};

	return (
		<TooltipProvider delayDuration={300}>
			<div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1 rounded-xl border bg-white/90 p-1.5 shadow-lg backdrop-blur-sm h-12">
				<ButtonGroup className="mr-1">
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
					<ButtonGroupSeparator />
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
					<ButtonGroupSeparator />
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
				</ButtonGroup>

				<Separator orientation="vertical" className="h-5! mx-1" />

				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							variant="ghost"
							size="icon"
							className="size-8"
							onClick={onUndo}
							aria-label="Undo"
						>
							<RotateCcw className="size-4" />
						</Button>
					</TooltipTrigger>
					<TooltipContent side="top" sideOffset={8}>
						Undo
					</TooltipContent>
				</Tooltip>
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							variant="ghost"
							size="icon"
							className="size-8"
							onClick={onRedo}
							aria-label="Redo"
						>
							<RotateCw className="size-4" />
						</Button>
					</TooltipTrigger>
					<TooltipContent side="top" sideOffset={8}>
						Redo
					</TooltipContent>
				</Tooltip>

				<Separator orientation="vertical" className="h-5! mx-1" />

				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							variant="ghost"
							size="icon"
							className="size-8"
							onClick={onZoomIn}
							aria-label="Zoom in"
						>
							<ZoomIn className="size-4" />
						</Button>
					</TooltipTrigger>
					<TooltipContent side="top" sideOffset={8}>
						Zoom in
					</TooltipContent>
				</Tooltip>
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							variant="ghost"
							size="icon"
							className="size-8"
							onClick={onZoomOut}
							aria-label="Zoom out"
						>
							<ZoomOut className="size-4" />
						</Button>
					</TooltipTrigger>
					<TooltipContent side="top" sideOffset={8}>
						Zoom out
					</TooltipContent>
				</Tooltip>
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							variant="ghost"
							size="icon"
							className="size-8"
							onClick={onFit}
							aria-label="Fit to screen"
						>
							<Maximize2 className="size-4" />
						</Button>
					</TooltipTrigger>
					<TooltipContent side="top" sideOffset={8}>
						Fit to screen
					</TooltipContent>
				</Tooltip>

				<Separator orientation="vertical" className="h-5! mx-1" />

				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							variant="ghost"
							size="icon"
							className="size-8"
							onClick={onCenterMap}
							aria-label="Center map"
						>
							<Grid3X3 className="size-4" />
						</Button>
					</TooltipTrigger>
					<TooltipContent side="top" sideOffset={8}>
						Center map
					</TooltipContent>
				</Tooltip>
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							variant="ghost"
							size="icon"
							className="size-8"
							onClick={() => setSearchOpen(true)}
							aria-label="Search nodes"
						>
							<Search className="size-4" />
						</Button>
					</TooltipTrigger>
					<TooltipContent side="top" sideOffset={8}>
						Search nodes
					</TooltipContent>
				</Tooltip>
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							variant={directionEnabled ? "secondary" : "ghost"}
							size="icon"
							className="size-8"
							onClick={onToggleDirection}
							aria-label={
								directionEnabled
									? "Disable edge direction"
									: "Enable edge direction"
							}
						>
							<ArrowRight className="size-4" />
						</Button>
					</TooltipTrigger>
					<TooltipContent side="top" sideOffset={8}>
						{directionEnabled
							? "Disable edge direction"
							: "Enable edge direction"}
					</TooltipContent>
				</Tooltip>
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							variant="ghost"
							size="icon"
							className="size-8"
							onClick={onAutoLayout}
							aria-label="Auto-layout nodes"
						>
							<Shuffle className="size-4" />
						</Button>
					</TooltipTrigger>
					<TooltipContent side="top" sideOffset={8}>
						Auto-layout nodes
					</TooltipContent>
				</Tooltip>

				<Separator orientation="vertical" className="h-5! mx-1" />

				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							variant="ghost"
							size="icon"
							className="size-8 text-destructive hover:text-destructive hover:bg-destructive/10"
							onClick={onDelete}
							aria-label="Delete selected"
						>
							<Trash2 className="size-4" />
						</Button>
					</TooltipTrigger>
					<TooltipContent side="top" sideOffset={8}>
						Delete selected
					</TooltipContent>
				</Tooltip>

				<Separator orientation="vertical" className="h-5! mx-1" />

				<ButtonGroup className="ml-1">
					<Button
						size="sm"
						variant="default"
						onClick={handleSave}
						disabled={saving}
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
					>
						Save As
					</Button>
					<ButtonGroupSeparator />
					{!isNewMap && (
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									size="sm"
									variant={
										kitStatus?.exists && !kitStatus.isOutdated
											? "secondary"
											: "default"
									}
									onClick={onCreateKit}
									disabled={isGeneratingKit || saving}
								>
									{isGeneratingKit ? (
										<Loader2 className="size-4 animate-spin" />
									) : (
										<Plus className="size-4" />
									)}
									{kitStatus?.exists && !kitStatus.isOutdated
										? "Update Kit"
										: "Create Kit"}
								</Button>
							</TooltipTrigger>
							<TooltipContent side="top" sideOffset={8}>
								{kitStatus ? (
									<div className="flex flex-col gap-1">
										<div className="flex items-center gap-2">
											{kitStatus.exists ? (
												<>
													<div className="w-2 h-2 bg-green-500 rounded-full" />
													<span className="font-medium">Kit Generated</span>
												</>
											) : (
												<>
													<div className="w-2 h-2 bg-gray-400 rounded-full" />
													<span className="font-medium">No Kit</span>
												</>
											)}
										</div>
										{kitStatus.exists && (
											<div className="text-xs text-muted-foreground">
												{kitStatus.nodeCount} nodes
												{kitStatus.isOutdated && (
													<span className="text-amber-500 ml-1">
														(Outdated)
													</span>
												)}
											</div>
										)}
									</div>
								) : (
									"Create a kit from this map"
								)}
							</TooltipContent>
						</Tooltip>
					)}
				</ButtonGroup>
			</div>
		</TooltipProvider>
	);
}

export const EditorToolbar = memo(EditorToolbarImpl);
