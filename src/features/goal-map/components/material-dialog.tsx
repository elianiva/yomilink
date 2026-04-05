import { useAtom } from "jotai";
import { BookOpen, Image as ImageIcon, Trash2, Upload, X } from "lucide-react";
import { memo, useRef, useState } from "react";

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
import { MarkdownEditor } from "@/components/ui/markdown-editor";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRpcMutation } from "@/hooks/use-rpc-query";
import { toast } from "@/lib/error-toast";
import { GoalMapRpc } from "@/server/rpc/goal-map";
import { MaterialImageRpc } from "@/server/rpc/material-image";

import {
	materialDialogOpenAtom,
	materialTextAtom,
	imagesAtom,
	type UploadedImage,
} from "../lib/atoms";

interface MaterialDialogProps {
	goalMapId: string;
	materialText: string;
	materialImages: UploadedImage[];
}

function MaterialDialogImpl({ goalMapId, materialText, materialImages }: MaterialDialogProps) {
	const [open, setOpen] = useAtom(materialDialogOpenAtom);
	const [, setMaterialTextAtom] = useAtom(materialTextAtom);
	const [, setMaterialImagesAtom] = useAtom(imagesAtom);

	// Local state for editing
	const [content, setContent] = useState(materialText);
	const [images, setImages] = useState(materialImages);

	const editorWrapperRef = useRef<HTMLDivElement>(null);
	const imageInputRef = useRef<HTMLInputElement>(null);

	const uploadMutation = useRpcMutation(MaterialImageRpc.upload(), {
		operation: "upload image",
		showSuccess: true,
		successMessage: "Image uploaded successfully",
		onSuccess: (data) => {
			setImages((prev) => [...prev, data]);
		},
	});

	const saveMutation = useRpcMutation(GoalMapRpc.updateMaterial(), {
		operation: "save material",
		showSuccess: true,
		successMessage: "Material saved successfully",
		onSuccess: () => {
			setMaterialTextAtom(content.trim());
			setMaterialImagesAtom(images);
		},
	});

	const handleTextFileUpload = async (file: File) => {
		if (file.size > 10 * 1024 * 1024) {
			toast.error("File too large. Maximum file size is 10MB");
			return;
		}

		const text = await file.text();
		setContent((prev) => (prev ? `${prev}\n\n${text}` : text));
	};

	const handleImageUpload = (file: File) => {
		if (file.size > 5 * 1024 * 1024) {
			toast.error("File too large. Maximum file size is 5MB");
			return;
		}

		uploadMutation.mutate({ goalMapId, file });
	};

	const handleFileChange = async (files: FileList | null) => {
		if (!files || files.length === 0) return;

		const file = files[0];
		const isTextFile =
			file.type === "text/plain" ||
			file.type === "text/markdown" ||
			file.name.endsWith(".txt") ||
			file.name.endsWith(".md");

		const isImageFile = file.type.startsWith("image/");

		if (isImageFile) {
			handleImageUpload(file);
		} else if (isTextFile) {
			void handleTextFileUpload(file);
		} else {
			toast.error("Unsupported file type. Please upload text files or images");
		}
	};

	const handleSave = () => {
		saveMutation.mutate({
			goalMapId,
			materialText: content.trim() || undefined,
			materialImages: images.length > 0 ? images : undefined,
		});
	};

	const handleDeleteImage = (imageId: string) => {
		setImages((prev) => prev.filter((img) => img.id !== imageId));
	};

	const handleClose = () => {
		setOpen(false);
	};

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		e.dataTransfer.dropEffect = "copy";
	};

	const handleDrop = async (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		const files = e.dataTransfer.files;
		if (files && files.length > 0) {
			await handleFileChange(files);
		}
	};

	return (
		<Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
			<DialogContent className="sm:max-w-4xl max-h-[95vh] flex flex-col">
				<DialogHeader>
					<DialogTitle>Learning Material</DialogTitle>
					<DialogDescription>
						Add text content and images for students to reference while completing this
						goal map.
					</DialogDescription>
				</DialogHeader>

				<Tabs defaultValue="content" className="flex-1 flex flex-col min-h-0">
					<TabsList className="grid w-full grid-cols-2">
						<TabsTrigger value="content">
							<BookOpen className="size-4 mr-2" />
							Content
						</TabsTrigger>
						<TabsTrigger value="attachments">
							<ImageIcon className="size-4 mr-2" />
							Attachments ({images.length})
						</TabsTrigger>
					</TabsList>

					<TabsContent
						value="content"
						className="flex-1 flex flex-col min-h-0 overflow-hidden"
					>
						<div
							ref={editorWrapperRef}
							className="flex-1 flex flex-col gap-3 min-h-0"
							onDragOver={handleDragOver}
							onDrop={handleDrop}
						>
							<MarkdownEditor
								content={content}
								onChange={setContent}
								placeholder="Write or paste your learning material here. You can also drag and drop .txt or .md files."
								className="flex-1 min-h-0"
							/>
							<div className="flex items-center gap-2 text-xs text-muted-foreground flex-shrink-0">
								<span className="font-medium">Tip:</span>
								<span>Drag and drop .txt or .md files to insert their content</span>
							</div>
						</div>
					</TabsContent>

					<TabsContent
						value="attachments"
						className="flex-1 flex flex-col min-h-0 overflow-hidden space-y-4"
					>
						{/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
						<input
							ref={imageInputRef}
							id="image-upload"
							type="file"
							accept="image/*"
							multiple
							onChange={(e) => handleFileChange(e.currentTarget.files)}
							className="sr-only"
						/>
						<label
							htmlFor="image-upload"
							className="flex flex-col items-center justify-center gap-4 p-8 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
							onDragOver={handleDragOver}
							onDrop={handleDrop}
						>
							<Upload className="size-10 text-muted-foreground" />
							<span className="text-center space-y-1">
								<span className="block text-sm font-medium">
									Drag & drop images here, or click to select
								</span>
								<span className="block text-xs text-muted-foreground">
									Max 5MB per image, up to 10 images
								</span>
							</span>
						</label>

						{images.length > 0 && (
							<div className="flex-1 flex flex-col min-h-0 space-y-3 overflow-hidden">
								<Label className="flex-shrink-0">Uploaded Images</Label>
								<div className="flex-1 overflow-y-auto">
									<div className="grid grid-cols-2 md:grid-cols-3 gap-3">
										{images.map((image) => (
											<div
												key={image.id}
												className="group relative rounded-lg border overflow-hidden"
											>
												<img
													src={image.url}
													alt={image.name}
													className="w-full h-36 object-cover"
												/>
												<div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
													<Button
														type="button"
														variant="destructive"
														size="icon"
														onClick={() => handleDeleteImage(image.id)}
														title="Delete image"
													>
														<Trash2 className="size-4" />
													</Button>
												</div>
												<div className="absolute bottom-0 left-0 right-0 bg-black/80 text-white text-xs p-2">
													<p className="truncate font-medium">
														{image.name}
													</p>
													<p className="text-muted-foreground">
														{(image.size / 1024).toFixed(1)} KB
													</p>
												</div>
											</div>
										))}
									</div>
								</div>
							</div>
						)}

						{images.length >= 10 && (
							<div className="flex items-center gap-2 text-sm text-muted-foreground flex-shrink-0">
								<X className="size-4" />
								Maximum of 10 images reached. Remove some to add more.
							</div>
						)}
					</TabsContent>
				</Tabs>

				<DialogFooter>
					<Button variant="outline" onClick={handleClose}>
						Cancel
					</Button>
					<Button
						onClick={handleSave}
						disabled={
							(!content.trim() && images.length === 0) || saveMutation.isPending
						}
					>
						{saveMutation.isPending ? "Saving..." : "Save"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

export const MaterialDialog = memo(MaterialDialogImpl);
