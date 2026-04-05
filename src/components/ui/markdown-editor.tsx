"use client";

import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import type { Slice } from "@tiptap/pm/model";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
	Bold,
	Italic,
	Underline as UnderlineIcon,
	List,
	ListOrdered,
	Link as LinkIcon,
	Heading1,
	Heading2,
	Quote,
	Undo,
	Redo,
	Minus,
} from "lucide-react";
import { useRef, useEffect } from "react";
import type * as React from "react";
import { Markdown } from "tiptap-markdown";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export interface MarkdownEditorProps {
	/** Current HTML content */
	content: string;
	/** Callback when content changes (returns HTML) */
	onChange: (html: string) => void;
	/** Placeholder text */
	placeholder?: string;
	/** Additional CSS classes */
	className?: string;
	/** Whether the editor is disabled */
	disabled?: boolean;
}

interface ToolbarButtonProps {
	isActive?: boolean;
	onClick: () => void;
	disabled?: boolean;
	title: string;
	children: React.ReactNode;
}

function ToolbarButton({ isActive, onClick, disabled, title, children }: ToolbarButtonProps) {
	return (
		<Button
			type="button"
			variant={isActive ? "secondary" : "ghost"}
			size="sm"
			onClick={onClick}
			disabled={disabled}
			title={title}
			className={cn("h-9 w-9 p-0 touch-manipulation", isActive && "bg-muted")}
		>
			{children}
		</Button>
	);
}

function EditorToolbar({ editor, disabled }: { editor: Editor | null; disabled?: boolean }) {
	if (!editor) return null;

	const addLink = () => {
		const url = window.prompt("Enter link URL:");
		if (url) {
			editor.commands.setLink({ href: url });
		}
	};

	return (
		<div
			role="toolbar"
			aria-label="Text formatting"
			className="flex flex-wrap items-center gap-1 border-b bg-muted/30 p-2"
		>
			{/* History */}
			<ToolbarButton
				title="Undo (Ctrl+Z)"
				onClick={() => editor.chain().focus().undo().run()}
				disabled={disabled || !editor.can().undo()}
			>
				<Undo className="h-4 w-4" />
			</ToolbarButton>
			<ToolbarButton
				title="Redo (Ctrl+Shift+Z)"
				onClick={() => editor.chain().focus().redo().run()}
				disabled={disabled || !editor.can().redo()}
			>
				<Redo className="h-4 w-4" />
			</ToolbarButton>

			<Separator orientation="vertical" className="mx-1 h-6" />

			{/* Headings */}
			<ToolbarButton
				title="Large Heading"
				isActive={editor.isActive("heading", { level: 1 })}
				onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
				disabled={disabled}
			>
				<Heading1 className="h-4 w-4" />
			</ToolbarButton>
			<ToolbarButton
				title="Medium Heading"
				isActive={editor.isActive("heading", { level: 2 })}
				onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
				disabled={disabled}
			>
				<Heading2 className="h-4 w-4" />
			</ToolbarButton>

			<Separator orientation="vertical" className="mx-1 h-6" />

			{/* Text formatting */}
			<ToolbarButton
				title="Bold (Ctrl+B)"
				isActive={editor.isActive("bold")}
				onClick={() => editor.chain().focus().toggleBold().run()}
				disabled={disabled}
			>
				<Bold className="h-4 w-4" />
			</ToolbarButton>
			<ToolbarButton
				title="Italic (Ctrl+I)"
				isActive={editor.isActive("italic")}
				onClick={() => editor.chain().focus().toggleItalic().run()}
				disabled={disabled}
			>
				<Italic className="h-4 w-4" />
			</ToolbarButton>
			<ToolbarButton
				title="Underline (Ctrl+U)"
				isActive={editor.isActive("underline")}
				onClick={() => editor.chain().focus().toggleUnderline().run()}
				disabled={disabled}
			>
				<UnderlineIcon className="h-4 w-4" />
			</ToolbarButton>

			<Separator orientation="vertical" className="mx-1 h-6" />

			{/* Lists */}
			<ToolbarButton
				title="Bullet List"
				isActive={editor.isActive("bulletList")}
				onClick={() => editor.chain().focus().toggleBulletList().run()}
				disabled={disabled}
			>
				<List className="h-4 w-4" />
			</ToolbarButton>
			<ToolbarButton
				title="Numbered List"
				isActive={editor.isActive("orderedList")}
				onClick={() => editor.chain().focus().toggleOrderedList().run()}
				disabled={disabled}
			>
				<ListOrdered className="h-4 w-4" />
			</ToolbarButton>
			<ToolbarButton
				title="Quote"
				isActive={editor.isActive("blockquote")}
				onClick={() => editor.chain().focus().toggleBlockquote().run()}
				disabled={disabled}
			>
				<Quote className="h-4 w-4" />
			</ToolbarButton>

			<Separator orientation="vertical" className="mx-1 h-6" />

			{/* Insert */}
			<ToolbarButton
				title="Add Link"
				isActive={editor.isActive("link")}
				onClick={addLink}
				disabled={disabled}
			>
				<LinkIcon className="h-4 w-4" />
			</ToolbarButton>
			<ToolbarButton
				title="Add Horizontal Line"
				onClick={() => editor.chain().focus().setHorizontalRule().run()}
				disabled={disabled}
			>
				<Minus className="h-4 w-4" />
			</ToolbarButton>
		</div>
	);
}

export function MarkdownEditor({
	content,
	onChange,
	placeholder = "Start typing...",
	className,
	disabled,
}: MarkdownEditorProps) {
	const editorRef = useRef<Editor | null>(null);

	const editor = useEditor({
		extensions: [
			StarterKit.configure({
				dropcursor: false,
				gapcursor: false,
				codeBlock: {
					// Ensure code blocks don't add extra spacing between lines
					HTMLAttributes: {
						class: "whitespace-pre font-mono text-sm",
					},
				},
			}),
			Link.configure({
				openOnClick: false,
			}),
			Underline,
			Placeholder.configure({
				placeholder,
			}),
			Markdown.configure({
				html: true,
				transformPastedText: true,
				transformCopiedText: false,
			}),
		],
		content,
		editable: !disabled,
		onUpdate: ({ editor: updatedEditor }) => {
			onChange(updatedEditor.getHTML());
		},
		editorProps: {
			attributes: {
				class: cn(
					"prose prose-sm",
					"max-w-none min-h-[200px] p-4 focus:outline-none",
					"dark:prose-invert",
					// Spacing - tighter vertical rhythm
					"prose-p:my-2 prose-headings:my-2 prose-ul:my-2 prose-ol:my-2 prose-blockquote:my-2",
					"prose-li:my-0.5",
					// Code blocks - aggressive spacing reset to prevent extra blank lines
					"prose-pre:bg-muted prose-pre:text-foreground prose-pre:border prose-pre:border-border prose-pre:rounded-md prose-pre:p-3 prose-pre:my-2",
					"[&_pre]:whitespace-pre [&_pre>code]:whitespace-pre",
					"[&_pre>*]:m-0 [&_pre>*]:p-0 [&_pre>*]:leading-none",
					"[&_pre_p]:hidden", // Hide any rogue <p> tags inside pre
					// Inline code
					"prose-code:bg-muted/50 prose-code:text-foreground prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:before:content-none prose-code:after:content-none",
					// Headings - smaller, thinner, semibold
					"prose-headings:font-medium prose-headings:text-foreground",
					"prose-h1:text-xl prose-h2:text-lg prose-h3:text-base prose-h4:text-base",
					// Bold/strong - use semibold not bold for this font
					"prose-strong:font-semibold prose-b:font-semibold",
					// Lists - proper bullet sizing and spacing
					"prose-ul:list-disc prose-ol:list-decimal",
					"prose-ul:pl-5 prose-ol:pl-5",
					"prose-ul:marker:text-foreground prose-ol:marker:text-foreground",
					// Links
					"prose-a:text-primary prose-a:no-underline hover:prose-a:underline",
				),
			},
			handlePaste: (_view, event, _slice: Slice) => {
				const dataTransfer = event.clipboardData;
				if (!dataTransfer) return false;

				const html = dataTransfer.getData("text/html");
				const text = dataTransfer.getData("text/plain");

				// If there's HTML, let tiptap handle it naturally
				if (html) return false;

				// Plain text only - check for markdown
				const hasMarkdown =
					/^#{1,6}\s/m.test(text) ||
					/^\*\*.*\*\*/m.test(text) ||
					/^`{1,3}/m.test(text) ||
					/^>\s/m.test(text);

				if (hasMarkdown && editorRef.current) {
					event.preventDefault();
					// Use preserveWhitespace to keep code block formatting intact
					editorRef.current
						.chain()
						.focus()
						.insertContent(text, { parseOptions: { preserveWhitespace: true } })
						.run();
					return true;
				}

				return false;
			},
		},
	});

	useEffect(() => {
		if (editor) {
			editorRef.current = editor;
		}
		return () => {
			editorRef.current = null;
		};
	}, [editor]);

	return (
		<div
			className={cn(
				"flex flex-col rounded-md border bg-background overflow-hidden",
				disabled && "opacity-60",
				className,
			)}
		>
			<EditorToolbar editor={editor} disabled={disabled} />
			<div className="flex-1 overflow-auto">
				<EditorContent editor={editor} className="min-h-0" />
			</div>
		</div>
	);
}
