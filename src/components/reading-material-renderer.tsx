import type { ReactNode } from "react";

function highlightParens(text: string, showParens: boolean): ReactNode {
	const parts = text.split(/(\([^)]*\))/g);
	let parenCount = 0;
	return parts.map((part) =>
		part.startsWith("(") && part.endsWith(")") ? (
			showParens ? (
				<span key={`paren-${parenCount++}`} className="text-foreground/50">
					{part}
				</span>
			) : null
		) : (
			part
		),
	);
}

interface ReadingMaterialRendererProps {
	content: string;
	/** When true (default), parenthesized content (furigana) is shown. When false, it's hidden. */
	showFurigana?: boolean;
}

export function ReadingMaterialRenderer({
	content,
	showFurigana = true,
}: ReadingMaterialRendererProps) {
	return (
		<div className="text-xl leading-loose text-foreground/90">
			{highlightParens(content, showFurigana)}
		</div>
	);
}
