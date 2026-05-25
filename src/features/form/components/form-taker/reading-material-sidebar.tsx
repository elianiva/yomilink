import { BookOpen, Languages } from "lucide-react";
import { useState } from "react";

import { ReadingMaterialRenderer } from "@/components/reading-material-renderer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import type { MaterialImage } from "@/features/form/lib/form-service.shared";
import { cn } from "@/lib/utils";
interface ReadingMaterialSectionLike {
	id: string;
	title?: string | null;
	startQuestion: number;
	endQuestion: number;
	content: string;
}

interface ReadingMaterialSidebarProps {
	sections: readonly ReadingMaterialSectionLike[];
	materialImages?: readonly MaterialImage[];
}

function ReadingMaterialContent({
	sections,
	materialImages,
	showFurigana,
	compact,
}: {
	sections: readonly ReadingMaterialSectionLike[];
	materialImages: readonly MaterialImage[];
	showFurigana: boolean;
	compact?: boolean;
}) {
	return (
		<>
			{materialImages.length > 0 && (
				<div className={compact ? "space-y-2" : "space-y-3"}>
					{materialImages.map((image) => (
						<div key={image.id} className="rounded-md border overflow-hidden">
							<img
								src={image.url}
								alt={image.name}
								className="w-full h-auto object-cover"
							/>
						</div>
					))}
				</div>
			)}

			{sections.map((section) => (
				<div
					key={section.id}
					className={cn(
						"border-b last:border-none",
						compact ? "pb-4 last:pb-0" : "pb-6 last:pb-0",
					)}
				>
					{section.title && (
						<h3
							className={cn(
								"font-medium text-muted-foreground",
								compact ? "mb-0.5 text-xs" : "mb-1 text-sm",
							)}
						>
							{section.title}
						</h3>
					)}
					<p
						className={cn(
							"text-muted-foreground",
							compact ? "mb-2 text-[11px]" : "mb-3 text-xs",
						)}
					>
						Questions {section.startQuestion}–{section.endQuestion}
					</p>
					<ReadingMaterialRenderer
						content={section.content}
						showFurigana={showFurigana}
						className={compact ? "text-base" : undefined}
					/>
				</div>
			))}
		</>
	);
}

export function ReadingMaterialSidebar({
	sections,
	materialImages = [],
}: ReadingMaterialSidebarProps) {
	const [showFurigana, setShowFurigana] = useState(true);

	const header = (
		<div className="flex items-center justify-between shrink-0 p-6 pb-0">
			<div className="flex items-center gap-2">
				<BookOpen className="size-5 text-muted-foreground" />
				<h2 className="font-semibold">Reading Material</h2>
			</div>
			{/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
			<label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
				<Languages className="size-3.5" />
				<Switch checked={showFurigana} onCheckedChange={setShowFurigana} />
			</label>
		</div>
	);

	return (
		<>
			{/* Desktop: left sidebar */}
			<div className="hidden md:flex w-1/2 border-r bg-muted/10 flex-col min-h-0 min-w-0">
				{header}
				<ScrollArea className="flex-1">
					<div className="space-y-6 p-6">
						<ReadingMaterialContent
							sections={sections}
							materialImages={materialImages}
							showFurigana={showFurigana}
						/>
					</div>
				</ScrollArea>
			</div>

			{/* Mobile: persistent top section (half-screen split) */}
			<div className="md:hidden flex flex-col min-h-0 flex-1 bg-muted/10">
				<div className="flex items-center justify-between shrink-0 px-4 py-2">
					<div className="flex items-center gap-2">
						<BookOpen className="size-4 text-muted-foreground" />
						<h2 className="text-sm font-semibold">Reading Material</h2>
					</div>
					{/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
					<label className="flex items-center gap-1.5 text-[11px] text-muted-foreground cursor-pointer">
						<Languages className="size-3" />
						<Switch
							checked={showFurigana}
							onCheckedChange={setShowFurigana}
							className="scale-75 origin-right"
						/>
					</label>
				</div>
				<ScrollArea className="flex-1">
					<div className="space-y-4 px-4 pb-4">
						<ReadingMaterialContent
							sections={sections}
							materialImages={materialImages}
							showFurigana={showFurigana}
							compact
						/>
					</div>
				</ScrollArea>
			</div>
		</>
	);
}
