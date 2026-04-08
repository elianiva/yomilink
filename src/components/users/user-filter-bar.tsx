import { SearchIcon } from "lucide-react";
import { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { UserFilterInput } from "@/features/user/lib/user-service.shared";

type Cohort = { id: string; name: string };

type UserFilterBarProps = {
	cohorts: Cohort[];
	filters: Partial<UserFilterInput>;
	onFiltersChange: (filters: Partial<UserFilterInput>) => void;
	onBulkAction: (action: "assign" | "ban") => void;
	selectedCount: number;
	isAdmin: boolean;
};

export function UserFilterBar({
	cohorts,
	filters,
	onFiltersChange,
	onBulkAction,
	selectedCount,
	isAdmin,
}: UserFilterBarProps) {
	const [search, setSearch] = useState(filters.search ?? "");

	// Debounce search
	useEffect(() => {
		const timer = setTimeout(() => {
			if (search !== (filters.search ?? "")) {
				onFiltersChange({ ...filters, search: search || undefined, page: 1 });
			}
		}, 300);
		return () => clearTimeout(timer);
	}, [search, filters, onFiltersChange]);

	const handleRoleChange = (role: string) => {
		onFiltersChange({
			...filters,
			role: role === "all" ? undefined : (role as UserFilterInput["role"]),
			page: 1,
		});
	};

	const handleCohortChange = (cohortId: string) => {
		onFiltersChange({
			...filters,
			cohortId: cohortId === "all" ? undefined : cohortId,
			page: 1,
		});
	};

	return (
		<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
			<div className="flex flex-1 items-center gap-2">
				<div className="relative flex-1 max-w-sm">
					<SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						placeholder="Search by name or email..."
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						className="pl-9"
					/>
				</div>
				<Select value={filters.role ?? "all"} onValueChange={handleRoleChange}>
					<SelectTrigger className="w-28">
						<SelectValue placeholder="Role" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All Roles</SelectItem>
						<SelectItem value="student">Student</SelectItem>
						<SelectItem value="teacher">Teacher</SelectItem>
						<SelectItem value="admin">Admin</SelectItem>
					</SelectContent>
				</Select>
				<Select value={filters.cohortId ?? "all"} onValueChange={handleCohortChange}>
					<SelectTrigger className="w-36">
						<SelectValue placeholder="Cohort" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All Cohorts</SelectItem>
						{cohorts.map((c) => (
							<SelectItem key={c.id} value={c.id}>
								{c.name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
			{selectedCount > 0 && (
				<div className="flex items-center gap-2">
					<span className="text-sm text-muted-foreground">{selectedCount} selected</span>
					<Button variant="outline" size="sm" onClick={() => onBulkAction("assign")}>
						Assign to Cohort
					</Button>
					{isAdmin && (
						<Button variant="destructive" size="sm" onClick={() => onBulkAction("ban")}>
							Ban Selected
						</Button>
					)}
				</div>
			)}
		</div>
	);
}
