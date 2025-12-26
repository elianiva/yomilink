import { BookOpenIcon } from "lucide-react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface MaterialImage {
	id: string;
	url: string;
	name: string;
}

interface MaterialDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	content: string;
	images?: MaterialImage[];
}

export function MaterialDialog({
	open,
	onOpenChange,
	content,
	images = [],
}: MaterialDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<BookOpenIcon className="size-5" />
						Reading Material
					</DialogTitle>
					<DialogDescription>
						Use this material as a reference while building your concept map
					</DialogDescription>
				</DialogHeader>
				<div className="flex-1 overflow-y-auto pr-2 space-y-6">
					{content ? (
						<div className="space-y-4">
							<Label className="text-base font-medium">Text Content</Label>
							<div className="prose prose-sm max-w-none rounded-lg border bg-muted/50 p-4">
								<div className="whitespace-pre-wrap">{content}</div>
							</div>
						</div>
					) : (
						<p className="text-muted-foreground italic">
							No reading material available for this assignment.
						</p>
					)}

					{images && images.length > 0 && (
						<div className="space-y-4">
							<Label className="text-base font-medium">
								Images ({images.length})
							</Label>
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
								{images.map((image) => (
									<div
										key={image.id}
										className="rounded-lg border bg-background overflow-hidden"
									>
										<img
											src={image.url}
											alt={image.name}
											className="w-full h-auto object-cover"
										/>
									</div>
								))}
							</div>
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
