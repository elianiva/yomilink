import { Loader2 } from "lucide-react";
import { memo, useEffect, useId, useState } from "react";
import { Button } from "@/components/ui/button";
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

	if (!open) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center">
			<button
				type="button"
				className="absolute inset-0 bg-black/40 backdrop-blur-sm"
				onClick={onCancel}
				aria-label="Close dialog backdrop"
			/>
			<div
				role="dialog"
				aria-modal="true"
				className="relative z-10 w-full max-w-md rounded-xl border bg-background shadow-xl"
			>
				<div className="flex items-center justify-between border-b p-4">
					<h3 className="text-lg font-semibold">Save As...</h3>
					<Button variant="ghost" size="sm" onClick={onCancel}>
						Cancel
					</Button>
				</div>

				<div className="p-4 space-y-3">
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

				<div className="flex items-center justify-end gap-2 border-t p-4">
					<Button variant="outline" onClick={onCancel}>
						Cancel
					</Button>
					<Button
						onClick={async () => {
							const t = topic.trim();
							const n = name.trim();
							if (!t || !n) return;
							await onConfirm({ topic: t, name: n });
						}}
						disabled={saving || !topic.trim() || !name.trim()}
					>
						{saving ? <Loader2 className="mr-1 size-4 animate-spin" /> : null}
						Save
					</Button>
				</div>
			</div>
		</div>
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
