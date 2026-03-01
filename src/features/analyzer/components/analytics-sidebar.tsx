import { Search } from "lucide-react";
import { useMemo, useState } from "react";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useRpcQuery } from "@/hooks/use-rpc-query";
import { AnalyticsRpc } from "@/server/rpc/analytics";

import type { LearnerAnalytics } from "../lib/analytics-service";
import { AssignmentSelectContent } from "./assignment-select-content";
import { LearnerList } from "./learner-list";

function SectionTitle({ children }: { children: React.ReactNode }) {
	return (
		<div className="text-xs font-medium text-muted-foreground uppercase tracking-wide pl-0.5">
			{children}
		</div>
	);
}

function SummarySkeleton() {
	return (
		<div className="grid grid-cols-2 gap-2">
			{Array.from({ length: 4 }).map((_, i) => (
				<div key={i}>
					<Skeleton className="h-3 w-16 mb-1" />
					<Skeleton className="h-4 w-8" />
				</div>
			))}
		</div>
	);
}

function FilterSkeleton() {
	return (
		<div className="space-y-2">
			<Skeleton className="h-8 w-full" />
			<Skeleton className="h-8 w-full" />
			<div className="rounded-md border p-4">
				<Skeleton className="h-20 w-full" />
			</div>
		</div>
	);
}

interface AnalyticsSidebarProps {
	selectedAssignmentId: string | null;
	onSelectAssignment: (id: string | null) => void;
	selectedLearnerMapIds: Set<string>;
	onToggleLearner: (learnerMapId: string) => void;
	onToggleAll: (learnerMapIds: string[]) => void;
}

export function AnalyticsSidebar({
	selectedAssignmentId,
	onSelectAssignment,
	selectedLearnerMapIds,
	onToggleLearner,
	onToggleAll,
}: AnalyticsSidebarProps) {
	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<"All" | "submitted" | "draft">("All");

	const { data: assignments, isLoading: assignmentsLoading } = useRpcQuery(
		AnalyticsRpc.getTeacherAssignments(),
	);

	const { data: analyticsData, isLoading: analyticsLoading } = useRpcQuery({
		...AnalyticsRpc.getAnalyticsForAssignment(selectedAssignmentId ?? ""),
		enabled: !!selectedAssignmentId,
		refetchOnWindowFocus: false,
	});

	const filteredLearners = useMemo(() => {
		if (!analyticsData) return [];
		return analyticsData.learners.filter((learner: LearnerAnalytics) => {
			const matchesSearch =
				!searchQuery || learner.userName.toLowerCase().includes(searchQuery.toLowerCase());
			const matchesStatus = statusFilter === "All" || learner.status === statusFilter;
			return matchesSearch && matchesStatus;
		});
	}, [analyticsData, searchQuery, statusFilter]);

	const selectAllState = useMemo(() => {
		if (filteredLearners.length === 0) return { checked: false, indeterminate: false };
		if (selectedLearnerMapIds.size === 0) return { checked: false, indeterminate: false };
		if (selectedLearnerMapIds.size === filteredLearners.length)
			return { checked: true, indeterminate: false };
		return { checked: false, indeterminate: true };
	}, [filteredLearners.length, selectedLearnerMapIds.size]);

	const handleToggleAll = (checked: boolean) => {
		onToggleAll(checked ? filteredLearners.map((l: LearnerAnalytics) => l.learnerMapId) : []);
	};

	const assignmentsForSelect = useMemo(
		() =>
			Array.isArray(assignments)
				? assignments.map((a) => ({
						id: a.id,
						title: a.title,
						totalSubmissions: a.totalSubmissions ?? 0,
					}))
				: undefined,
		[assignments],
	);

	return (
		<aside className="rounded-lg border-[0.5px] bg-card">
			<div className="p-3 space-y-4">
				{/* Assignment selector */}
				<div className="space-y-2">
					<SectionTitle>Assignment</SectionTitle>
					<Select
						value={selectedAssignmentId ?? ""}
						onValueChange={(v) => onSelectAssignment(v || null)}
					>
						<SelectTrigger size="sm" className="h-8 w-full">
							<SelectValue placeholder="Select assignment" />
						</SelectTrigger>
						<SelectContent>
							<AssignmentSelectContent
								assignments={assignmentsForSelect}
								isLoading={assignmentsLoading}
							/>
						</SelectContent>
					</Select>
				</div>

				<Separator />

				{/* Summary */}
				{selectedAssignmentId && (
					<div className="space-y-2">
						<SectionTitle>Summary</SectionTitle>
						{analyticsLoading || !analyticsData ? (
							<SummarySkeleton />
						) : (
							<div className="grid grid-cols-2 gap-2 text-xs">
								<div>
									<div className="text-muted-foreground">Learners</div>
									<div className="font-semibold">
										{analyticsData.summary.totalLearners}
									</div>
								</div>
								<div>
									<div className="text-muted-foreground">Submitted</div>
									<div className="font-semibold">
										{analyticsData.summary.submittedCount}
									</div>
								</div>
								<div>
									<div className="text-muted-foreground">Avg Score</div>
									<div className="font-semibold">
										{analyticsData.summary.avgScore
											? `${analyticsData.summary.avgScore.toFixed(1)}%`
											: "N/A"}
									</div>
								</div>
								<div>
									<div className="text-muted-foreground">Drafts</div>
									<div className="font-semibold">
										{analyticsData.summary.draftCount}
									</div>
								</div>
							</div>
						)}
					</div>
				)}

				{selectedAssignmentId && <Separator />}

				{/* Learner filter */}
				{selectedAssignmentId && (
					<div className="space-y-2">
						<SectionTitle>Filter Learners</SectionTitle>

						{analyticsLoading ? (
							<FilterSkeleton />
						) : (
							<>
								<Select
									value={statusFilter}
									onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}
								>
									<SelectTrigger size="sm" className="h-8 w-full">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="All">Status: All</SelectItem>
										<SelectItem value="submitted">Submitted</SelectItem>
										<SelectItem value="draft">Draft</SelectItem>
									</SelectContent>
								</Select>

								<div className="relative">
									<Search className="absolute left-2 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
									<Input
										className="pl-8 h-8"
										placeholder="Search learner…"
										value={searchQuery}
										onChange={(e) => setSearchQuery(e.target.value)}
									/>
								</div>

								<div className="max-h-64 overflow-auto rounded-md border">
									<div className="flex items-center justify-between text-xs text-muted-foreground px-3 py-2 border-b">
										<div className="flex items-center gap-2">
											<Checkbox
												checked={selectAllState.checked}
												indeterminate={selectAllState.indeterminate}
												onCheckedChange={handleToggleAll}
											/>
											<div className="text-xs">
												{selectedLearnerMapIds.size} of{" "}
												{filteredLearners.length} selected
											</div>
										</div>
										<div>Score</div>
									</div>
									<LearnerList
										learners={filteredLearners}
										isLoading={analyticsLoading}
										selectedLearnerMapIds={selectedLearnerMapIds}
										onToggleLearner={onToggleLearner}
									/>
								</div>
							</>
						)}
					</div>
				)}
			</div>
		</aside>
	);
}
