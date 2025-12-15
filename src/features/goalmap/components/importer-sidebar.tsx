import type * as React from "react";
import { useId } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface ImporterSidebarProps {
	fileInputRef: React.RefObject<HTMLInputElement | null>;
	materialText: string;
	onMaterialTextChange: (text: string) => void;
	onImportFiles: (files: FileList | null) => void;
	images: Array<{ id: string; url: string; name: string }>;
	onSelectImage: (url: string, caption: string) => void;
}

export function ImporterSidebar({
	fileInputRef,
	materialText,
	onMaterialTextChange,
	onImportFiles,
	images,
	onSelectImage,
}: ImporterSidebarProps) {
	const materialTextareaId = useId();

	return (
		<div className="col-span-12 lg:col-span-3 rounded-xl border p-3 space-y-3">
			<div className="text-sm font-medium text-muted-foreground">
				Learning Material
			</div>
			<div className="flex items-center gap-2">
				<input
					ref={fileInputRef}
					type="file"
					multiple
					accept=".txt,image/png,image/jpeg"
					onChange={(e) => onImportFiles(e.currentTarget.files)}
					className="sr-only"
				/>
				<Button
					type="button"
					variant="secondary"
					size="sm"
					onClick={() => fileInputRef.current?.click()}
					title="Pick files"
				>
					Pick files
				</Button>
				<span className="text-xs text-muted-foreground">.txt, .png, .jpg</span>
			</div>
			<div className="space-y-2">
				<Label htmlFor={materialTextareaId}>Text</Label>
				<textarea
					id={materialTextareaId}
					className="w-full min-h-40 rounded-md border bg-background p-2 text-sm"
					value={materialText}
					onChange={(e) => onMaterialTextChange(e.target.value)}
					placeholder="Imported text appears here..."
				/>
			</div>
			<div className="space-y-2">
				<div className="text-sm font-medium">Images</div>
				<div className="grid grid-cols-3 gap-2">
					{images.map((img) => (
						<button
							type="button"
							key={img.id}
							className="overflow-hidden rounded-md border"
							onClick={() => onSelectImage(img.url, img.name)}
							title="Use in image node"
						>
							<img
								src={img.url}
								alt={img.name}
								className="h-20 w-full object-cover"
							/>
						</button>
					))}
					{images.length === 0 ? (
						<div className="text-xs text-muted-foreground">
							No images imported
						</div>
					) : null}
				</div>
			</div>
		</div>
	);
}
