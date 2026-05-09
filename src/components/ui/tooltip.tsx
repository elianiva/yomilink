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
				d="M9.66 2.6L4.81 6.97C4.07 7.63 3.12 8 2.13 8H0V10H20V8H18.53C17.55 8 16.59 7.63 15.86 6.97L11 2.6C10.62 2.26 10.04 2.26 9.66 2.6Z"
				className="fill-popover"
			/>
			<path
				d="M9 1.86C9.76 1.17 10.91 1.17 11.67 1.86L16.53 6.23C17.08 6.73 17.79 7 18.53 7L15.89 7L11 2.6C10.62 2.26 10.04 2.26 9.66 2.6L4.78 7L2.13 7C2.87 7 3.59 6.73 4.14 6.23L9 1.86Z"
				className="fill-border dark:fill-none"
			/>
			<path
				d="M10.33 3.35L5.48 7.72C4.56 8.54 3.37 9 2.13 9H0V8H2.13C3.12 8 4.07 7.63 4.81 6.97L9.66 2.6C10.04 2.26 10.62 2.26 11 2.6L15.86 6.97C16.59 7.63 17.55 8 18.53 8H20V9H18.53C17.3 9 16.11 8.54 15.19 7.72L10.33 3.35Z"
				className="dark:fill-muted-foreground"
			/>
		</svg>
	);
}

const TooltipProvider = BaseTooltip.Provider;
const createTooltipHandle = BaseTooltip.createHandle;

const Tooltip = BaseTooltip.Root;

const TooltipTrigger = React.forwardRef<
	HTMLButtonElement,
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
