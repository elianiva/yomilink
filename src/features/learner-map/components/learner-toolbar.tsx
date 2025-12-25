import {
	BookOpenIcon,
	Maximize2Icon,
	MinusIcon,
	PlusIcon,
	Redo2Icon,
	SearchIcon,
	SendIcon,
	Undo2Icon,
	LayoutGridIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";

interface LearnerToolbarProps {
	onUndo: () => void;
	onRedo: () => void;
	onZoomIn: () => void;
	onZoomOut: () => void;
	onFit: () => void;
	onSearch: () => void;
	onMaterial: () => void;
	onAutoLayout: () => void;
	onSubmit: () => void;
	canUndo: boolean;
	canRedo: boolean;
	isSubmitting?: boolean;
	isSubmitted?: boolean;
	hasMaterial?: boolean;
}

export function LearnerToolbar({
	onUndo,
	onRedo,
	onZoomIn,
	onZoomOut,
	onFit,
	onSearch,
	onMaterial,
	onAutoLayout,
	onSubmit,
	canUndo,
	canRedo,
	isSubmitting,
	isSubmitted,
	hasMaterial,
}: LearnerToolbarProps) {
	return (
		<TooltipProvider delayDuration={300}>
			<div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-xl border bg-white/90 p-1.5 shadow-lg backdrop-blur-sm">
				{/* Undo/Redo */}
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							variant="ghost"
							size="icon"
							className="size-8"
									data-tour-step="reading-material"
												data-tour-step="undo-redo"
							onClick={onUndo}
							disabled={!canUndo || isSubmitted}
							data-tour-step="undo-redo"
						>
							<Undo2Icon className="size-4" />
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
									data-tour-step="reading-material"
												data-tour-step="undo-redo"
							onClick={onRedo}
							disabled={!canRedo || isSubmitted}
						>
							<Redo2Icon className="size-4" />
						</Button>
					</TooltipTrigger>
					<TooltipContent side="top" sideOffset={8}>
						Redo
					</TooltipContent>
				</Tooltip>

				<Separator orientation="vertical" className="h-5 mx-0.5" />

				{/* Zoom */}
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							variant="ghost"
							size="icon"
							className="size-8"
									data-tour-step="reading-material"
												data-tour-step="undo-redo"
							onClick={onZoomIn}
						>
							<PlusIcon className="size-4" />
						</Button>
					</TooltipTrigger>
					<TooltipContent side="top" sideOffset={8}>
						Zoom In
					</TooltipContent>
				</Tooltip>

				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							variant="ghost"
							size="icon"
							className="size-8"
									data-tour-step="reading-material"
												data-tour-step="undo-redo"
							onClick={onZoomOut}
						>
							<MinusIcon className="size-4" />
						</Button>
					</TooltipTrigger>
					<TooltipContent side="top" sideOffset={8}>
						Zoom Out
					</TooltipContent>
				</Tooltip>

				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							variant="ghost"
							size="icon"
							className="size-8"
									data-tour-step="reading-material"
												data-tour-step="undo-redo"
							onClick={onFit}
						>
							<Maximize2Icon className="size-4" />
						</Button>
					</TooltipTrigger>
					<TooltipContent side="top" sideOffset={8}>
						Fit to View
					</TooltipContent>
				</Tooltip>

				<Separator orientation="vertical" className="h-5 mx-0.5" />

				{/* Tools */}
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							variant="ghost"
							size="icon"
							className="size-8"
									data-tour-step="reading-material"
												data-tour-step="undo-redo"
							onClick={onSearch}
						>
							<SearchIcon className="size-4" />
						</Button>
					</TooltipTrigger>
					<TooltipContent side="top" sideOffset={8}>
						Search Nodes
					</TooltipContent>
				</Tooltip>

				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							variant="ghost"
							size="icon"
							className="size-8"
									data-tour-step="reading-material"
												data-tour-step="undo-redo"
							onClick={onAutoLayout}
							disabled={isSubmitted}
						>
							<LayoutGridIcon className="size-4" />
						</Button>
					</TooltipTrigger>
					<TooltipContent side="top" sideOffset={8}>
						Auto Layout
					</TooltipContent>
				</Tooltip>

				{hasMaterial && (
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								variant="ghost"
								size="icon"
								className="size-8"
									data-tour-step="reading-material"
												data-tour-step="undo-redo"
								onClick={onMaterial}
							>
								<BookOpenIcon className="size-4" />
							</Button>
						</TooltipTrigger>
						<TooltipContent side="top" sideOffset={8}>
							View Reading Material
						</TooltipContent>
					</Tooltip>
				)}

				<Separator orientation="vertical" className="h-5 mx-0.5" />

				{/* Submit */}
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							size="sm"
							className="gap-1.5"
									data-tour-step="submit-btn"
							onClick={onSubmit}
							disabled={isSubmitting || isSubmitted}
						>
							<SendIcon className="size-4" />
							{isSubmitting
								? "Submitting..."
								: isSubmitted
									? "Submitted"
									: "Submit"}
						</Button>
					</TooltipTrigger>
					<TooltipContent side="top" sideOffset={8}>
						{isSubmitted
							? "Already submitted"
							: "Submit your concept map for grading"}
					</TooltipContent>
				</Tooltip>
			</div>
		</TooltipProvider>
	);
}
