import { useSetAtom } from "jotai";
import {
	BookOpen,
	Grid3X3,
	Loader2,
	Plus,
	Save,
	Search,
	Shuffle,
	Trash2,
	FileX2,
} from "lucide-react";
import { memo, useState } from "react";

import { ToolbarButton } from "@/components/toolbar/toolbar-button";
import { NavigationButtons, ZoomButtons } from "@/components/toolbar/toolbar-groups";
import { Button } from "@/components/ui/button";
import { ButtonGroup, ButtonGroupSeparator } from "@/components/ui/button-group";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
	createTooltipHandle,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { useRpcMutation } from "@/hooks/use-rpc-query";
import { GoalMapRpc } from "@/server/rpc/goal-map";

import { useSaveDialog } from "../hooks/use-save-dialog";
import {
	conceptDialogOpenAtom,
	materialDialogOpenAtom,
	linkDialogOpenAtom,
	searchOpenAtom,
} from "../lib/atoms";

export type EditorToolbarProps = {
	onUndo: () => void;
	onRedo: () => void;
	onZoomIn: () => void;
	onZoomOut: () => void;
	onFit: () => void;
	onCenterMap: () => void;
	onAutoLayout: () => void;
	onDelete: () => void;
	onSave: () => void;
	saving: boolean;
	isNewMap: boolean;
	goalMapId?: string;
	onDeleted?: () => void;
};

const tooltipHandle = createTooltipHandle();

function EditorToolbarImpl({
	onUndo,
	onRedo,
	onZoomIn,
	onZoomOut,
	onFit,
	onCenterMap,
	onAutoLayout,
	onDelete,
	onSave,
	saving,
	isNewMap,
	goalMapId,
	onDeleted,
}: EditorToolbarProps) {
	const setConceptDialogOpen = useSetAtom(conceptDialogOpenAtom);
	const setLinkDialogOpen = useSetAtom(linkDialogOpenAtom);
	const setMaterialDialogOpen = useSetAtom(materialDialogOpenAtom);
	const setSearchOpen = useSetAtom(searchOpenAtom);
	const { setSaveOpen, setSaveAsOpen } = useSaveDialog();
	const [deleteOpen, setDeleteOpen] = useState(false);

	const deleteGoalMapMutation = useRpcMutation(GoalMapRpc.deleteGoalMap(), {
		operation: "delete goal map",
		showSuccess: true,
		successMessage: "Goal map deleted",
		onSuccess: () => onDeleted?.(),
	});

	const handleSave = () => {
		if (isNewMap) {
			setSaveOpen(true);
		} else {
			onSave();
		}
	};

	return (
		<TooltipProvider delay={300}>
			<div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1 rounded-xl border bg-white/90 p-1.5 shadow-lg backdrop-blur-sm h-12">
				<ButtonGroup className="mr-1">
					<TooltipTrigger
						handle={tooltipHandle}
						render={
							<Button
								size="sm"
								variant="outline"
								onClick={() => setConceptDialogOpen(true)}
							>
								<Plus className="size-4" />
								Concept
							</Button>
						}
						payload="Add concept node"
					/>
					<ButtonGroupSeparator />
					<TooltipTrigger
						handle={tooltipHandle}
						render={
							<Button
								size="sm"
								variant="outline"
								onClick={() => setLinkDialogOpen(true)}
							>
								<Plus className="size-4" />
								Link
							</Button>
						}
						payload="Add link node"
					/>
					<ButtonGroupSeparator />
					<TooltipTrigger
						handle={tooltipHandle}
						render={
							<Button
								size="sm"
								variant="outline"
								onClick={() => setMaterialDialogOpen(true)}
							>
								<BookOpen className="size-4" />
								Material
							</Button>
						}
						payload="Add learning material"
					/>
				</ButtonGroup>

				<Separator orientation="vertical" className="h-5! mx-1" />

				<NavigationButtons
					onUndo={onUndo}
					onRedo={onRedo}
					canUndo={true}
					canRedo={true}
					handle={tooltipHandle}
					disabled={false}
				/>

				<Separator orientation="vertical" className="h-5! mx-1" />

				<ZoomButtons
					onZoomIn={onZoomIn}
					onZoomOut={onZoomOut}
					onFit={onFit}
					handle={tooltipHandle}
				/>

				<Separator orientation="vertical" className="h-5! mx-1" />

				<ToolbarButton
					icon={Grid3X3}
					label="Center map"
					onClick={onCenterMap}
					handle={tooltipHandle}
				/>
				<ToolbarButton
					icon={Search}
					label="Search nodes"
					onClick={() => setSearchOpen(true)}
					handle={tooltipHandle}
				/>
				<ToolbarButton
					icon={Shuffle}
					label="Auto-layout nodes"
					onClick={onAutoLayout}
					handle={tooltipHandle}
				/>

				<Separator orientation="vertical" className="h-5! mx-1" />

				<TooltipTrigger
					handle={tooltipHandle}
					render={
						<Button
							variant="ghost"
							size="icon"
							className="size-8 text-destructive hover:text-destructive hover:bg-destructive/10"
							onClick={onDelete}
						/>
					}
					payload="Delete selected"
				>
					<Trash2 className="size-4" />
				</TooltipTrigger>

				{!isNewMap && goalMapId && (
					<>
						<Separator orientation="vertical" className="h-5! mx-1" />
						<TooltipTrigger
							handle={tooltipHandle}
							render={
								<Button
									variant="ghost"
									size="icon"
									className="size-8 text-destructive hover:text-destructive hover:bg-destructive/10"
									onClick={() => setDeleteOpen(true)}
								/>
							}
							payload="Delete entire goal map"
						>
							<FileX2 className="size-4" />
						</TooltipTrigger>
					</>
				)}

				<Separator orientation="vertical" className="h-5! mx-1" />

				<ButtonGroup className="ml-1">
					<Button size="sm" variant="default" onClick={handleSave} disabled={saving}>
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
				</ButtonGroup>
				<TooltipContent handle={tooltipHandle} />
			</div>

			<Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Delete Goal Map</DialogTitle>
						<DialogDescription>
							Are you sure you want to delete this goal map? This action cannot be
							undone.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="outline" onClick={() => setDeleteOpen(false)}>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={() => {
								if (goalMapId) deleteGoalMapMutation.mutate({ goalMapId });
							}}
							disabled={deleteGoalMapMutation.isPending}
						>
							{deleteGoalMapMutation.isPending && (
								<Loader2 className="mr-2 size-4 animate-spin" />
							)}
							Delete
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</TooltipProvider>
	);
}

export const EditorToolbar = memo(EditorToolbarImpl);
