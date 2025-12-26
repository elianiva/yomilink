import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
	CalendarIcon,
	PlusIcon,
	Trash2Icon,
	UsersIcon,
	UserIcon,
	MapIcon,
} from "lucide-react";
import { Guard } from "@/components/auth/Guard";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { AssignmentRpc } from "@/server/rpc/assignment";
import { generateKit } from "@/server/rpc/kit";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/dashboard/assignments/manage")({
	component: () => (
		<Guard roles={["teacher", "admin"]}>
			<ManageAssignmentsPage />
		</Guard>
	),
});

function ManageAssignmentsPage() {
	const queryClient = useQueryClient();
	const [createDialogOpen, setCreateDialogOpen] = useState(false);

	const { data: assignments, isLoading } = useQuery(
		AssignmentRpc.listTeacherAssignments(),
	);

	const deleteMutation = useMutation({
		...AssignmentRpc.deleteAssignment(),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["assignments"] });
		},
	});

	const handleDelete = async (id: string) => {
		if (confirm("Are you sure you want to delete this assignment?")) {
			await deleteMutation.mutateAsync(id);
		}
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-semibold">Manage Assignments</h1>
					<p className="text-muted-foreground">
						Create and manage assignments for your students
					</p>
				</div>
				<Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
					<DialogTrigger asChild>
						<Button>
							<PlusIcon className="size-4 mr-2" />
							Create Assignment
						</Button>
					</DialogTrigger>
					<CreateAssignmentDialog
						onSuccess={() => {
							setCreateDialogOpen(false);
							queryClient.invalidateQueries({ queryKey: ["assignments"] });
						}}
					/>
				</Dialog>
			</div>

			{isLoading ? (
				<Skeleton className="h-full w-full" />
			) : assignments && assignments.length > 0 ? (
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{assignments.map((assignment) => (
						<div
							key={assignment.id}
							className="rounded-lg border bg-card p-4 space-y-3"
						>
							<div className="flex items-start justify-between">
								<div>
									<h3 className="font-medium">{assignment.title}</h3>
									{assignment.description && (
										<p className="text-sm text-muted-foreground line-clamp-2">
											{assignment.description}
										</p>
									)}
								</div>
								<Button
									variant="ghost"
									size="icon"
									className="text-destructive hover:text-destructive"
									onClick={() => handleDelete(assignment.id)}
								>
									<Trash2Icon className="size-4" />
								</Button>
							</div>

							<div className="flex items-center gap-4 text-sm text-muted-foreground">
								<div className="flex items-center gap-1">
									<MapIcon className="size-4" />
									<span>{assignment.goalMapTitle ?? "Unknown"}</span>
								</div>
								{assignment.startDate && (
									<div className="flex items-center gap-1">
										<CalendarIcon className="size-4" />
										<span>
											{new Date(assignment.startDate).toLocaleDateString()}
										</span>
									</div>
								)}
								{assignment.dueAt && (
									<div className="flex items-center gap-1">
										<CalendarIcon className="size-4" />
										<span>
											{new Date(assignment.dueAt).toLocaleDateString()}
										</span>
									</div>
								)}
							</div>
						</div>
					))}
				</div>
			) : (
				<div className="text-center py-12 border rounded-lg bg-card">
					<MapIcon className="size-12 mx-auto text-muted-foreground mb-4" />
					<h3 className="font-medium mb-1">No assignments yet</h3>
					<p className="text-sm text-muted-foreground mb-4">
						Create your first assignment to get started
					</p>
					<Button onClick={() => setCreateDialogOpen(true)}>
						<PlusIcon className="size-4 mr-2" />
						Create Assignment
					</Button>
				</div>
			)}
		</div>
	);
}

function CreateAssignmentDialog({ onSuccess }: { onSuccess: () => void }) {
	const [currentStep, setCurrentStep] = useState(0);
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [goalMapId, setGoalMapId] = useState("");
	const [startDate, setStartDate] = useState("");
	const [endDate, setEndDate] = useState("");
	const [selectedCohorts, setSelectedCohorts] = useState<string[]>([]);
	const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
	const [isGeneratingKit, setIsGeneratingKit] = useState(false);

	const { data: goalMaps } = useQuery(AssignmentRpc.getTeacherGoalMaps());
	const { data: cohorts } = useQuery(AssignmentRpc.getAvailableCohorts());
	const { data: users } = useQuery(AssignmentRpc.getAvailableUsers());

	const createMutation = useMutation(AssignmentRpc.createAssignment());

	const steps = [
		{
			title: "Basic Information",
			description:
				"Enter assignment title, description, and optional reading material",
		},
		{
			title: "Configuration",
			description: "Select a goal map and configure time limits",
		},
		{
			title: "Assignment",
			description: "Select cohorts or students to assign this to",
		},
	];

	const canProceedNext = () => {
		switch (currentStep) {
			case 0:
				return title.trim().length > 0;
			case 1:
				return goalMapId.length > 0;
			case 2:
				return selectedCohorts.length > 0 || selectedUsers.length > 0;
			default:
				return false;
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!title.trim() || !goalMapId) {
			return;
		}

		setIsGeneratingKit(true);
		try {
			const kitResult = await generateKit({
				data: { goalMapId, layout: "random" },
			});
			if (!kitResult.ok) {
				alert("Failed to generate kit for goal map");
				return;
			}
		} catch (error) {
			console.error("Failed to generate kit:", error);
			alert("Failed to generate kit for goal map");
			return;
		} finally {
			setIsGeneratingKit(false);
		}

		const result = await createMutation.mutateAsync({
			title: title.trim(),
			description: description.trim() || undefined,
			goalMapId,
			startDate: startDate ? new Date(startDate).getTime() : Date.now(),
			endDate: endDate ? new Date(endDate).getTime() : undefined,
			cohortIds: selectedCohorts,
			userIds: selectedUsers,
		});

		if (result.success) {
			onSuccess();
			setTitle("");
			setDescription("");
			setGoalMapId("");
			setStartDate("");
			setEndDate("");
			setSelectedCohorts([]);
			setSelectedUsers([]);
		} else {
			alert(result.error || "Failed to create assignment");
		}
	};

	const toggleCohort = (cohortId: string) => {
		setSelectedCohorts((prev) =>
			prev.includes(cohortId)
				? prev.filter((id) => id !== cohortId)
				: [...prev, cohortId],
		);
	};

	const toggleUser = (userId: string) => {
		setSelectedUsers((prev) =>
			prev.includes(userId)
				? prev.filter((id) => id !== userId)
				: [...prev, userId],
		);
	};

	const isSubmitting = createMutation.isPending || isGeneratingKit;

	return (
		<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
			<DialogHeader>
				<DialogTitle>Create New Assignment</DialogTitle>
				<DialogDescription>
					{steps[currentStep].title}: {steps[currentStep].description}
				</DialogDescription>
			</DialogHeader>

			<form onSubmit={handleSubmit} className="space-y-4">
				{currentStep === 0 && (
					<div className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="title">Title *</Label>
							<Input
								id="title"
								value={title}
								onChange={(e) => setTitle(e.target.value)}
								placeholder="e.g., Photosynthesis Concept Map"
								required
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="description">Description</Label>
							<Textarea
								id="description"
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								placeholder="Optional description for students..."
								rows={2}
							/>
						</div>
					</div>
				)}

				{currentStep === 1 && (
					<div className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="goalMap">Goal Map *</Label>
							<SearchableSelect
								value={goalMapId}
								onChange={setGoalMapId}
								options={
									goalMaps?.map((gm) => ({
										id: gm.id,
										label: gm.title,
										description: gm.description,
									})) ?? []
								}
								placeholder="Select a goal map"
								searchPlaceholder="Search goal maps..."
							/>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="startDate">Start Date</Label>
								<Input
									id="startDate"
									type="datetime-local"
									value={startDate}
									onChange={(e) => setStartDate(e.target.value)}
								/>
								<p className="text-xs text-muted-foreground">
									Default: Now (when creating)
								</p>
							</div>

							<div className="space-y-2">
								<Label htmlFor="endDate">End Date (optional)</Label>
								<Input
									id="endDate"
									type="datetime-local"
									value={endDate}
									onChange={(e) => setEndDate(e.target.value)}
								/>
								<p className="text-xs text-muted-foreground">
									No end date if not set
								</p>
							</div>
						</div>
					</div>
				)}

				{currentStep === 2 && (
					<div className="space-y-4">
						<div className="space-y-2">
							<Label className="flex items-center gap-2">
								<UsersIcon className="size-4" />
								Assign to Cohorts
							</Label>
							<div className="border rounded-lg p-3 max-h-32 overflow-y-auto">
								{cohorts && cohorts.length > 0 ? (
									<div className="space-y-2">
										{cohorts.map((cohort) => (
											<label
												key={cohort.id}
												className="flex items-center gap-2 cursor-pointer"
											>
												<input
													type="checkbox"
													checked={selectedCohorts.includes(cohort.id)}
													onChange={() => toggleCohort(cohort.id)}
													className="rounded"
												/>
												<span>{cohort.name}</span>
												<span className="text-xs text-muted-foreground">
													({cohort.memberCount} members)
												</span>
											</label>
										))}
									</div>
								) : (
									<p className="text-sm text-muted-foreground">
										No cohorts available
									</p>
								)}
							</div>
						</div>

						<div className="space-y-2">
							<Label className="flex items-center gap-2">
								<UserIcon className="size-4" />
								Assign to Individual Users
							</Label>
							<div className="border rounded-lg p-3 max-h-32 overflow-y-auto">
								{users && users.length > 0 ? (
									<div className="space-y-2">
										{users
											.filter((u) => u.role === "student")
											.map((user) => (
												<label
													key={user.id}
													className="flex items-center gap-2 cursor-pointer"
												>
													<input
														type="checkbox"
														checked={selectedUsers.includes(user.id)}
														onChange={() => toggleUser(user.id)}
														className="rounded"
													/>
													<span>{user.name}</span>
													<span className="text-xs text-muted-foreground">
														({user.email})
													</span>
												</label>
											))}
									</div>
								) : (
									<p className="text-sm text-muted-foreground">
										No students available
									</p>
								)}
							</div>
						</div>

						{selectedCohorts.length === 0 && selectedUsers.length === 0 && (
							<p className="text-sm text-amber-600">
								Please select at least one cohort or user to assign this to.
							</p>
						)}
					</div>
				)}

				<div className="space-y-2 pt-4 border-t">
					<div className="flex items-center justify-between text-xs text-muted-foreground">
						<span>
							Step {currentStep + 1} of {steps.length}
						</span>
						<span>{steps[currentStep].title}</span>
					</div>
					<Progress value={((currentStep + 1) / steps.length) * 100} />
				</div>

				<DialogFooter>
					<div className="flex gap-2 w-full justify-end">
						<Button
							type="button"
							variant="outline"
							onClick={() => setCurrentStep((prev) => prev - 1)}
							disabled={currentStep === 0}
						>
							Previous
						</Button>
						{currentStep < steps.length - 1 ? (
							<Button
								type="button"
								onClick={() => setCurrentStep((prev) => prev + 1)}
								disabled={!canProceedNext()}
							>
								Next
							</Button>
						) : (
							<Button
								type="submit"
								disabled={isSubmitting || !canProceedNext()}
							>
								{isGeneratingKit
									? "Generating Kit..."
									: createMutation.isPending
										? "Creating..."
										: "Create Assignment"}
							</Button>
						)}
					</div>
				</DialogFooter>
			</form>
		</DialogContent>
	);
}
