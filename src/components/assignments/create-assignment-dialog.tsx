import { PlusIcon } from "lucide-react";
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

export function CreateAssignmentDialog({
	onSuccess,
}: CreateAssignmentDialogProps) {
	return (
		<Dialog>
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
				<CreateAssignmentForm onSuccess={onSuccess} onCancel={() => {}} />
			</DialogContent>
		</Dialog>
	);
}
