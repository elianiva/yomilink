import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { Guard } from "@/components/auth/Guard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BulkCohortDialog } from "@/components/users/bulk-cohort-dialog";
import { UserDetailSheet } from "@/components/users/user-detail-sheet";
import { UserFilterBar } from "@/components/users/user-filter-bar";
import { UserTable } from "@/components/users/user-table";
import { WhitelistPanel } from "@/components/users/whitelist-panel";
import type { UserFilterInput, UserWithCohorts } from "@/features/user/lib/user-service.shared";
import { useRpcMutation, useRpcQuery } from "@/hooks/use-rpc-query";
import { AssignmentRpc } from "@/server/rpc/assignment";
import { ProfileRpc } from "@/server/rpc/profile";
import { UserRpc } from "@/server/rpc/user";

export const Route = createFileRoute("/dashboard/users/")({
	component: () => (
		<Guard roles={["teacher", "admin"]}>
			<UsersPage />
		</Guard>
	),
});

function UsersPage() {
	const queryClient = useQueryClient();

	const { data: me } = useRpcQuery(ProfileRpc.getMe());
	const isAdmin = me?.role === "admin";
	const currentUserId = me?.id ?? "";

	const [filters, setFilters] = useState<Partial<UserFilterInput>>({
		page: 1,
		pageSize: 20,
	});

	const [selectedIds, setSelectedIds] = useState<string[]>([]);

	const [selectedUser, setSelectedUser] = useState<UserWithCohorts | null>(null);
	const [sheetOpen, setSheetOpen] = useState(false);

	const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
	const [bulkAction, setBulkAction] = useState<"assign" | "ban">("assign");

	const { data: usersResult, isLoading } = useRpcQuery(UserRpc.listUsers(filters));
	const { data: cohortsData } = useRpcQuery(AssignmentRpc.getAvailableCohorts());

	const cohorts = cohortsData ?? [];
	const users = usersResult?.users ?? [];
	const total = usersResult?.total ?? 0;
	const page = usersResult?.page ?? 1;
	const totalPages = usersResult?.totalPages ?? 1;

	const updateMutation = useRpcMutation(UserRpc.updateUser(), {
		operation: "update user",
		showSuccess: true,
		successMessage: "User updated successfully",
	});

	const roleMutation = useRpcMutation(UserRpc.updateUserRole(), {
		operation: "update role",
		showSuccess: true,
		successMessage: "Role updated successfully",
	});

	const banMutation = useRpcMutation(UserRpc.banUser(), {
		operation: "ban user",
		showSuccess: true,
		successMessage: "User banned successfully",
	});

	const unbanMutation = useRpcMutation(UserRpc.unbanUser(), {
		operation: "unban user",
		showSuccess: true,
		successMessage: "User unbanned successfully",
	});

	const bulkCohortMutation = useRpcMutation(UserRpc.bulkAssignCohort(), {
		operation: "bulk assign cohort",
		showSuccess: true,
		successMessage: "Cohort assignment updated",
	});

	const passwordResetMutation = useRpcMutation(UserRpc.triggerPasswordReset(), {
		operation: "password reset",
		showSuccess: true,
	});

	const invalidateUsers = () => {
		void queryClient.invalidateQueries({ queryKey: UserRpc.users() });
	};

	const handleUserClick = (user: UserWithCohorts) => {
		setSelectedUser(user);
		setSheetOpen(true);
	};

	const handleSave = (
		userId: string,
		data: Parameters<typeof updateMutation.mutate>[0]["data"],
	) => {
		updateMutation.mutate(
			{ userId, data },
			{
				onSuccess: () => {
					invalidateUsers();
					setSheetOpen(false);
				},
			},
		);
	};

	const handleRoleChange = (userId: string, role: string) => {
		roleMutation.mutate(
			{ userId, role: role as "student" | "teacher" | "admin" },
			{ onSuccess: invalidateUsers },
		);
	};

	const handleBan = (userId: string, reason: string) => {
		banMutation.mutate({ userId, reason }, { onSuccess: invalidateUsers });
	};

	const handleUnban = (userId: string) => {
		unbanMutation.mutate({ userId }, { onSuccess: invalidateUsers });
	};

	const handlePasswordReset = (userId: string) => {
		passwordResetMutation.mutate(
			{ userId },
			{
				onSuccess: (result) => {
					if (result.success && result.data) {
						toast.success("Password reset link generated", {
							description: `Reset token: ${result.data.resetToken}`,
						});
					}
				},
			},
		);
	};

	const handleBulkAction = (action: "assign" | "ban") => {
		setBulkAction(action);
		setBulkDialogOpen(true);
	};

	const handleBulkCohortConfirm = (cohortId: string, action: "add" | "remove") => {
		bulkCohortMutation.mutate(
			{ userIds: selectedIds, cohortId, action },
			{
				onSuccess: () => {
					invalidateUsers();
					setSelectedIds([]);
				},
			},
		);
	};

	const handlePageChange = (newPage: number) => {
		setFilters({ ...filters, page: newPage });
		setSelectedIds([]);
	};

	return (
		<Tabs defaultValue="users" className="space-y-6">
			<TabsList className="grid w-full max-w-sm grid-cols-2">
				<TabsTrigger value="users">Users</TabsTrigger>
				<TabsTrigger value="whitelist">Whitelist</TabsTrigger>
			</TabsList>
			<TabsContent value="users" className="space-y-6">
				<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-semibold">Users</h1>
				<p className="text-muted-foreground">Manage user accounts and permissions</p>
			</div>

			<UserFilterBar
				cohorts={cohorts}
				filters={filters}
				onFiltersChange={setFilters}
				onBulkAction={handleBulkAction}
				selectedCount={selectedIds.length}
				isAdmin={isAdmin}
			/>

			{isLoading ? (
				<Skeleton className="h-96 w-full" />
			) : (
				<>
					<UserTable
						users={users}
						selectedIds={selectedIds}
						onSelectionChange={setSelectedIds}
						onUserClick={handleUserClick}
					/>

					{totalPages > 1 && (
						<div className="flex items-center justify-between">
							<p className="text-sm text-muted-foreground">
								Showing {users.length} of {total} users
							</p>
							<div className="flex items-center gap-2">
								<Button
									variant="outline"
									size="sm"
									disabled={page <= 1}
									onClick={() => handlePageChange(page - 1)}
								>
									Previous
								</Button>
								<span className="text-sm">
									Page {page} of {totalPages}
								</span>
								<Button
									variant="outline"
									size="sm"
									disabled={page >= totalPages}
									onClick={() => handlePageChange(page + 1)}
								>
									Next
								</Button>
							</div>
						</div>
					)}
				</>
			)}

			<UserDetailSheet
				user={selectedUser}
				open={sheetOpen}
				onOpenChange={setSheetOpen}
				onSave={handleSave}
				onBan={handleBan}
				onUnban={handleUnban}
				onRoleChange={handleRoleChange}
				onPasswordReset={handlePasswordReset}
				isAdmin={isAdmin}
				currentUserId={currentUserId}
				isSaving={updateMutation.isPending}
			/>

			<BulkCohortDialog
				open={bulkDialogOpen && bulkAction === "assign"}
				onOpenChange={setBulkDialogOpen}
				cohorts={cohorts}
				selectedCount={selectedIds.length}
				onConfirm={handleBulkCohortConfirm}
				isLoading={bulkCohortMutation.isPending}
			/>
				</div>
			</TabsContent>
			<TabsContent value="whitelist">
				<WhitelistPanel />
			</TabsContent>
		</Tabs>
	);
}
