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

const LINK_PRESETS = [
	"is",
	"has",
	"causes",
	"belongs to",
	"contains",
	"leads to",
	"requires",
	"produces",
];

export type AddLinkDialogProps = {
	open: boolean;
	/** When true, dialog is in edit mode with pre-filled values */
	editMode?: boolean;
	/** Initial label for edit mode */
	initialLabel?: string;
	onCancel: () => void;
	onConfirm: (data: { label: string }) => void;
};

function AddLinkDialogImpl({
	open,
	editMode = false,
	initialLabel = "",
	onCancel,
	onConfirm,
}: AddLinkDialogProps) {
	const [label, setLabel] = useState("");
	const labelId = useId();

	useEffect(() => {
		if (open) {
			if (editMode) {
				setLabel(initialLabel);
			} else {
				setLabel("");
			}
		}
	}, [open, editMode, initialLabel]);

	const handleSubmit = () => {
		const trimmed = label.trim();
		if (!trimmed) return;
		onConfirm({ label: trimmed });
	};

	return (
		<Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>{editMode ? "Edit Link" : "Add Link"}</DialogTitle>
					<DialogDescription>
						{editMode
							? "Update the label for this link node."
							: "Enter a label for the link/connector node or choose a preset."}
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4 py-2">
					<div className="space-y-2">
						<Label htmlFor={labelId}>Label</Label>
						<Input
							id={labelId}
							value={label}
							onChange={(e) => setLabel(e.target.value)}
							placeholder='e.g. "is", "causes", "belongs to"'
							autoFocus
							onKeyDown={(e) => {
								if (e.key === "Enter") {
									e.preventDefault();
									handleSubmit();
								}
							}}
						/>
					</div>

					<div className="space-y-2">
						<Label>Presets</Label>
						<div className="flex flex-wrap gap-2">
							{LINK_PRESETS.map((preset) => (
								<button
									key={preset}
									type="button"
									onClick={() => setLabel(preset)}
									className="rounded-full bg-sky-100 px-3 py-1 text-sm text-sky-900 ring-1 ring-sky-200 hover:bg-sky-200 transition-colors"
								>
									{preset}
								</button>
							))}
						</div>
					</div>

					<div className="space-y-2">
						<Label>Preview</Label>
						<div className="inline-block min-w-24 rounded-md bg-background px-3 py-1.5 shadow-sm ring-2 ring-sky-500 text-sky-800">
							<div className="text-sm font-medium leading-tight">
								{label || "link"}
							</div>
						</div>
					</div>
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={onCancel}>
						Cancel
					</Button>
					<Button onClick={handleSubmit} disabled={!label.trim()}>
						{editMode ? "Save Changes" : "Add Link"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

export const AddLinkDialog = memo(AddLinkDialogImpl);
