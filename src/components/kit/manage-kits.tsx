import { useState } from "react";
import type { StudentKitSchema } from "@/server/rpc/kits";
import { Button } from "../ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "../ui/dialog";

type ManageKitDialogProps = {
	open: boolean;
	onClose: () => void;
	onConfirm: (kitId: string) => void;
	kits: readonly (typeof StudentKitSchema.Type)[];
};

export function ManageKitDialog({ open }: ManageKitDialogProps) {
	const [selectedKitId, setSelectedKitId] = useState<string | null>(null);

	if (!open) return null;

	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button>Manage Kits</Button>
			</DialogTrigger>
			<DialogContent className="min-w-2xl">
				<DialogHeader>
					<DialogTitle>Manage Kits</DialogTitle>
					<DialogDescription>
						Manage your kit-build concept maps
					</DialogDescription>
				</DialogHeader>
				<div className="grid grid-cols-2 gap-4">
					<div className="p-2 border rounded-md">
						<h2 className="font-bold">Topics</h2>
					</div>
					<div className="p-2 border rounded-md">
						<h2>Goal Maps</h2>
					</div>
				</div>
				<DialogFooter>
					<Button>New Map</Button>
					<DialogClose asChild>
						<Button variant="outline">Cancel</Button>
					</DialogClose>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
