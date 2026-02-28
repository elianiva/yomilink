import {
	Maximize2Icon,
	MinusIcon,
	PlusIcon,
	Redo2Icon,
	SearchIcon,
	ShuffleIcon,
	Undo2Icon,
} from "lucide-react";

import type { TooltipTriggerProps } from "@/components/ui/tooltip";

import { ToolbarButton } from "./toolbar-button";

interface NavigationButtonsProps {
	onUndo: () => void;
	onRedo: () => void;
	canUndo: boolean;
	canRedo: boolean;
	disabled?: boolean;
	handle: TooltipTriggerProps["handle"];
}

export function NavigationButtons({
	onUndo,
	onRedo,
	canUndo,
	canRedo,
	disabled,
	handle,
}: NavigationButtonsProps) {
	return (
		<>
			<ToolbarButton
				icon={Undo2Icon}
				label="Undo"
				onClick={onUndo}
				disabled={!canUndo || disabled}
				handle={handle}
			/>
			<ToolbarButton
				icon={Redo2Icon}
				label="Redo"
				onClick={onRedo}
				disabled={!canRedo || disabled}
				handle={handle}
			/>
		</>
	);
}

interface ZoomButtonsProps {
	onZoomIn: () => void;
	onZoomOut: () => void;
	onFit: () => void;
	handle: TooltipTriggerProps["handle"];
}

export function ZoomButtons({ onZoomIn, onZoomOut, onFit, handle }: ZoomButtonsProps) {
	return (
		<>
			<ToolbarButton icon={PlusIcon} label="Zoom In" onClick={onZoomIn} handle={handle} />
			<ToolbarButton icon={MinusIcon} label="Zoom Out" onClick={onZoomOut} handle={handle} />
			<ToolbarButton
				icon={Maximize2Icon}
				label="Fit to View"
				onClick={onFit}
				handle={handle}
			/>
		</>
	);
}

interface SearchLayoutButtonsProps {
	onSearch: () => void;
	onAutoLayout: () => void;
	layoutDisabled?: boolean;
	handle: TooltipTriggerProps["handle"];
}

export function SearchLayoutButtons({
	onSearch,
	onAutoLayout,
	layoutDisabled,
	handle,
}: SearchLayoutButtonsProps) {
	return (
		<>
			<ToolbarButton
				icon={SearchIcon}
				label="Search Nodes"
				onClick={onSearch}
				handle={handle}
			/>
			<ToolbarButton
				icon={ShuffleIcon}
				label="Auto Layout"
				onClick={onAutoLayout}
				disabled={layoutDisabled}
				handle={handle}
			/>
		</>
	);
}
