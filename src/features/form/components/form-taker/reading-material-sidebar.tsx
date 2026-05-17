import { BookOpen } from "lucide-react";

import { ReadingMaterialRenderer } from "@/components/reading-material-renderer";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ReadingMaterialSectionLike {
	id: string;
	title?: string | null;
	startQuestion: number;
	endQuestion: number;
	content: string;
}

interface ReadingMaterialSidebarProps {
	sections: readonly ReadingMaterialSectionLike[];
}

export function ReadingMaterialSidebar({ sections }: ReadingMaterialSidebarProps) {
	return (
		<div className="w-1/2 border-r bg-muted/10 flex flex-col min-h-0 min-w-0">
			<div className="flex items-center gap-2 shrink-0 p-6 pb-0">
				<BookOpen className="size-5 text-muted-foreground" />
				<h2 className="font-semibold">Reading Material</h2>
			</div>
			<ScrollArea className="flex-1">
				<div className="space-y-6 p-6">
					{sections.map((section) => (
						<div key={section.id} className="border-b pb-6 last:border-none last:pb-0">
							{section.title && (
								<h3 className="mb-1 text-sm font-medium text-muted-foreground">
									{section.title}
								</h3>
							)}
							<p className="mb-3 text-xs text-muted-foreground">
								Questions {section.startQuestion}–{section.endQuestion}
							</p>
							<ReadingMaterialRenderer content={section.content} />
						</div>
					))}
				</div>
			</ScrollArea>
		</div>
	);
}
