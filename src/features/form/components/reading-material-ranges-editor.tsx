import { BookOpen, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import type { ReadingMaterialSection } from "../lib/form-service.core";

interface ReadingMaterialRangesEditorProps {
	sections: ReadingMaterialSection[];
	onChange: (sections: ReadingMaterialSection[]) => void;
	disabled?: boolean;
}

function createSection(nextQuestionStart: number): ReadingMaterialSection {
	return {
		id: "rm_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8),
		title: undefined,
		startQuestion: nextQuestionStart,
		endQuestion: nextQuestionStart,
		content: "",
	};
}

function toPositiveInt(value: string): number {
	const parsed = Number.parseInt(value, 10);
	if (Number.isNaN(parsed)) return 1;
	return Math.max(1, parsed);
}

export function ReadingMaterialRangesEditor({
	sections,
	onChange,
	disabled = false,
}: ReadingMaterialRangesEditorProps) {
	const handleAddSection = () => {
		const nextStart =
			sections.length > 0 ? Math.max(...sections.map((s) => s.endQuestion)) + 1 : 1;
		onChange([...sections, createSection(nextStart)]);
	};

	const handleUpdate = (
		sectionId: string,
		updater: (section: ReadingMaterialSection) => ReadingMaterialSection,
	) => {
		onChange(
			sections.map((section) => (section.id === sectionId ? updater(section) : section)),
		);
	};

	const handleRemove = (sectionId: string) => {
		onChange(sections.filter((section) => section.id !== sectionId));
	};

	return (
		<div className="space-y-4" data-testid="reading-material-ranges-editor">
			<div className="flex items-center justify-between">
				<div className="text-sm text-muted-foreground">
					Ranges use inclusive question numbers (e.g. 1-5, 6-10).
				</div>
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={handleAddSection}
					disabled={disabled}
				>
					<Plus className="mr-2 size-4" />
					Add Range
				</Button>
			</div>

			{sections.length === 0 ? (
				<div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
					No reading material ranges yet. Add one if students need references while
					answering.
				</div>
			) : (
				sections.map((section, index) => (
					<div key={section.id} className="space-y-4 rounded-md border p-4">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2 text-sm font-medium">
								<BookOpen className="size-4 text-primary" />
								Range {index + 1}
							</div>
							<Button
								type="button"
								variant="ghost"
								size="icon"
								onClick={() => handleRemove(section.id)}
								disabled={disabled}
								aria-label={"Delete reading material range " + String(index + 1)}
							>
								<Trash2 className="size-4 text-destructive" />
							</Button>
						</div>

						<div className="grid gap-4 sm:grid-cols-3">
							<div className="space-y-2 sm:col-span-1">
								<Label htmlFor={"section-title-" + section.id}>
									Label (optional)
								</Label>
								<Input
									id={"section-title-" + section.id}
									value={section.title ?? ""}
									onChange={(event) =>
										handleUpdate(section.id, (current) => ({
											...current,
											title: event.target.value || undefined,
										}))
									}
									placeholder="Optional label"
									disabled={disabled}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor={"section-start-" + section.id}>
									Start question
								</Label>
								<Input
									id={"section-start-" + section.id}
									type="number"
									min={1}
									value={section.startQuestion}
									onChange={(event) =>
										handleUpdate(section.id, (current) => ({
											...current,
											startQuestion: toPositiveInt(event.target.value),
										}))
									}
									disabled={disabled}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor={"section-end-" + section.id}>End question</Label>
								<Input
									id={"section-end-" + section.id}
									type="number"
									min={1}
									value={section.endQuestion}
									onChange={(event) =>
										handleUpdate(section.id, (current) => ({
											...current,
											endQuestion: toPositiveInt(event.target.value),
										}))
									}
									disabled={disabled}
								/>
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor={"section-content-" + section.id}>
								Reading material
							</Label>
							<Textarea
								id={"section-content-" + section.id}
								value={section.content}
								onChange={(event) =>
									handleUpdate(section.id, (current) => ({
										...current,
										content: event.target.value,
									}))
								}
								placeholder="Enter material students can reference while answering this range."
								rows={6}
								disabled={disabled}
							/>
						</div>
					</div>
				))
			)}
		</div>
	);
}
