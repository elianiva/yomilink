import {
	Loader2,
	Maximize2,
	RotateCcw,
	RotateCw,
	Trash2,
	ZoomIn,
	ZoomOut,
} from "lucide-react";
import { memo } from "react";
import { Button } from "@/components/ui/button";

export type EditorToolbarProps = {
	onUndo: () => void;
	onRedo: () => void;
	onZoomIn: () => void;
	onZoomOut: () => void;
	onFit: () => void;
	onDelete: () => void;
	onSaveClick: () => void;
	onExport: () => void;
	saving: boolean;
	isDirty: boolean;
};

function EditorToolbar({
	onUndo,
	onRedo,
	onZoomIn,
	onZoomOut,
	onFit,
	onDelete,
	onSaveClick,
	onExport,
	saving,
	isDirty,
}: EditorToolbarProps) {
	return (
		<div className="flex items-center gap-2">
			<div className="inline-flex items-center gap-1 rounded-md border p-1">
				<Button size="default" variant="ghost" onClick={onUndo} title="Undo">
					<RotateCcw className="size-4" />
				</Button>
				<Button size="default" variant="ghost" onClick={onRedo} title="Redo">
					<RotateCw className="size-4" />
				</Button>
				<div className="mx-1 h-5 w-px bg-border" />
				<Button
					size="default"
					variant="ghost"
					onClick={onZoomOut}
					title="Zoom out"
				>
					<ZoomOut className="size-4" />
				</Button>
				<Button
					size="default"
					variant="ghost"
					onClick={onZoomIn}
					title="Zoom in"
				>
					<ZoomIn className="size-4" />
				</Button>
				<Button size="default" variant="ghost" onClick={onFit} title="Fit view">
					<Maximize2 className="size-4" />
				</Button>
				<div className="mx-1 h-5 w-px bg-border" />
				<Button
					size="default"
					variant="ghost"
					onClick={onDelete}
					title="Delete selected"
				>
					<Trash2 className="size-4" />
				</Button>
			</div>

			<Button
				variant="outline"
				onClick={onSaveClick}
				disabled={!isDirty || saving}
				title={isDirty ? "Save changes" : "No changes to save"}
			>
				{saving ? <Loader2 className="mr-1 size-4 animate-spin" /> : null}
				Save
			</Button>

			<Button onClick={onExport}>Export Kit</Button>
		</div>
	);
}

export default memo(EditorToolbar);
