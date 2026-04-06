import { PlusIcon } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";

import { CreateAssignmentForm } from "./create-assignment-form";

interface CreateAssignmentDialogProps {
	onSuccess: () => void;
}

export function CreateAssignmentDialog({ onSuccess }: CreateAssignmentDialogProps) {
	const [open, setOpen] = React.useState(false);
	const [formKey, setFormKey] = React.useState(0);

	const handleOpenChange = (isOpen: boolean) => {
		setOpen(isOpen);
		if (!isOpen) {
			// Reset form by incrementing key to force remount
			setFormKey((k) => k + 1);
		}
	};

	const handleSuccess = () => {
		setOpen(false);
		setFormKey((k) => k + 1);
		onSuccess();
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogTrigger asChild>
				<Button>
					<PlusIcon className="size-4 mr-2" />
					Create Assignment
				</Button>
			</DialogTrigger>
			<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Create New Assignment</DialogTitle>
					<DialogDescription>
						Follow the steps below to create a new assignment for your students.
					</DialogDescription>
				</DialogHeader>
				<CreateAssignmentForm
					key={formKey}
					onSuccess={handleSuccess}
					onCancel={() => handleOpenChange(false)}
				/>
			</DialogContent>
		</Dialog>
	);
}
