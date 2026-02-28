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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export type SaveMeta = { topicId: string; name: string; description?: string };

export type Topic = {
	id: string;
	title: string;
	description?: string | null;
};

export type SaveDialogProps = {
	open: boolean;
	saving?: boolean;
	topics: readonly Topic[];
	topicsLoading?: boolean;
	defaultTopicId?: string;
	defaultName?: string;
	defaultDescription?: string;
	onCancel: () => void;
	onConfirm: (meta: SaveMeta) => void | Promise<void>;
};

function SaveDialogImpl({
	open,
	saving = false,
	topics,
	topicsLoading = false,
	defaultTopicId = "",
	defaultName = "",
	defaultDescription = "",
	onCancel,
	onConfirm,
}: SaveDialogProps) {
	const [topicId, setTopicId] = useState(defaultTopicId);
	const [name, setName] = useState(defaultName);
	const [description, setDescription] = useState(defaultDescription);

	// Reset when opened
	useEffect(() => {
		if (open) {
			setTopicId(defaultTopicId);
			setName(defaultName);
			setDescription(defaultDescription);
		}
	}, [open, defaultTopicId, defaultName, defaultDescription]);

	const topicFieldId = useId();
	const nameId = useId();
	const descriptionId = useId();

	const handleSubmit = async () => {
		const n = name.trim();
		if (!topicId || !n) return;
		const desc = description.trim() || undefined;
		await onConfirm({ topicId, name: n, description: desc });
	};

	return (
		<Dialog open={open} onOpenChange={(v) => !v && onCancel()}>
			<DialogContent className="sm:max-w-md" showCloseButton={false}>
				<DialogHeader>
					<DialogTitle>Save As...</DialogTitle>
				</DialogHeader>

				<div className="space-y-3">
					<div className="space-y-1.5">
						<Label htmlFor={topicFieldId}>Topic</Label>
						<Select value={topicId} onValueChange={setTopicId}>
							<SelectTrigger id={topicFieldId} className="w-full">
								<SelectValue
									placeholder={
										topicsLoading ? "Loading topics..." : "Select a topic"
									}
								/>
							</SelectTrigger>
							<SelectContent>
								{topics.map((t) => (
									<SelectItem key={t.id} value={t.id}>
										{t.title}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
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
					<div className="space-y-1.5">
						<Label htmlFor={descriptionId}>Description</Label>
						<Textarea
							id={descriptionId}
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="Enter a description for this goal map (optional)"
							rows={3}
						/>
					</div>
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={onCancel} disabled={saving}>
						Cancel
					</Button>
					<Button
						onClick={handleSubmit}
						disabled={saving || !topicId || !name.trim()}
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
