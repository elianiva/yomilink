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
	/** When true, content is treated as HTML (rendered via dangerouslySetInnerHTML) */
	isHtml?: boolean;
	/** When true (default), parenthesized content (furigana) is shown. When false, it's hidden. */
	showFurigana?: boolean;
}

export function ReadingMaterialRenderer({
	content,
	isHtml = false,
	showFurigana = true,
}: ReadingMaterialRendererProps) {
	if (isHtml) {
		return (
			<div
				className="whitespace-pre-wrap text-xl leading-loose text-foreground/90 prose max-w-none dark:prose-invert [&_p]:my-2 [&_h1]:my-2 [&_h2]:my-2 [&_h3]:my-2 [&_h4]:my-2 [&_ul]:my-2 [&_ol]:my-2 [&_blockquote]:my-2 [&_li]:my-0.5 [&_pre]:bg-muted [&_pre]:text-foreground [&_pre]:border [&_pre]:border-border [&_pre]:rounded-md [&_pre]:p-3 [&_pre]:my-2 [&_code]:bg-muted/50 [&_code]:text-foreground [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_code]:before:content-none [&_code]:after:content-none [&_h1]:text-xl [&_h2]:text-lg [&_h3]:text-base [&_h4]:text-base [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-5 [&_ol]:pl-5 [&_a]:text-primary [&_a]:no-underline hover:[&_a]:underline"
				dangerouslySetInnerHTML={{ __html: content }}
			/>
		);
	}

	return (
		<div className="text-xl leading-loose text-foreground/90">
			{highlightParens(content, showFurigana)}
		</div>
	);
}
