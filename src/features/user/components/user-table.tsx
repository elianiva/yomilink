import { ChevronRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import type { UserWithCohorts } from "@/features/user/lib/user-service.shared";
import { formatDate } from "@/lib/date-utils";

type UserTableProps = {
	users: UserWithCohorts[];
	selectedIds: string[];
	onSelectionChange: (ids: string[]) => void;
	onUserClick: (user: UserWithCohorts) => void;
};

function UserCard({
	user,
	selectedIds,
	onSelectionChange,
	onUserClick,
}: {
	user: UserWithCohorts;
	selectedIds: string[];
	onSelectionChange: (ids: string[]) => void;
	onUserClick: (user: UserWithCohorts) => void;
}) {
	const handleSelectOne = (userId: string, checked: boolean) => {
		if (checked) {
			onSelectionChange([...selectedIds, userId]);
		} else {
			onSelectionChange(selectedIds.filter((id) => id !== userId));
		}
	};

	return (
		<Card className="cursor-pointer" onClick={() => onUserClick(user)}>
			<CardContent className="p-4">
				<div className="flex items-start gap-3">
					{/* eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */}
					<div onClick={(e) => e.stopPropagation()}>
						<Checkbox
							checked={selectedIds.includes(user.id)}
							onCheckedChange={(checked) => handleSelectOne(user.id, !!checked)}
						/>
					</div>
					<div className="flex-1 min-w-0 space-y-1.5">
						<div className="flex items-center gap-2">
							<span className="font-medium truncate">{user.name}</span>
							<Badge
								variant={user.role === "admin" ? "default" : "secondary"}
								className="shrink-0"
							>
								{user.role ?? "student"}
							</Badge>
						</div>
						<div className="text-xs text-muted-foreground truncate">{user.email}</div>
						<div className="flex flex-wrap gap-1 items-center text-xs text-muted-foreground">
							<span>ID: {user.studentId ?? "—"}</span>
							{user.studyGroup && (
								<Badge variant="outline" className="text-[10px] h-4 px-1">
									{user.studyGroup === "experiment" ? "Experiment" : "Control"}
								</Badge>
							)}
						</div>
						<div className="flex flex-wrap gap-1">
							{user.cohorts.length > 0 ? (
								user.cohorts.slice(0, 2).map((c) => (
									<Badge
										key={c.id}
										variant="outline"
										className="text-[10px] h-4 px-1"
									>
										{c.name}
									</Badge>
								))
							) : (
								<span className="text-xs text-muted-foreground">No cohorts</span>
							)}
							{user.cohorts.length > 2 && (
								<Badge variant="outline" className="text-[10px] h-4 px-1">
									+{user.cohorts.length - 2}
								</Badge>
							)}
						</div>
					</div>
					<ChevronRight className="size-4 text-muted-foreground shrink-0 mt-1" />
				</div>
			</CardContent>
		</Card>
	);
}

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
		<div>
			{/* Desktop table */}
			<div className="hidden md:block">
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
								<TableCell
									colSpan={8}
									className="text-center text-muted-foreground py-8"
								>
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
									<TableCell className="font-medium">
										{user.studentId ?? "—"}
									</TableCell>
									<TableCell className="font-medium">{user.name}</TableCell>
									<TableCell>{user.email}</TableCell>
									<TableCell>
										<Badge
											variant={
												user.role === "admin" ? "default" : "secondary"
											}
										>
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
													<Badge
														key={c.id}
														variant="outline"
														className="text-xs"
													>
														{c.name}
													</Badge>
												))
											) : (
												<span className="text-muted-foreground text-xs">
													None
												</span>
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
			</div>

			{/* Mobile cards */}
			<div className="md:hidden space-y-2">
				{users.length === 0 ? (
					<div className="text-center text-muted-foreground py-8">No users found</div>
				) : (
					users.map((user) => (
						<UserCard
							key={user.id}
							user={user}
							selectedIds={selectedIds}
							onSelectionChange={onSelectionChange}
							onUserClick={onUserClick}
						/>
					))
				)}
			</div>
		</div>
	);
}
