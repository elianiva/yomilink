import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import type { UserWithCohorts } from "@/features/user/lib/user-service";
import { formatDate } from "@/lib/date-utils";

type UserTableProps = {
	users: UserWithCohorts[];
	selectedIds: string[];
	onSelectionChange: (ids: string[]) => void;
	onUserClick: (user: UserWithCohorts) => void;
};

export function UserTable({ users, selectedIds, onSelectionChange, onUserClick }: UserTableProps) {
	const allSelected = users.length > 0 && users.every((u) => selectedIds.includes(u.id));
	const someSelected = users.some((u) => selectedIds.includes(u.id)) && !allSelected;

	const handleSelectAll = (checked: boolean) => {
		if (checked) {
			onSelectionChange(users.map((u) => u.id));
		} else {
			onSelectionChange([]);
		}
	};

	const handleSelectOne = (userId: string, checked: boolean) => {
		if (checked) {
			onSelectionChange([...selectedIds, userId]);
		} else {
			onSelectionChange(selectedIds.filter((id) => id !== userId));
		}
	};

	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead className="w-12">
						<Checkbox
							checked={allSelected}
							ref={(el) => {
								if (el) {
									(
										el as HTMLButtonElement & { indeterminate: boolean }
									).indeterminate = someSelected;
								}
							}}
							onCheckedChange={handleSelectAll}
						/>
					</TableHead>
					<TableHead>Student ID</TableHead>
					<TableHead>Name</TableHead>
					<TableHead>Email</TableHead>
					<TableHead>Role</TableHead>
					<TableHead>Study Group</TableHead>
					<TableHead>Cohorts</TableHead>
					<TableHead>Created</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{users.length === 0 ? (
					<TableRow>
						<TableCell colSpan={8} className="text-center text-muted-foreground py-8">
							No users found
						</TableCell>
					</TableRow>
				) : (
					users.map((user) => (
						<TableRow
							key={user.id}
							className="cursor-pointer"
							onClick={() => onUserClick(user)}
						>
							<TableCell onClick={(e) => e.stopPropagation()}>
								<Checkbox
									checked={selectedIds.includes(user.id)}
									onCheckedChange={(checked) =>
										handleSelectOne(user.id, !!checked)
									}
								/>
							</TableCell>
							<TableCell className="font-medium">{user.studentId ?? "—"}</TableCell>
							<TableCell className="font-medium">{user.name}</TableCell>
							<TableCell>{user.email}</TableCell>
							<TableCell>
								<Badge variant={user.role === "admin" ? "default" : "secondary"}>
									{user.role ?? "student"}
								</Badge>
							</TableCell>
							<TableCell>
								{user.studyGroup ? (
									<Badge variant="outline" className="text-xs">
										{user.studyGroup === "experiment"
											? "Experiment"
											: "Control"}
									</Badge>
								) : (
									<span className="text-muted-foreground text-xs">
										Unassigned
									</span>
								)}
							</TableCell>
							<TableCell>
								<div className="flex flex-wrap gap-1">
									{user.cohorts.length > 0 ? (
										user.cohorts.slice(0, 2).map((c) => (
											<Badge key={c.id} variant="outline" className="text-xs">
												{c.name}
											</Badge>
										))
									) : (
										<span className="text-muted-foreground text-xs">None</span>
									)}
									{user.cohorts.length > 2 && (
										<Badge variant="outline" className="text-xs">
											+{user.cohorts.length - 2}
										</Badge>
									)}
								</div>
							</TableCell>
							<TableCell>{formatDate(user.createdAt.getTime())}</TableCell>
						</TableRow>
					))
				)}
			</TableBody>
		</Table>
	);
}
