import type * as React from "react";
import { useId } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export interface ImporterSidebarProps {
	fileInputRef: React.RefObject<HTMLInputElement | null>;
	materialText: string;
	onMaterialTextChange: (text: string) => void;
	onImportFiles: (files: FileList | null) => void;
}

export function ImporterSidebar({
	fileInputRef,
	materialText,
	onMaterialTextChange,
	onImportFiles,
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
					accept=".txt"
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
				<span className="text-xs text-muted-foreground">.txt</span>
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
		</div>
	);
}
