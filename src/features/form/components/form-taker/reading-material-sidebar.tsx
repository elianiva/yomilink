import { BookOpen } from "lucide-react";
import type { ReactNode } from "react";

interface ReadingMaterialSectionLike {
	id: string;
	title?: string | null;
	startQuestion: number;
	endQuestion: number;
	content: string;
}

function highlightParens(text: string): ReactNode {
	const parts = text.split(/(\([^)]*\))/g);
	return parts.map((part, i) =>
		part.startsWith("(") && part.endsWith(")") ? (
			<span key={i} className="text-foreground/50">
				{part}
			</span>
		) : (
			part
		),
	);
}

interface ReadingMaterialSidebarProps {
	sections: readonly ReadingMaterialSectionLike[];
}

export function ReadingMaterialSidebar({ sections }: ReadingMaterialSidebarProps) {
	return (
		<div className="w-1/2 border-r bg-muted/10 space-y-6 overflow-hidden p-6">
			<div className="flex items-center gap-2">
				<BookOpen className="h-5 w-5 text-muted-foreground" />
				<h2 className="font-semibold">Reading Material</h2>
			</div>
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
					<div className="whitespace-pre-wrap text-xl leading-loose text-foreground/90">
						{highlightParens(section.content)}
					</div>
				</div>
			))}
		</div>
	);
}
