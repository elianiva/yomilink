import { cn } from "@/lib/utils";

function highlightParensAsHtml(text: string, showFurigana: boolean): string {
	return text.replaceAll(/(（[^）]*）)/g, (match) =>
		showFurigana ? `<span style="opacity:0.5">${match}</span>` : "",
	);
}

interface ReadingMaterialRendererProps {
	content: string;
	/** When true (default), parenthesized content (furigana) is shown. When false, it's hidden. */
	showFurigana?: boolean;
	className?: string;
}

export function ReadingMaterialRenderer({
	content,
	showFurigana = true,
	className,
}: ReadingMaterialRendererProps) {
	return (
		<div
			className={cn("text-xl leading-loose text-foreground/90", className)}
			dangerouslySetInnerHTML={{
				__html: highlightParensAsHtml(content, showFurigana),
			}}
		/>
	);
}
