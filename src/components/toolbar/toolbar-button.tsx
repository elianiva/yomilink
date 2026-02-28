import type { LucideIcon } from "lucide-react";
import type * as React from "react";

import { Button } from "@/components/ui/button";
import { TooltipTrigger, type TooltipTriggerProps } from "@/components/ui/tooltip";

export interface ToolbarButtonProps {
	icon?: LucideIcon;
	label?: string;
	onClick?: () => void;
	disabled?: boolean;
	variant?: React.ComponentProps<typeof Button>["variant"];
	ariaLabel?: string;
	handle: TooltipTriggerProps["handle"];
	children?: React.ReactNode;
}

export function ToolbarButton({
	icon: Icon,
	label,
	onClick,
	disabled,
	variant = "ghost",
	ariaLabel,
	handle,
	children,
}: ToolbarButtonProps) {
	return (
		<TooltipTrigger
			handle={handle}
			render={
				<Button
					variant={variant}
					size="icon"
					className="size-8"
					onClick={onClick}
					disabled={disabled}
					aria-label={ariaLabel}
				/>
			}
			payload={label}
		>
			{Icon ? <Icon className="size-4" /> : children}
		</TooltipTrigger>
	);
}
