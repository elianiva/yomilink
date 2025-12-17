import { useAtom, useAtomValue, useSetAtom } from "jotai";
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
import { ColorPicker } from "@/features/kitbuild/components/color-picker";
import { cn } from "@/lib/utils";
import {
	conceptDialogOpenAtom,
	directionEnabledAtom,
	importDialogOpenAtom,
	linkDialogOpenAtom,
	saveAsOpenAtom,
	saveOpenAtom,
	searchOpenAtom,
	selectedColorAtom,
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

function ToolbarGroup({
	children,
	className,
}: {
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<div
			className={cn(
				"inline-flex items-center gap-1 rounded-md p-1 bg-white",
				className,
			)}
		>
			{children}
		</div>
	);
}

function ToolbarSeparator() {
	return <div className="mx-1 h-5 w-px bg-border" />;
}

function ToolbarLabel({ children }: { children: React.ReactNode }) {
	return (
		<span className="px-2 text-sm font-medium text-muted-foreground">
			{children}
		</span>
	);
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
	const [selectedColor, setSelectedColor] = useAtom(selectedColorAtom);
	const setConceptDialogOpen = useSetAtom(conceptDialogOpenAtom);
	const setLinkDialogOpen = useSetAtom(linkDialogOpenAtom);
	const setImportDialogOpen = useSetAtom(importDialogOpenAtom);
	const setSearchOpen = useSetAtom(searchOpenAtom);
	const directionEnabled = useAtomValue(directionEnabledAtom);
	const setSaveOpen = useSetAtom(saveOpenAtom);
	const setSaveAsOpen = useSetAtom(saveAsOpenAtom);

	return (
		<div className="flex items-center justify-between">
			<div className="flex items-center gap-2 flex-wrap">
				{/* Add Nodes Group */}
				<ToolbarGroup>
					<Button
						size="icon"
						variant="ghost"
						onClick={() => setConceptDialogOpen(true)}
						title="Add concept (quick)"
						aria-label="Add concept"
					>
						<Plus className="size-4" />
					</Button>
					<ColorPicker value={selectedColor} onChange={setSelectedColor} />
					<Button
						size="sm"
						variant="outline"
						onClick={() => setConceptDialogOpen(true)}
					>
						Concept
					</Button>
					<Button
						size="sm"
						variant="outline"
						onClick={() => setLinkDialogOpen(true)}
					>
						Link
					</Button>
					<Button
						size="sm"
						variant="outline"
						onClick={() => setImportDialogOpen(true)}
						title="Import learning material"
					>
						<FileText className="size-4 mr-1" />
						Import
					</Button>
				</ToolbarGroup>

				{/* History Group */}
				<ToolbarGroup>
					<Button
						size="default"
						variant="ghost"
						onClick={onUndo}
						title="Undo"
						aria-label="Undo"
					>
						<RotateCcw className="size-4" />
						<span className="ml-1">Undo</span>
					</Button>
					<Button
						size="default"
						variant="ghost"
						onClick={onRedo}
						title="Redo"
						aria-label="Redo"
					>
						<RotateCw className="size-4" />
						<span className="ml-1">Redo</span>
					</Button>
				</ToolbarGroup>

				{/* Zoom Group */}
				<ToolbarGroup>
					<ToolbarLabel>Zoom</ToolbarLabel>
					<Button
						size="default"
						variant="ghost"
						onClick={onZoomIn}
						title="Zoom in"
						aria-label="Zoom in"
					>
						<ZoomIn className="size-4" />
					</Button>
					<Button
						size="default"
						variant="ghost"
						onClick={onZoomOut}
						title="Zoom out"
						aria-label="Zoom out"
					>
						<ZoomOut className="size-4" />
					</Button>
					<Button
						size="default"
						variant="ghost"
						onClick={onFit}
						title="Fit to screen"
						aria-label="Fit to screen"
					>
						<Maximize2 className="size-4" />
					</Button>
				</ToolbarGroup>

				{/* Map Tools Group */}
				<ToolbarGroup>
					<ToolbarLabel>Map</ToolbarLabel>
					<Button
						size="default"
						variant="ghost"
						onClick={onCenterMap}
						title="Center map"
						aria-label="Center map"
					>
						<Grid3X3 className="size-4" />
					</Button>
					<Button
						size="default"
						variant="ghost"
						onClick={() => setSearchOpen(true)}
						title="Search nodes"
						aria-label="Search nodes"
					>
						<Search className="size-4" />
					</Button>
					<Button
						size="default"
						variant={directionEnabled ? "secondary" : "ghost"}
						onClick={onToggleDirection}
						title={
							directionEnabled
								? "Disable edge direction"
								: "Enable edge direction"
						}
						aria-label={
							directionEnabled
								? "Disable edge direction"
								: "Enable edge direction"
						}
						aria-pressed={directionEnabled}
					>
						<ArrowRight className="size-4" />
					</Button>
					<Button
						size="default"
						variant="ghost"
						onClick={onAutoLayout}
						title="Auto-layout nodes"
						aria-label="Auto-layout nodes"
					>
						<Shuffle className="size-4" />
					</Button>
					<ToolbarSeparator />
					<Button
						size="default"
						variant="ghost"
						onClick={onDelete}
						title="Delete selected"
						aria-label="Delete selected"
						className="text-destructive hover:text-destructive"
					>
						<Trash2 className="size-4" />
					</Button>
				</ToolbarGroup>
			</div>
			<div className="flex items-center justify-end gap-2">
				<Button
					variant="default"
					onClick={() => setSaveOpen(true)}
					disabled={saving}
					className="bg-blue-600 hover:bg-blue-700"
				>
					{saving ? (
						<Loader2 className="mr-1.5 size-4 animate-spin" />
					) : (
						<Save className="mr-1.5 size-4" />
					)}
					Save
				</Button>

				<Button
					variant="default"
					onClick={() => setSaveAsOpen(true)}
					disabled={saving}
					className="bg-blue-600 hover:bg-blue-700"
				>
					<Save className="mr-1.5 size-4" />
					Save as...
				</Button>

				<Button
					variant="default"
					onClick={onCreateKit}
					className="bg-teal-600 hover:bg-teal-700"
				>
					<Plus className="mr-1.5 size-4" />
					Create Kit
				</Button>
			</div>
		</div>
	);
}

export const EditorToolbar = memo(EditorToolbarImpl);
