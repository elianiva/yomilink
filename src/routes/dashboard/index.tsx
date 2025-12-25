import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Schema } from "effect";
import {
	Circle,
	Edit,
	GitFork,
	Loader2,
	Plus,
	CheckCircle,
	Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { TourWrapper } from "@/components/ui/tour-wrapper";
import { DASHBOARD_TOUR } from "@/lib/tours";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import type { AuthUser } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { GoalMapRpc } from "@/server/rpc/goal-map";
import { ProfileRpc } from "@/server/rpc/profile";
import { type Topic, TopicRpc } from "@/server/rpc/topic";

export const Route = createFileRoute("/dashboard/")({
	component: DashboardHome,
	loader: async ({ context }) => {
		context.queryClient.setQueryData<typeof AuthUser.Type>(ProfileRpc.me(), {
			id: context.id,
			role: context.role,
			email: context.email,
			name: context.name,
			image: context.image,
		});
	},
});

/**
 * Format a date as relative time (e.g., "2h ago", "Yesterday", "3 days ago")
 */
function formatRelativeTime(date: Date | string | null | undefined): string {
	if (!date) return "";

	const now = new Date();
	const then = new Date(date);
	const diffMs = now.getTime() - then.getTime();
	const diffSecs = Math.floor(diffMs / 1000);
	const diffMins = Math.floor(diffSecs / 60);
	const diffHours = Math.floor(diffMins / 60);
	const diffDays = Math.floor(diffHours / 24);

	if (diffSecs < 60) return "Just now";
	if (diffMins < 60) return `${diffMins}m ago`;
	if (diffHours < 24) return `${diffHours}h ago`;
	if (diffDays === 1) return "Yesterday";
	if (diffDays < 7) return `${diffDays} days ago`;
	if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;

	return then.toLocaleDateString();
}

/**
 * Parse nodes/edges JSON and return counts
 */
function parseGoalMapStats(nodes: unknown, edges: unknown) {
	let nodeCount = 0;
	let edgeCount = 0;

	try {
		const parsedNodes = typeof nodes === "string" ? JSON.parse(nodes) : nodes;
		const parsedEdges = typeof edges === "string" ? JSON.parse(edges) : edges;

		if (Array.isArray(parsedNodes)) {
			nodeCount = parsedNodes.length;
		}
		if (Array.isArray(parsedEdges)) {
			edgeCount = parsedEdges.length;
		}
	} catch {
		// Ignore parse errors
	}

	return { nodeCount, edgeCount };
}

function DashboardHome() {
	const [searchTerm, setSearchTerm] = useState("");
	const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
	const [goalMapToDelete, setGoalMapToDelete] = useState<string | null>(null);
	const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);

	const {
		data: topics = [],
		isLoading: topicsLoading,
		error: topicsError,
	} = useQuery(TopicRpc.listTopics());

	const {
		data: goalMaps = [],
		isLoading: goalMapsLoading,
		error: goalMapsError,
	} = useQuery(GoalMapRpc.listGoalMapsByTopic({ topicId: selectedTopic?.id }));

	const deleteMutation = useMutation(GoalMapRpc.deleteGoalMap());

	const isLoading = topicsLoading || goalMapsLoading;
	const error = topicsError || goalMapsError;

	// Filter goal maps by search term
	const filteredGoalMaps = useMemo(() => {
		if (!searchTerm.trim()) return goalMaps;
		const query = searchTerm.toLowerCase();
		return goalMaps.filter(
			(gm) =>
				gm.title.toLowerCase().includes(query) ||
				gm.description?.toLowerCase().includes(query),
		);
	}, [goalMaps, searchTerm]);

	const handleDelete = (goalMapId: string) => {
		setGoalMapToDelete(goalMapId);
		setDeleteConfirmOpen(true);
	};

	const confirmDelete = () => {
		if (goalMapToDelete) {
			deleteMutation.mutate({ goalMapId: goalMapToDelete });
		}
	};

	return (
		<main className="w-full h-full flex flex-col">
			<div className="flex items-center gap-4 mb-4">
				<div className="flex-1">
					<Label htmlFor="search" className="sr-only">
						Search goal maps
					</Label>
					<Input
						id="search"
						placeholder="Search goal maps..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className="max-w-sm border-none shadow-none bg-white"
					/>
				</div>
				<Button asChild data-tour-step="new-goal-map-btn">
					<Link
						to="/dashboard/goal-map/$goalMapId"
						params={{ goalMapId: "new" }}
					>
						<Plus className="mr-2 h-4 w-4" />
						New Goal Map
					</Link>
				</Button>
			</div>
			<div className="flex-1 overflow-hidden flex items-stretch gap-4">
				<div
					className="w-1/3 bg-white rounded-lg p-4 overflow-y-auto"
					data-tour-step="topics-sidebar"
				>
					<div className="flex items-center justify-between mb-3">
						<h3 className="font-medium">Topics</h3>
						<NewTopicDialog />
					</div>
					<div className="space-y-px">
						{topics.map((topic) => (
							<button
								type="button"
								key={topic.id}
								onClick={() => setSelectedTopic(topic)}
								className={cn(
									"cursor-pointer w-full text-left px-4 py-2 rounded-lg hover:bg-primary/20 bg-transparent text-foreground duration-50",
									selectedTopic?.id === topic.id
										? "bg-primary hover:bg-primary text-white"
										: "",
								)}
							>
								<span className="font-medium">{topic.title}</span>
								{topic.description && (
									<p
										className={cn(
											"text-sm mt-0.5 line-clamp-1",
											selectedTopic?.id === topic.id
												? "text-white/70"
												: "text-muted-foreground",
										)}
									>
										{topic.description}
									</p>
								)}
							</button>
						))}
					</div>
				</div>
				<div
					className="flex-1 bg-white rounded-lg p-4 overflow-y-auto"
					data-tour-step="goal-map-cards"
				>
					<div className="mb-4">
						<div className="flex items-center justify-between">
							<h3 className="font-semibold">
								{selectedTopic
									? `Goal Maps for ${selectedTopic.title}`
									: "Goal Maps"}
							</h3>
						</div>
						{selectedTopic?.description && (
							<p className="text-sm text-muted-foreground mt-1">
								{selectedTopic.description}
							</p>
						)}
					</div>
					{isLoading ? (
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							{Array(4)
								.fill(0)
								.map((_, i) => (
									<Skeleton
										// biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholders
										key={i}
										className="w-full h-32 rounded-xl"
										style={{
											opacity: 1 - i * 0.15,
										}}
									/>
								))}
						</div>
					) : error ? (
						<div className="text-center py-8 text-destructive">
							Failed to load goal maps. Please try again.
						</div>
					) : filteredGoalMaps.length === 0 ? (
						<div className="text-center py-8 text-muted-foreground">
							{searchTerm
								? "No goal maps found matching your search."
								: selectedTopic
									? "No goal maps found for this topic."
									: "Select a topic to see goal maps."}
						</div>
					) : (
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							{filteredGoalMaps.map((goalMap) => {
								const { nodeCount, edgeCount } = parseGoalMapStats(
									goalMap.nodes,
									goalMap.edges,
								);

								return (
									<div
										key={goalMap.goalMapId}
										className="group relative flex flex-col p-4 bg-card border rounded-xl hover:border-primary/30 hover:shadow-md transition-all duration-200"
									>
										{/* Card content */}
										<div className="flex-1 min-w-0">
											<h3 className="font-semibold truncate text-base">
												{goalMap.title}
											</h3>
											{goalMap.description && (
												<p className="text-sm text-muted-foreground mt-1 line-clamp-2">
													{goalMap.description}
												</p>
											)}
										</div>

										{/* Metadata row */}
										<div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
											<span className="inline-flex items-center gap-1">
												<Circle className="size-3" aria-hidden="true" />
												{nodeCount} concept{nodeCount !== 1 ? "s" : ""}
											</span>
											<span className="inline-flex items-center gap-1">
												<GitFork className="size-3" aria-hidden="true" />
												{edgeCount} link{edgeCount !== 1 ? "s" : ""}
											</span>
											{goalMap.kitId && (
												<span className="inline-flex items-center gap-1 text-green-600">
													<CheckCircle className="size-3" aria-hidden="true" />
													Kit ready
												</span>
											)}
											{goalMap.updatedAt && (
												<span className="ml-auto">
													{formatRelativeTime(goalMap.updatedAt)}
												</span>
											)}
										</div>

										{/* Action buttons - visible on hover */}
										<div
											className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
											data-tour-step="goal-map-actions"
										>
											<Button
												asChild
												variant="secondary"
												size="icon"
												className="size-8"
											>
												<Link
													to="/dashboard/goal-map/$goalMapId"
													params={{ goalMapId: goalMap.goalMapId }}
												>
													<Edit className="size-4" />
													<span className="sr-only">Edit</span>
												</Link>
											</Button>
											<AlertDialog
												open={
													deleteConfirmOpen &&
													goalMapToDelete === goalMap.goalMapId
												}
											>
												<AlertDialogTrigger asChild>
													<Button
														variant="secondary"
														size="icon"
														className="size-8"
														onClick={() => handleDelete(goalMap.goalMapId)}
														disabled={deleteMutation.isPending}
													>
														<Trash2 className="size-4" />
														<span className="sr-only">Delete</span>
													</Button>
												</AlertDialogTrigger>
												<AlertDialogContent>
													<AlertDialogHeader>
														<AlertDialogTitle>Delete Goal Map</AlertDialogTitle>
														<AlertDialogDescription>
															Are you sure you want to delete "{goalMap.title}"?
															This action cannot be undone.
														</AlertDialogDescription>
													</AlertDialogHeader>
													<AlertDialogFooter>
														<AlertDialogCancel asChild>
															<Button
																variant="outline"
																disabled={deleteMutation.isPending}
															>
																Cancel
															</Button>
														</AlertDialogCancel>
														<AlertDialogAction asChild>
															<Button
																variant="destructive"
																onClick={confirmDelete}
																disabled={deleteMutation.isPending}
															>
																{deleteMutation.isPending ? (
																	<>
																		<Loader2 className="mr-2 h-4 w-4 animate-spin" />
																		Deleting...
																	</>
																) : (
																	"Delete"
																)}
															</Button>
														</AlertDialogAction>
													</AlertDialogFooter>
												</AlertDialogContent>
											</AlertDialog>
										</div>
									</div>
								);
							})}
						</div>
					)}
				</div>
			</div>
			<TourWrapper tourConfig={DASHBOARD_TOUR} />
		</main>
	);
}

const TopicSchema = Schema.Struct({
	title: Schema.String.pipe(Schema.minLength(4)),
	description: Schema.String.pipe(Schema.minLength(4)),
});

function NewTopicDialog() {
	const [isOpen, setIsOpen] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const { mutate: createTopic, isPending } = useMutation(
		TopicRpc.createTopic(),
	);

	const form = useForm({
		defaultValues: {
			title: "",
			description: "",
		},
		validators: {
			onSubmit: Schema.standardSchemaV1(TopicSchema),
		},
		onSubmit: async ({ value }) => {
			setError(null);
			createTopic(
				{
					title: value.title,
					description: value.description,
				},
				{
					onSuccess: () => {
						setIsOpen(false);
						form.reset();
					},
					onError: () => setError("Failed to create topic"),
				},
			);
		},
	});

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>
				<Button size="sm" variant="outline">
					<Plus className="size-4" />
					New Topic
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-[425px]">
				<form
					onSubmit={(e) => {
						e.preventDefault();
						e.stopPropagation();
						form.handleSubmit();
					}}
				>
					<DialogHeader>
						<DialogTitle>Create New Topic</DialogTitle>
						<DialogDescription>
							Make sure the topic name is easily recognizable and descriptive.
						</DialogDescription>
					</DialogHeader>
					<div className="grid gap-4 py-4">
						<form.Field name="title">
							{(field) => (
								<div className="grid gap-2">
									<Label htmlFor="topic-title">Title</Label>
									<Input
										id="topic-title"
										placeholder="Topic title"
										value={field.state.value}
										onChange={(e) => field.handleChange(e.target.value)}
										onBlur={field.handleBlur}
									/>
									{field.state.meta.errors.length > 0 && (
										<p className="text-sm text-destructive">
											{field.state.meta.errors[0]?.message}
										</p>
									)}
								</div>
							)}
						</form.Field>
						<form.Field name="description">
							{(field) => (
								<div className="grid gap-2">
									<Label htmlFor="topic-description">Description</Label>
									<Input
										id="topic-description"
										placeholder="Topic description"
										value={field.state.value}
										onChange={(e) => field.handleChange(e.target.value)}
										onBlur={field.handleBlur}
									/>
									{field.state.meta.errors.length > 0 && (
										<p className="text-sm text-destructive">
											{field.state.meta.errors[0]?.message}
										</p>
									)}
								</div>
							)}
						</form.Field>
						{error && <p className="text-sm text-destructive">{error}</p>}
					</div>
					<DialogFooter>
						<DialogClose asChild>
							<Button type="button" variant="outline" disabled={isPending}>
								Cancel
							</Button>
						</DialogClose>
						<Button type="submit" disabled={isPending}>
							{isPending ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Creating...
								</>
							) : (
								"Create"
							)}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
