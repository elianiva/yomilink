import { memo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type TailwindColor = {
	name: string;
	value: string;
	bg: string;
	ring: string;
	text: string;
};

export const TAILWIND_COLORS: TailwindColor[] = [
	{
		name: "red",
		value: "red-500",
		bg: "bg-red-500",
		ring: "ring-red-500",
		text: "text-red-800",
	},
	{
		name: "orange",
		value: "orange-500",
		bg: "bg-orange-500",
		ring: "ring-orange-500",
		text: "text-orange-800",
	},
	{
		name: "amber",
		value: "amber-500",
		bg: "bg-amber-500",
		ring: "ring-amber-500",
		text: "text-amber-800",
	},
	{
		name: "yellow",
		value: "yellow-500",
		bg: "bg-yellow-500",
		ring: "ring-yellow-500",
		text: "text-yellow-800",
	},
	{
		name: "lime",
		value: "lime-500",
		bg: "bg-lime-500",
		ring: "ring-lime-500",
		text: "text-lime-800",
	},
	{
		name: "green",
		value: "green-500",
		bg: "bg-green-500",
		ring: "ring-green-500",
		text: "text-green-800",
	},
	{
		name: "emerald",
		value: "emerald-500",
		bg: "bg-emerald-500",
		ring: "ring-emerald-500",
		text: "text-emerald-800",
	},
	{
		name: "teal",
		value: "teal-500",
		bg: "bg-teal-500",
		ring: "ring-teal-500",
		text: "text-teal-800",
	},
	{
		name: "cyan",
		value: "cyan-500",
		bg: "bg-cyan-500",
		ring: "ring-cyan-500",
		text: "text-cyan-800",
	},
	{
		name: "sky",
		value: "sky-500",
		bg: "bg-sky-500",
		ring: "ring-sky-500",
		text: "text-sky-800",
	},
	{
		name: "blue",
		value: "blue-500",
		bg: "bg-blue-500",
		ring: "ring-blue-500",
		text: "text-blue-800",
	},
	{
		name: "indigo",
		value: "indigo-500",
		bg: "bg-indigo-500",
		ring: "ring-indigo-500",
		text: "text-indigo-800",
	},
	{
		name: "violet",
		value: "violet-500",
		bg: "bg-violet-500",
		ring: "ring-violet-500",
		text: "text-violet-800",
	},
	{
		name: "purple",
		value: "purple-500",
		bg: "bg-purple-500",
		ring: "ring-purple-500",
		text: "text-purple-800",
	},
	{
		name: "fuchsia",
		value: "fuchsia-500",
		bg: "bg-fuchsia-500",
		ring: "ring-fuchsia-500",
		text: "text-fuchsia-800",
	},
	{
		name: "pink",
		value: "pink-500",
		bg: "bg-pink-500",
		ring: "ring-pink-500",
		text: "text-pink-800",
	},
];

export const DEFAULT_COLOR: TailwindColor = TAILWIND_COLORS.find((c) => c.name === "amber") ?? {
	name: "amber",
	value: "amber-500",
	bg: "bg-amber-500",
	ring: "ring-amber-500",
	text: "text-amber-800",
};

export function getColorByValue(value: string): TailwindColor {
	return TAILWIND_COLORS.find((c) => c.value === value) ?? DEFAULT_COLOR;
}

export type ColorPickerProps = {
	value: TailwindColor;
	onChange: (color: TailwindColor) => void;
};

function ColorPickerImpl({ value, onChange }: ColorPickerProps) {
	const [open, setOpen] = useState(false);

	return (
		<DropdownMenu open={open} onOpenChange={setOpen}>
			<DropdownMenuTrigger asChild>
				<Button
					variant="outline"
					size="icon"
					title={`Selected color: ${value.name}`}
					className="size-8"
				>
					<div className={cn("size-5 rounded-sm", value.bg)} />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent className="w-auto p-2" align="start">
				<div className="grid grid-cols-4 gap-1.5">
					{TAILWIND_COLORS.map((color) => (
						<button
							key={color.value}
							type="button"
							onClick={() => {
								onChange(color);
								setOpen(false);
							}}
							className={cn(
								"size-7 rounded-md transition-all hover:scale-110",
								color.bg,
								value.value === color.value && "ring-2 ring-offset-2 ring-gray-900",
							)}
							title={color.name}
						/>
					))}
				</div>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

export const ColorPicker = memo(ColorPickerImpl);
