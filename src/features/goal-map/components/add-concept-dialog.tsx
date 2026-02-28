import { memo, useEffect, useId, useState } from "react";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	DEFAULT_COLOR,
	TAILWIND_COLORS,
	type TailwindColor,
} from "@/features/kitbuild/components/color-picker";
import { cn } from "@/lib/utils";

export type AddConceptDialogProps = {
	open: boolean;
	defaultColor?: TailwindColor;
	/** When true, dialog is in edit mode with pre-filled values */
	editMode?: boolean;
	/** Initial label for edit mode */
	initialLabel?: string;
	/** Initial color for edit mode */
	initialColor?: TailwindColor;
	onCancel: () => void;
	onConfirm: (data: { label: string; color: TailwindColor }) => void;
};

function AddConceptDialogImpl({
	open,
	defaultColor = DEFAULT_COLOR,
	editMode = false,
	initialLabel = "",
	initialColor,
	onCancel,
	onConfirm,
}: AddConceptDialogProps) {
	const [label, setLabel] = useState("");
	const [color, setColor] = useState<TailwindColor>(defaultColor);
	const labelId = useId();

	useEffect(() => {
		if (open) {
			if (editMode) {
				setLabel(initialLabel);
				setColor(initialColor ?? defaultColor);
			} else {
				setLabel("");
				setColor(defaultColor);
			}
		}
	}, [open, defaultColor, editMode, initialLabel, initialColor]);

	const handleSubmit = () => {
		const trimmed = label.trim();
		if (!trimmed) return;
		onConfirm({ label: trimmed, color });
	};

	return (
		<Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>{editMode ? "Edit Concept" : "Add Concept"}</DialogTitle>
					<DialogDescription>
						{editMode
							? "Update the label and color for this concept node."
							: "Enter a label for the concept node and choose a color."}
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4 py-2">
					<div className="space-y-2">
						<Label htmlFor={labelId}>Label</Label>
						<Input
							id={labelId}
							value={label}
							onChange={(e) => setLabel(e.target.value)}
							placeholder="Enter concept label..."
							onKeyDown={(e) => {
								if (e.key === "Enter") {
									e.preventDefault();
									handleSubmit();
								}
							}}
						/>
					</div>

					<div className="space-y-2">
						<Label>Color</Label>
						<div className="grid grid-cols-8 gap-1.5">
							{TAILWIND_COLORS.map((c) => (
								<button
									key={c.value}
									type="button"
									onClick={() => setColor(c)}
									className={cn(
										"size-7 rounded-md transition-all hover:scale-110",
										c.bg,
										color.value === c.value &&
											"ring-2 ring-offset-2 ring-gray-900",
									)}
									title={c.name}
								/>
							))}
						</div>
					</div>

					<div className="space-y-2">
						<Label>Preview</Label>
						<div
							className={cn(
								"inline-block min-w-28 rounded-md px-3 py-2 shadow-sm ring-2 bg-background",
								color.ring,
								color.text,
							)}
						>
							<div className="text-sm font-medium leading-tight">
								{label || "Concept"}
							</div>
						</div>
					</div>
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={onCancel}>
						Cancel
					</Button>
					<Button onClick={handleSubmit} disabled={!label.trim()}>
						{editMode ? "Save Changes" : "Add Concept"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

export const AddConceptDialog = memo(AddConceptDialogImpl);
