import { Loader2 } from "lucide-react";
import { memo, useEffect, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type SaveMeta = { topic: string; name: string };

export type SaveDialogProps = {
	open: boolean;
	saving?: boolean;
	defaultTopic?: string;
	defaultName?: string;
	onCancel: () => void;
	onConfirm: (meta: SaveMeta) => void | Promise<void>;
};

function SaveDialogImpl({
	open,
	saving = false,
	defaultTopic = "",
	defaultName = "",
	onCancel,
	onConfirm,
}: SaveDialogProps) {
	const [topic, setTopic] = useState(defaultTopic);
	const [name, setName] = useState(defaultName);

	// Reset when opened
	useEffect(() => {
		if (open) {
			setTopic(defaultTopic);
			setName(defaultName);
		}
	}, [open, defaultTopic, defaultName]);

	const topicId = useId();
	const nameId = useId();

	const handleSubmit = async () => {
		const t = topic.trim();
		const n = name.trim();
		if (!t || !n) return;
		await onConfirm({ topic: t, name: n });
	};

	return (
		<Dialog open={open} onOpenChange={(v) => !v && onCancel()}>
			<DialogContent className="sm:max-w-md" showCloseButton={false}>
				<DialogHeader>
					<DialogTitle>Save As...</DialogTitle>
				</DialogHeader>

				<div className="space-y-3">
					<div className="space-y-1.5">
						<Label htmlFor={topicId}>Topic</Label>
						<Input
							id={topicId}
							value={topic}
							onChange={(e) => setTopic(e.target.value)}
							placeholder="e.g. General, Biology"
						/>
					</div>
					<div className="space-y-1.5">
						<Label htmlFor={nameId}>Map Name</Label>
						<Input
							id={nameId}
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="Enter a name for this goal map"
						/>
					</div>
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={onCancel} disabled={saving}>
						Cancel
					</Button>
					<Button
						onClick={handleSubmit}
						disabled={saving || !topic.trim() || !name.trim()}
					>
						{saving ? <Loader2 className="mr-1 size-4 animate-spin" /> : null}
						Save
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

export const SaveDialog = memo(SaveDialogImpl);

export type WarningsPanelProps = {
	warnings: string[];
	variant?: "warning" | "error";
	onClear?: () => void;
	className?: string;
};

export function WarningsPanel({
	warnings,
	variant = "warning",
	onClear,
	className,
}: WarningsPanelProps) {
	if (!warnings?.length) return null;

	const tone =
		variant === "error"
			? {
					border: "border-red-300",
					bg: "bg-red-50",
					text: "text-red-900",
					title: "Errors",
				}
			: {
					border: "border-amber-300",
					bg: "bg-amber-50",
					text: "text-amber-900",
					title: "Validation warnings",
				};

	return (
		<div
			className={`rounded-md border ${tone.border} ${tone.bg} ${tone.text} p-3 text-sm ${className ?? ""}`}
		>
			<div className="flex items-center justify-between mb-1">
				<div className="font-medium">{tone.title}</div>
				{onClear ? (
					<button
						type="button"
						className="text-xs underline underline-offset-2"
						onClick={onClear}
						title="Clear"
					>
						Clear
					</button>
				) : null}
			</div>
			<ul className="list-disc pl-5 space-y-0.5">
				{warnings.map((w) => (
					<li key={w}>{w}</li>
				))}
			</ul>
		</div>
	);
}
