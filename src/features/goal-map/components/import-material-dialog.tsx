import { useAtom } from "jotai";
import { FileText, Image as ImageIcon, Trash2, Upload, X } from "lucide-react";
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
import {
	importDialogOpenAtom,
	materialTextAtom,
	imagesAtom,
} from "../lib/atoms";
import { uploadMaterialImage } from "@/server/rpc/material-image";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

interface ImportMaterialDialogProps {
	goalMapId: string;
}

function ImportMaterialDialogImpl({ goalMapId }: ImportMaterialDialogProps) {
	const [open, setOpen] = useAtom(importDialogOpenAtom);
	const [materialText, setMaterialText] = useAtom(materialTextAtom);
	const [materialImages, setMaterialImages] = useAtom(imagesAtom);
	const [localText, setLocalText] = useState("");
	const [fileName, setFileName] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const textareaId = useId();

	const uploadMutation = useMutation({
		mutationFn: uploadMaterialImage,
		onSuccess: (result) => {
			if (result.success) {
				setMaterialImages((prev) => [...prev, result.image]);
				toast.success("Image uploaded successfully");
			}
		},
		onError: (error) => {
			toast.error("Upload failed", {
				description: error instanceof Error ? error.message : "Unknown error",
			});
		},
	});

	const handleFileChange = async (files: FileList | null) => {
		if (!files || files.length === 0) return;

		const file = files[0];
		const isTextFile =
			file.type === "text/plain" ||
			file.type === "text/markdown" ||
			file.name.endsWith(".txt") ||
			file.name.endsWith(".md");

		const isImageFile =
			file.type.startsWith("image/") ||
			[".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"].some((ext) =>
				file.name.toLowerCase().endsWith(ext),
			);

		if (isImageFile) {
			if (file.size > 5 * 1024 * 1024) {
				toast.error("File too large", {
					description: "Maximum file size is 5MB",
				});
				return;
			}

			uploadMutation.mutate({
				goalMapId,
				file,
			});
			return;
		}

		if (!isTextFile) {
			toast.error("Unsupported file type", {
				description: "Please upload text files or images",
			});
			return;
		}

		if (file.size > 10 * 1024 * 1024) {
			toast.error("File too large", {
				description: "Maximum file size is 10MB",
			});
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

	const handleDeleteImage = (imageId: string) => {
		setMaterialImages((prev) => prev.filter((img) => img.id !== imageId));
	};

	const handleClose = () => {
		setOpen(false);
		setLocalText("");
		setFileName(null);
	};

	const handleOpenChange = (isOpen: boolean) => {
		if (isOpen) {
			setLocalText(materialText);
		} else {
			handleClose();
		}
	};

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		e.dataTransfer.dropEffect = "copy";
	};

	const handleDrop = async (e: React.DragEvent) => {
		e.preventDefault();
		const files = e.dataTransfer.files;
		if (files && files.length > 0) {
			await handleFileChange(files);
		}
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col">
				<DialogHeader>
					<DialogTitle>Import Learning Material</DialogTitle>
					<DialogDescription>
						Upload text files or images. This material will be saved with the
						goalmap for students to read.
					</DialogDescription>
				</DialogHeader>

				<Tabs defaultValue="upload" className="flex-1 flex flex-col min-h-0">
					<TabsList className="grid w-full grid-cols-3">
						<TabsTrigger value="upload">
							<Upload className="size-4 mr-2" />
							Upload File
						</TabsTrigger>
						<TabsTrigger value="paste">
							<FileText className="size-4 mr-2" />
							Paste Text
						</TabsTrigger>
						<TabsTrigger value="images">
							<ImageIcon className="size-4 mr-2" />
							Images ({materialImages.length})
						</TabsTrigger>
					</TabsList>

					<TabsContent value="upload" className="space-y-4">
						<div className="flex items-center gap-3">
							<input
								ref={fileInputRef}
								type="file"
								accept=".txt,.md,.png,.jpg,.jpeg,.gif,.webp,.svg"
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
								{fileName ?? "No file selected"} (.txt, .md, images)
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

					<TabsContent
						value="images"
						className="space-y-4 flex-1 flex flex-col min-h-0"
					>
						<div
							className="flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-lg"
							onDragOver={handleDragOver}
							onDrop={handleDrop}
						>
							<input
								type="file"
								accept="image/*"
								multiple
								onChange={(e) => handleFileChange(e.currentTarget.files)}
								className="size-full cursor-pointer opacity-0 absolute inset-0"
							/>
							<div className="text-center space-y-2 pointer-events-none">
								<Upload className="size-12 mx-auto text-muted-foreground" />
								<p className="text-sm font-medium">
									Drag & drop images here, or click to select
								</p>
								<p className="text-xs text-muted-foreground">
									Max 5MB per image, up to 10 images
								</p>
							</div>
						</div>

						{materialImages.length > 0 && (
							<div className="flex-1 overflow-auto border-t pt-4">
								<Label className="mb-3">Uploaded Images</Label>
								<div className="grid grid-cols-2 md:grid-cols-3 gap-3">
									{materialImages.map((image) => (
										<div
											key={image.id}
											className="group relative rounded-lg border overflow-hidden"
										>
											<img
												src={image.url}
												alt={image.name}
												className="w-full h-40 object-cover"
											/>
											<div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity" />
											<Button
												type="button"
												variant="destructive"
												size="icon"
												className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
												onClick={() => handleDeleteImage(image.id)}
											>
												<Trash2 className="size-4" />
											</Button>
											<div className="absolute bottom-0 left-0 right-0 bg-black/80 text-white text-xs p-2">
												<p className="truncate font-medium">{image.name}</p>
												<p className="text-muted-foreground">
													{(image.size / 1024).toFixed(1)} KB
												</p>
											</div>
										</div>
									))}
								</div>
							</div>
						)}

						{materialImages.length >= 10 && (
							<div className="flex items-center gap-2 text-sm text-muted-foreground">
								<X className="size-4" />
								Maximum of 10 images reached. Remove some to add more.
							</div>
						)}
					</TabsContent>
				</Tabs>

				{(localText || materialImages.length > 0) && (
					<div className="space-y-2 border-t pt-4">
						<Label>Preview</Label>
						{localText && (
							<div className="max-h-40 overflow-auto rounded-md border bg-muted/50 p-3 text-sm font-mono whitespace-pre-wrap">
								{localText.length > 2000
									? `${localText.slice(0, 2000)}...`
									: localText}
							</div>
						)}
						{materialImages.length > 0 && (
							<div className="text-sm text-muted-foreground">
								{materialImages.length} image
								{materialImages.length !== 1 ? "s" : ""} uploaded
							</div>
						)}
					</div>
				)}

				<DialogFooter>
					<Button variant="outline" onClick={handleClose}>
						Cancel
					</Button>
					<Button
						onClick={handleImport}
						disabled={!localText.trim() && materialImages.length === 0}
					>
						Import
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

export const ImportMaterialDialog = memo(ImportMaterialDialogImpl);
