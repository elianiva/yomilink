import { useAtomValue, useSetAtom } from "jotai";
import {
	ArrowRight,
	FileText,
	Grid3X3,
	Loader2,
	Plus,
	Save,
	Search,
	Shuffle,
	Trash2,
} from "lucide-react";
import { memo } from "react";
import { ToolbarButton } from "@/components/toolbar/toolbar-button";
import {
	NavigationButtons,
	ZoomButtons,
} from "@/components/toolbar/toolbar-groups";
import { Button } from "@/components/ui/button";
import {
	ButtonGroup,
	ButtonGroupSeparator,
} from "@/components/ui/button-group";
import { Separator } from "@/components/ui/separator";
import {
	createTooltipHandle,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import {
	conceptDialogOpenAtom,
	directionEnabledAtom,
	importDialogOpenAtom,
	linkDialogOpenAtom,
	searchOpenAtom,
	saveAsOpenAtom,
	saveOpenAtom,
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

const tooltipHandle = createTooltipHandle();

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
								onClick={() => setImportDialogOpen(true)}
							>
								<FileText className="size-4" />
								Import
							</Button>
						}
						payload="Import learning material"
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
					icon={ArrowRight}
					label={
						directionEnabled
							? "Disable edge direction"
							: "Enable edge direction"
					}
					onClick={onToggleDirection}
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
					{!isNewMap && (
						<>
							<ButtonGroupSeparator />
							<TooltipTrigger
								handle={tooltipHandle}
								render={
									<Button
										size="sm"
										variant={kitStatus?.exists ? "secondary" : "default"}
										onClick={onCreateKit}
										disabled={isGeneratingKit}
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
								}
								payload={
									kitStatus ? (
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
									)
								}
							/>
						</>
					)}
				</ButtonGroup>
				<TooltipContent handle={tooltipHandle} />
			</div>
		</TooltipProvider>
	);
}

export const EditorToolbar = memo(EditorToolbarImpl);
