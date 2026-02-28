import { Tooltip as BaseTooltip } from "@base-ui/react/tooltip";
import * as React from "react";

import { cn } from "@/lib/utils";

export function ArrowSvg(props: React.ComponentProps<"svg">) {
	return (
		<svg
			width="20"
			height="10"
			viewBox="0 0 20 10"
			fill="none"
			role="img"
			aria-label="tooltip arrow"
			{...props}
		>
			<path
				d="M9.66437 2.60207L4.80758 6.97318C4.07308 7.63423 3.11989 8 2.13172 8H0V10H20V8H18.5349C17.5468 8 16.5936 7.63423 15.8591 6.97318L11.0023 2.60207C10.622 2.2598 10.0447 2.25979 9.66437 2.60207Z"
				className="fill-popover"
			/>
			<path
				d="M8.99542 1.85876C9.75604 1.17425 10.9106 1.17422 11.6713 1.85878L16.5281 6.22989C17.0789 6.72568 17.7938 7.00001 18.5349 7.00001L15.89 7L11.0023 2.60207C10.622 2.2598 10.0447 2.2598 9.66436 2.60207L4.77734 7L2.13171 7.00001C2.87284 7.00001 3.58774 6.72568 4.13861 6.22989L8.99542 1.85876Z"
				className="fill-border dark:fill-none"
			/>
			<path
				d="M10.3333 3.34539L5.47654 7.71648C4.55842 8.54279 3.36693 9 2.13172 9H0V8H2.13172C3.11989 8 4.07308 7.63423 4.80758 6.97318L9.66437 2.60207C10.0447 2.25979 10.622 2.2598 11.0023 2.60207L15.8591 6.97318C16.5936 7.63423 17.5468 8 18.5349 8H20V9H18.5349C17.2998 9 16.1083 8.54278 15.1901 7.71648L10.3333 3.34539Z"
				className="dark:fill-gray-300"
			/>
		</svg>
	);
}

const TooltipProvider = BaseTooltip.Provider;
const createTooltipHandle = BaseTooltip.createHandle;

const Tooltip = BaseTooltip.Root;

const TooltipTrigger = React.forwardRef<
	React.ComponentRef<typeof BaseTooltip.Trigger>,
	React.ComponentPropsWithoutRef<typeof BaseTooltip.Trigger>
>(({ className, ...props }, ref) => (
	<BaseTooltip.Trigger
		ref={ref}
		className={cn(
			"data-popup-open:bg-accent data-popup-open:text-accent-foreground",
			className,
		)}
		{...props}
	/>
));
TooltipTrigger.displayName = "TooltipTrigger";

type TooltipTriggerProps = React.ComponentPropsWithoutRef<typeof BaseTooltip.Trigger>;

const TooltipPortal = BaseTooltip.Portal;

const TooltipPositioner = React.forwardRef<
	React.ComponentRef<typeof BaseTooltip.Positioner>,
	React.ComponentPropsWithoutRef<typeof BaseTooltip.Positioner>
>(({ className, sideOffset = 0, ...props }, ref) => (
	<BaseTooltip.Positioner
		ref={ref}
		sideOffset={sideOffset}
		className={cn(
			"z-50",
			"h-(--positioner-height) w-(--positioner-width)",
			"max-w-(--available-width)",
			"transition-[top,left,right,bottom,transform] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)]",
			"data-instant:transition-none",
			className,
		)}
		{...props}
	/>
));
TooltipPositioner.displayName = "TooltipPositioner";

const TooltipPopup = React.forwardRef<
	React.ComponentRef<typeof BaseTooltip.Popup>,
	React.ComponentPropsWithoutRef<typeof BaseTooltip.Popup>
>(({ className, ...props }, ref) => (
	<BaseTooltip.Popup
		ref={ref}
		className={cn(
			"relative rounded-md border bg-popover px-1 py-0.5 text-sm font-medium text-popover-foreground shadow-md",
			"h-(--popup-height,auto) w-(--popup-width,auto)",
			"origin-(--transform-origin)",
			"transition-[width,height,opacity,scale] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)]",
			"data-ending-style:opacity-0 data-ending-style:scale-90",
			"data-starting-style:opacity-0 data-starting-style:scale-90",
			"data-instant:transition-none",
			className,
		)}
		{...props}
	/>
));
TooltipPopup.displayName = "TooltipPopup";

const TooltipArrow = React.forwardRef<
	React.ComponentRef<typeof BaseTooltip.Arrow>,
	React.ComponentPropsWithoutRef<typeof BaseTooltip.Arrow>
>(({ className, ...props }, ref) => (
	<BaseTooltip.Arrow
		ref={ref}
		className={cn(
			"flex fill-popover text-popover",
			"transition-[left,top,right,bottom] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)]",
			"data-[side=bottom]:-top-2 data-[side=bottom]:rotate-0",
			"data-[side=left]:-right-2 data-[side=left]:rotate-90",
			"data-[side=right]:-left-3 data-[side=right]:-rotate-90",
			"data-[side=top]:-bottom-2 data-[side=top]:rotate-180",
			className,
		)}
		{...props}
	>
		<ArrowSvg />
	</BaseTooltip.Arrow>
));
TooltipArrow.displayName = "TooltipArrow";

const TooltipViewport = React.forwardRef<
	React.ComponentRef<typeof BaseTooltip.Viewport>,
	React.ComponentPropsWithoutRef<typeof BaseTooltip.Viewport>
>(({ className, ...props }, ref) => (
	<BaseTooltip.Viewport
		ref={ref}
		className={cn(
			"relative h-full w-full whitespace-nowrap",
			"[--viewport-padding:0.5rem]",
			"px-(--viewport-padding) py-1",
			"**:data-previous:w-[calc(var(--popup-width)-2*var(--viewport-padding))]",
			"**:data-previous:translate-x-0",
			"**:data-previous:opacity-100",
			"**:data-previous:transition-[translate,opacity]",
			"**:data-previous:duration-[200ms,150ms]",
			"**:data-previous:ease-[cubic-bezier(0.22,1,0.36,1)]",
			"**:data-current:w-[calc(var(--popup-width)-2*var(--viewport-padding))]",
			"**:data-current:translate-x-0",
			"**:data-current:opacity-100",
			"**:data-current:transition-[translate,opacity]",
			"**:data-current:duration-[200ms,150ms]",
			"**:data-current:ease-[cubic-bezier(0.22,1,0.36,1)]",
			"data-[activation-direction~=left]:[&_[data-current][data-starting-style]]:-translate-x-1/2",
			"data-[activation-direction~=left]:[&_[data-current][data-starting-style]]:opacity-0",
			"data-[activation-direction~=right]:[&_[data-current][data-starting-style]]:translate-x-1/2",
			"data-[activation-direction~=right]:[&_[data-current][data-starting-style]]:opacity-0",
			"[[data-instant]_&_[data-previous]]:transition-none",
			"[[data-instant]_&_[data-current]]:transition-none",
			"data-[activation-direction~=left]:[&_[data-previous][data-ending-style]]:translate-x-1/2",
			"data-[activation-direction~=left]:[&_[data-previous][data-ending-style]]:opacity-0",
			"data-[activation-direction~=right]:[&_[data-previous][data-ending-style]]:-translate-x-1/2",
			"data-[activation-direction~=right]:[&_[data-previous][data-ending-style]]:opacity-0",
			className,
		)}
		{...props}
	/>
));
TooltipViewport.displayName = "TooltipViewport";

interface TooltipContentProps {
	handle: React.ComponentProps<typeof TooltipTrigger>["handle"];
	sideOffset?: number;
}

function TooltipContent({ handle, sideOffset = 4 }: TooltipContentProps) {
	return (
		<Tooltip handle={handle}>
			{({ payload }) => (
				<TooltipPortal>
					<TooltipPositioner sideOffset={sideOffset}>
						<TooltipPopup>
							<TooltipArrow />
							<TooltipViewport>{payload as React.ReactNode}</TooltipViewport>
						</TooltipPopup>
					</TooltipPositioner>
				</TooltipPortal>
			)}
		</Tooltip>
	);
}

export type { TooltipTriggerProps };
export {
	TooltipProvider,
	createTooltipHandle,
	Tooltip,
	TooltipTrigger,
	TooltipPortal,
	TooltipPositioner,
	TooltipPopup,
	TooltipArrow,
	TooltipViewport,
	TooltipContent,
};
