import {
	BookOpenIcon,
	LayoutGridIcon,
	SearchIcon,
	SendIcon,
} from "lucide-react";
import {
	NavigationButtons,
	ZoomButtons,
} from "@/components/toolbar/toolbar-groups";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
	createTooltipHandle,
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

const tooltipHandle = createTooltipHandle();

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
		<TooltipProvider delay={300}>
			<div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-xl border bg-white/90 p-1.5 shadow-lg backdrop-blur-sm">
				<NavigationButtons
					onUndo={onUndo}
					onRedo={onRedo}
					canUndo={canUndo}
					canRedo={canRedo}
					disabled={isSubmitted}
					handle={tooltipHandle}
				/>

				<Separator orientation="vertical" className="h-5 mx-0.5" />

				<ZoomButtons
					onZoomIn={onZoomIn}
					onZoomOut={onZoomOut}
					onFit={onFit}
					handle={tooltipHandle}
				/>

				<Separator orientation="vertical" className="h-5 mx-0.5" />

				<TooltipTrigger
					handle={tooltipHandle}
					render={
						<Button
							variant="ghost"
							size="icon"
							className="size-8"
							onClick={onSearch}
						/>
					}
					payload="Search Nodes"
				>
					<SearchIcon className="size-4" />
				</TooltipTrigger>
				<TooltipTrigger
					handle={tooltipHandle}
					render={
						<Button
							variant="ghost"
							size="icon"
							className="size-8"
							onClick={onAutoLayout}
							disabled={isSubmitted}
						/>
					}
					payload="Auto Layout"
				>
					<LayoutGridIcon className="size-4" />
				</TooltipTrigger>
				{hasMaterial && (
					<TooltipTrigger
						handle={tooltipHandle}
						render={
							<Button
								variant="ghost"
								size="icon"
								className="size-8"
								onClick={onMaterial}
							/>
						}
						payload="View Reading Material"
					>
						<BookOpenIcon className="size-4" />
					</TooltipTrigger>
				)}

				<Separator orientation="vertical" className="h-5 mx-0.5" />

				<TooltipTrigger
					handle={tooltipHandle}
					render={
						<Button
							size="sm"
							className="gap-1.5"
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
					}
					payload={
						isSubmitted
							? "Already submitted"
							: "Submit your concept map for grading"
					}
				/>
				<TooltipContent handle={tooltipHandle} />
			</div>
		</TooltipProvider>
	);
}
