import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useRpcMutation, useRpcQuery } from "@/hooks/use-rpc-query";
import { formatDate } from "@/lib/date-utils";
import { WhitelistRpc } from "@/server/rpc/whitelist";

export function WhitelistPanel() {
	const queryClient = useQueryClient();
	const [selectedFile, setSelectedFile] = useState<File | null>(null);

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

	const handleImport = async () => {
		if (!selectedFile) return;
		const csvText = await selectedFile.text();
		importMutation.mutate({ csvText });
	};

	return (
		<div className="space-y-6">
			<div className="rounded-xl border bg-card p-4 space-y-4">
				<div>
					<h2 className="text-lg font-semibold">Whitelist</h2>
					<p className="text-sm text-muted-foreground">Import CSV. Columns: studentId, name, cohortId.</p>
				</div>
				<div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
					<div className="space-y-1.5">
						<Input
							type="file"
							accept=".csv,text/csv"
							onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
						/>
						<p className="text-xs text-muted-foreground">{selectedFile ? selectedFile.name : "No file selected"}</p>
					</div>
					<Button onClick={() => void handleImport()} disabled={!selectedFile || importMutation.isPending}>
						{importMutation.isPending ? "Importing..." : "Import CSV"}
					</Button>
				</div>
			</div>

			<div className="rounded-xl border bg-card">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Student ID</TableHead>
							<TableHead>Name</TableHead>
							<TableHead>Cohort</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>Added</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{isLoading ? (
							<TableRow>
								<TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
									Loading whitelist...
								</TableCell>
							</TableRow>
						) : entries.length === 0 ? (
							<TableRow>
								<TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
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
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
