import { useNavigate } from "@tanstack/react-router";

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface FormBuilderDialogsProps {
	showUnsavedDialog: boolean;
	showDraftDialog: boolean;
	onShowUnsavedDialogChange: (open: boolean) => void;
	onShowDraftDialogChange: (open: boolean) => void;
	onLoadDraft: () => void;
	onDiscardDraft: () => void;
}

export function FormBuilderDialogs({
	showUnsavedDialog,
	showDraftDialog,
	onShowUnsavedDialogChange,
	onShowDraftDialogChange,
	onLoadDraft,
	onDiscardDraft,
}: FormBuilderDialogsProps) {
	const navigate = useNavigate();

	return (
		<>
			{/* Unsaved Changes Dialog */}
			<AlertDialog open={showUnsavedDialog} onOpenChange={onShowUnsavedDialogChange}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
						<AlertDialogDescription>
							You have unsaved changes. Are you sure you want to leave?
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel onClick={() => onShowUnsavedDialogChange(false)}>
							Stay
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => void navigate({ to: "/dashboard/forms" })}
						>
							Leave
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Draft Recovery Dialog */}
			<AlertDialog open={showDraftDialog} onOpenChange={onShowDraftDialogChange}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Restore Draft?</AlertDialogTitle>
						<AlertDialogDescription>
							You have an unsaved form draft. Would you like to restore it?
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel onClick={onDiscardDraft}>Discard</AlertDialogCancel>
						<AlertDialogAction onClick={onLoadDraft}>Restore</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
