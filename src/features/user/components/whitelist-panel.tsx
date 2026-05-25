import { useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { useRpcMutation, useRpcQuery } from "@/hooks/use-rpc-query";
import { formatDate } from "@/lib/date-utils";
import { WhitelistRpc } from "@/server/rpc/whitelist";

export function WhitelistPanel() {
	const queryClient = useQueryClient();
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [deleteId, setDeleteId] = useState<string | null>(null);

	const { data, isLoading } = useRpcQuery(WhitelistRpc.listUnregistered());
	const entries = data ?? [];

	const importMutation = useRpcMutation(WhitelistRpc.importCsv(), {
		operation: "import whitelist",
		showSuccess: true,
		successMessage: "Whitelist imported",
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: WhitelistRpc.whitelist() });
			setSelectedFile(null);
		},
	});

	const deleteMutation = useRpcMutation(WhitelistRpc.deleteEntry(), {
		operation: "delete whitelist entry",
		showSuccess: true,
		successMessage: "Whitelist entry deleted",
		onSuccess: () => {
			setDeleteId(null);
			void queryClient.invalidateQueries({ queryKey: WhitelistRpc.whitelist() });
		},
	});

	const handleImport = async () => {
		if (!selectedFile) return;
		const csvText = await selectedFile.text();
		importMutation.mutate({ csvText });
	};

	return (
		<div className="space-y-4">
			<div className="flex flex-col gap-3">
				<p className="text-sm text-muted-foreground">
					Import CSV. Columns: studentId, name, cohortId.
				</p>
				<div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-start">
					<div className="space-y-1.5">
						<Input
							type="file"
							accept=".csv,text/csv"
							onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
						/>
						<p className="text-xs text-muted-foreground">
							{selectedFile ? selectedFile.name : "No file selected"}
						</p>
					</div>
					<Button
						onClick={() => void handleImport()}
						disabled={!selectedFile || importMutation.isPending}
					>
						{importMutation.isPending ? "Importing..." : "Import CSV"}
					</Button>
				</div>
			</div>

			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Student ID</TableHead>
						<TableHead>Name</TableHead>
						<TableHead>Cohort</TableHead>
						<TableHead>Status</TableHead>
						<TableHead>Added</TableHead>
						<TableHead className="w-12" />
					</TableRow>
				</TableHeader>
				<TableBody>
					{isLoading ? (
						<TableRow>
							<TableCell
								colSpan={6}
								className="py-8 text-center text-muted-foreground"
							>
								Loading whitelist…
							</TableCell>
						</TableRow>
					) : entries.length === 0 ? (
						<TableRow>
							<TableCell
								colSpan={6}
								className="py-8 text-center text-muted-foreground"
							>
								No unregistered whitelist entries
							</TableCell>
						</TableRow>
					) : (
						entries.map((entry) => (
							<TableRow key={entry.id}>
								<TableCell className="font-medium">{entry.studentId}</TableCell>
								<TableCell>{entry.name}</TableCell>
								<TableCell>{entry.cohortName ?? "—"}</TableCell>
								<TableCell>
									<Badge variant="secondary">Pending</Badge>
								</TableCell>
								<TableCell>{formatDate(entry.createdAt.getTime())}</TableCell>
								<TableCell>
									<Button
										variant="ghost"
										size="icon"
										className="size-8 text-destructive hover:text-destructive hover:bg-destructive/10"
										onClick={() => setDeleteId(entry.id)}
									>
										<Trash2 className="size-4" />
									</Button>
								</TableCell>
							</TableRow>
						))
					)}
				</TableBody>
			</Table>

			<Dialog open={deleteId !== null} onOpenChange={(v) => !v && setDeleteId(null)}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Delete Whitelist Entry</DialogTitle>
						<DialogDescription>
							Are you sure you want to delete this whitelist entry? This action cannot
							be undone.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="outline" onClick={() => setDeleteId(null)}>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={() => deleteId && deleteMutation.mutate({ id: deleteId })}
							disabled={deleteMutation.isPending}
						>
							Delete
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
