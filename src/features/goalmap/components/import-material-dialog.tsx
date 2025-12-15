import { useAtom } from "jotai";
import { FileText, Upload } from "lucide-react";
import { memo, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { importDialogOpenAtom, materialTextAtom } from "../lib/atoms";

function ImportMaterialDialogImpl() {
	const [open, setOpen] = useAtom(importDialogOpenAtom);
	const [materialText, setMaterialText] = useAtom(materialTextAtom);
	const [localText, setLocalText] = useState("");
	const [fileName, setFileName] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const textareaId = useId();

	const handleFileChange = async (files: FileList | null) => {
		if (!files || files.length === 0) return;

		const file = files[0];
		const isTextFile =
			file.type === "text/plain" ||
			file.type === "text/markdown" ||
			file.name.endsWith(".txt") ||
			file.name.endsWith(".md");

		if (!isTextFile) {
			console.warn("Unsupported file type:", file.type);
			return;
		}

		if (file.size > 10 * 1024 * 1024) {
			console.warn("File too large (max 10MB):", file.name);
			return;
		}

		const text = await file.text();
		setLocalText(text);
		setFileName(file.name);
	};

	const handleImport = () => {
		if (localText.trim()) {
			setMaterialText(localText.trim());
		}
		handleClose();
	};

	const handleClose = () => {
		setOpen(false);
		setLocalText("");
		setFileName(null);
	};

	const handleOpenChange = (isOpen: boolean) => {
		if (isOpen) {
			// Pre-populate with existing material text
			setLocalText(materialText);
		} else {
			handleClose();
		}
	};

	const previewText = localText || materialText;

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col">
				<DialogHeader>
					<DialogTitle>Import Learning Material</DialogTitle>
					<DialogDescription>
						Upload a text file or paste content directly. This material will be
						saved with the goalmap for students to read.
					</DialogDescription>
				</DialogHeader>

				<Tabs defaultValue="upload" className="flex-1 flex flex-col min-h-0">
					<TabsList className="grid w-full grid-cols-2">
						<TabsTrigger value="upload">
							<Upload className="size-4 mr-2" />
							Upload File
						</TabsTrigger>
						<TabsTrigger value="paste">
							<FileText className="size-4 mr-2" />
							Paste Text
						</TabsTrigger>
					</TabsList>

					<TabsContent value="upload" className="space-y-4">
						<div className="flex items-center gap-3">
							<input
								ref={fileInputRef}
								type="file"
								accept=".txt,.md,text/plain,text/markdown"
								onChange={(e) => handleFileChange(e.currentTarget.files)}
								className="sr-only"
							/>
							<Button
								type="button"
								variant="outline"
								onClick={() => fileInputRef.current?.click()}
							>
								<Upload className="size-4 mr-2" />
								Choose File
							</Button>
							<span className="text-sm text-muted-foreground">
								{fileName ?? "No file selected"} (.txt, .md)
							</span>
						</div>
					</TabsContent>

					<TabsContent value="paste" className="space-y-4 flex-1 flex flex-col">
						<div className="space-y-2 flex-1 flex flex-col">
							<Label htmlFor={textareaId}>Text Content</Label>
							<textarea
								id={textareaId}
								className="flex-1 min-h-32 w-full rounded-md border bg-background p-3 text-sm font-mono resize-none"
								value={localText}
								onChange={(e) => {
									setLocalText(e.target.value);
									setFileName(null);
								}}
								placeholder="Paste your learning material here..."
							/>
						</div>
					</TabsContent>
				</Tabs>

				{/* Preview Section */}
				{previewText && (
					<div className="space-y-2 border-t pt-4">
						<Label>Preview</Label>
						<div
							className={cn(
								"max-h-40 overflow-auto rounded-md border bg-muted/50 p-3",
								"text-sm font-mono whitespace-pre-wrap",
							)}
						>
							{previewText.length > 2000
								? `${previewText.slice(0, 2000)}...`
								: previewText}
						</div>
						<p className="text-xs text-muted-foreground">
							{previewText.length.toLocaleString()} characters
						</p>
					</div>
				)}

				<DialogFooter>
					<Button variant="outline" onClick={handleClose}>
						Cancel
					</Button>
					<Button onClick={handleImport} disabled={!localText.trim()}>
						Import
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

export const ImportMaterialDialog = memo(ImportMaterialDialogImpl);
