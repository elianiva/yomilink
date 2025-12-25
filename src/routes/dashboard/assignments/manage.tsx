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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { AssignmentRpc } from "@/server/rpc/assignment";
import { generateKit } from "@/server/rpc/kit";

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
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{[1, 2, 3].map((i) => (
						<div
							key={i}
							className="h-40 rounded-lg border bg-card animate-pulse"
						/>
					))}
				</div>
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
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [goalMapId, setGoalMapId] = useState("");
	const [readingMaterial, setReadingMaterial] = useState("");
	const [dueAt, setDueAt] = useState("");
	const [timeLimit, setTimeLimit] = useState("");
	const [selectedCohorts, setSelectedCohorts] = useState<string[]>([]);
	const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
	const [layout, setLayout] = useState<"preset" | "random">("preset");
	const [isGeneratingKit, setIsGeneratingKit] = useState(false);

	const { data: goalMaps } = useQuery(AssignmentRpc.getTeacherGoalMaps());
	const { data: cohorts } = useQuery(AssignmentRpc.getAvailableCohorts());
	const { data: users } = useQuery(AssignmentRpc.getAvailableUsers());

	const createMutation = useMutation(AssignmentRpc.createAssignment());

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!title.trim() || !goalMapId) {
			return;
		}

		setIsGeneratingKit(true);
		try {
			const kitResult = await generateKit({ data: { goalMapId, layout } });
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
			readingMaterial: readingMaterial.trim() || undefined,
			timeLimitMinutes: timeLimit ? parseInt(timeLimit, 10) : undefined,
			dueAt: dueAt ? new Date(dueAt).getTime() : undefined,
			cohortIds: selectedCohorts,
			userIds: selectedUsers,
		});

		if (result.success) {
			onSuccess();
			// Reset form
			setTitle("");
			setDescription("");
			setGoalMapId("");
			setDueAt("");
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
					Create an assignment from a goal map and assign it to cohorts or
					individual students.
				</DialogDescription>
			</DialogHeader>

			<form onSubmit={handleSubmit} className="space-y-4">
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

				<div className="space-y-2">
					<Label htmlFor="readingMaterial">Reading Material (optional)</Label>
					<Textarea
						id="readingMaterial"
						value={readingMaterial}
						onChange={(e) => setReadingMaterial(e.target.value)}
						placeholder="Paste reading material here for students to reference..."
						rows={6}
					/>
					<p className="text-xs text-muted-foreground">
						Students can access this material via the book icon while building
						their concept map.
					</p>
				</div>

				<div className="space-y-2">
					<Label htmlFor="goalMap">Goal Map *</Label>
					<Select value={goalMapId} onValueChange={setGoalMapId} required>
						<SelectTrigger>
							<SelectValue placeholder="Select a goal map" />
						</SelectTrigger>
						<SelectContent>
							{goalMaps?.map((gm) => (
								<SelectItem key={gm.id} value={gm.id}>
									{gm.title}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<div className="space-y-2">
					<Label htmlFor="dueAt">Due Date (optional)</Label>
					<Input
						id="dueAt"
						type="datetime-local"
						value={dueAt}
						onChange={(e) => setDueAt(e.target.value)}
					/>
				</div>

				<div className="space-y-2">
					<Label htmlFor="timeLimit">Time Limit (minutes, optional)</Label>
					<Input
						id="timeLimit"
						type="number"
						min="1"
						max="180"
						value={timeLimit}
						onChange={(e) => setTimeLimit(e.target.value)}
						placeholder="No limit"
					/>
					<p className="text-xs text-muted-foreground">
						Students will have this much time to complete the assignment.
					</p>
				</div>

				<div className="space-y-2">
					<Label htmlFor="layout">Kit Layout</Label>
					<Select
						value={layout}
						onValueChange={(v) => setLayout(v as "preset" | "random")}
					>
						<SelectTrigger>
							<SelectValue placeholder="Select layout" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="preset">
								<div className="flex flex-col">
									<span>Preset Layout</span>
									<span className="text-xs text-muted-foreground">
										All students see the same arrangement
									</span>
								</div>
							</SelectItem>
							<SelectItem value="random">
								<div className="flex flex-col">
									<span>Random Layout</span>
									<span className="text-xs text-muted-foreground">
										Each student gets a unique shuffled arrangement
									</span>
								</div>
							</SelectItem>
						</SelectContent>
					</Select>
				</div>

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

				<DialogFooter>
					<Button
						type="submit"
						disabled={
							isSubmitting ||
							!title.trim() ||
							!goalMapId ||
							(selectedCohorts.length === 0 && selectedUsers.length === 0)
						}
					>
						{isGeneratingKit
							? "Generating Kit..."
							: createMutation.isPending
								? "Creating..."
								: "Create Assignment"}
					</Button>
				</DialogFooter>
			</form>
		</DialogContent>
	);
}
