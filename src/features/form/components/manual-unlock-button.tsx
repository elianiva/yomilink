"use client";

import { useState } from "react";
import { LockOpen, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { useRpcMutation } from "@/hooks/use-rpc-query";
import { FormRpc } from "@/server/rpc/form";

interface ManualUnlockButtonProps {
	formId: string;
	userId: string;
	userName?: string;
	onSuccess?: () => void;
	className?: string;
}

export function ManualUnlockButton({
	formId,
	userId,
	userName = "this user",
	onSuccess,
	className,
}: ManualUnlockButtonProps) {
	const [isDialogOpen, setIsDialogOpen] = useState(false);

	const unlockMutation = useRpcMutation(FormRpc.unlockForm(), {
		operation: "unlock form",
		onSuccess: () => {
			setIsDialogOpen(false);
			onSuccess?.();
		},
	});

	const handleUnlock = () => {
		unlockMutation.mutate({ formId, userId });
	};

	return (
		<>
			<Button
				variant="outline"
				size="sm"
				className={className}
				onClick={() => setIsDialogOpen(true)}
			>
				<LockOpen className="mr-2 h-4 w-4" />
				Unlock
			</Button>

			<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Unlock Form</DialogTitle>
						<DialogDescription>
							Are you sure you want to manually unlock this form for{" "}
							<strong>{userName}</strong>? This will bypass all unlock
							conditions.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setIsDialogOpen(false)}
							disabled={unlockMutation.isPending}
						>
							Cancel
						</Button>
						<Button onClick={handleUnlock} disabled={unlockMutation.isPending}>
							{unlockMutation.isPending && (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							)}
							Unlock Form
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
