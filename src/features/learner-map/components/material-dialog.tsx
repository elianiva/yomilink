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

export function MaterialDialog({ open, onOpenChange, content, images = [] }: MaterialDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl! max-h-[85vh] overflow-hidden flex flex-col">
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
                            <div
                                className="prose max-w-none rounded-lg border bg-muted/50 p-4 dark:prose-invert prose-p:my-2 prose-headings:my-2 prose-ul:my-2 prose-ol:my-2 prose-blockquote:my-2 prose-li:my-0.5 prose-pre:bg-muted prose-pre:text-foreground prose-pre:border prose-pre:border-border prose-pre:rounded-md prose-pre:p-3 prose-pre:my-2 prose-code:bg-muted/50 prose-code:text-foreground prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:before:content-none prose-code:after:content-none prose-headings:font-medium prose-headings:text-foreground prose-h1:text-xl prose-h2:text-lg prose-h3:text-base prose-h4:text-base prose-strong:font-semibold prose-b:font-semibold prose-ul:list-disc prose-ol:list-decimal prose-ul:pl-5 prose-ol:pl-5 prose-ul:marker:text-foreground prose-ol:marker:text-foreground prose-a:text-primary prose-a:no-underline hover:prose-a:underline"
                                dangerouslySetInnerHTML={{ __html: content }}
                            />
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
