function highlightParensAsHtml(text: string, showParens: boolean): string {
	return text.replaceAll(/(\([^)]*\))/g, (match) =>
		showParens
			? `<span class="text-foreground/50">${match}</span>`
			: "",
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
		<div
			className="text-xl leading-loose text-foreground/90"
			dangerouslySetInnerHTML={{
				__html: highlightParensAsHtml(content, showFurigana),
			}}
		/>
	);
}
