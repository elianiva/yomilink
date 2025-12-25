import { BookOpenIcon } from "lucide-react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

interface MaterialDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	content: string;
}

export function MaterialDialog({
	open,
	onOpenChange,
	content,
}: MaterialDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<BookOpenIcon className="size-5" />
						Reading Material
					</DialogTitle>
					<DialogDescription>
						Use this material as a reference while building your concept map
					</DialogDescription>
				</DialogHeader>
				<div className="flex-1 overflow-y-auto pr-2">
					<div className="prose prose-sm max-w-none">
						{content ? (
							<div className="whitespace-pre-wrap">{content}</div>
						) : (
							<p className="text-muted-foreground italic">
								No reading material available for this assignment.
							</p>
						)}
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
