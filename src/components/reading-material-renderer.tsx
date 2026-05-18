function highlightParensAsHtml(text: string, showFurigana: boolean): string {
	return text.replaceAll(/(（[^）]*）)/g, (match) =>
		showFurigana ? `<span style="opacity:0.5">${match}</span>` : "",
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
