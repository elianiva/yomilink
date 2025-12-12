import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Edit, ExternalLink, Loader2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AuthUser } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { GoalMapRpc, type Topic } from "@/server/rpc/goal-map";
import { ProfileRpc } from "@/server/rpc/profile";
import { Skeleton } from "@/components/ui/skeleton";

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

function DashboardHome() {
	const [searchTerm, setSearchTerm] = useState("");
	const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
	const [goalMapToDelete, setGoalMapToDelete] = useState<string | null>(null);
	const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);

	const {
		data: topics = [],
		isLoading: topicsLoading,
		error: topicsError,
	} = useQuery(GoalMapRpc.listTopics());

	const {
		data: goalMaps = [],
		isLoading: goalMapsLoading,
		error: goalMapsError,
	} = useQuery(GoalMapRpc.listGoalMapsByTopic({ topicId: selectedTopic?.id }));

	const deleteMutation = useMutation(GoalMapRpc.deleteGoalMap());

	const isLoading = topicsLoading || goalMapsLoading;
	const error = topicsError || goalMapsError;

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
		<main className="w-full h-full overflow-hidden flex flex-col">
			<div className="flex items-center gap-4 pb-4 border-b mb-4">
				<div className="flex-1">
					<Label htmlFor="search" className="sr-only">
						Search goal maps
					</Label>
					<Input
						id="search"
						placeholder="Search goal maps..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className="max-w-sm"
					/>
				</div>
				<Button asChild>
					<Link to="/dashboard">
						<Plus className="mr-2 h-4 w-4" />
						New Goal Map
					</Link>
				</Button>
			</div>
			<div className="flex-1 overflow-hidden flex items-stretch gap-4">
				<div className="w-1/3 border rounded-lg p-4 overflow-y-auto">
					<div className="flex items-center justify-between mb-3">
						<h3 className="font-medium">Topics</h3>
						<Button size="sm" variant="outline">
							<Plus className="size-4" />
							New Topic
						</Button>
					</div>
					<div className="space-y-px">
						{topics.map((topic) => (
							<Button
								key={topic.id}
								onClick={() => setSelectedTopic(topic)}
								className={cn(
									"w-full block text-left shadow-none border-none rounded-lg not-last:border-b hover:bg-primary/20 bg-transparent text-foreground duration-50",
									selectedTopic?.id === topic.id
										? "bg-primary hover:bg-primary text-white"
										: "",
								)}
							>
								{topic.title}
							</Button>
						))}
					</div>
				</div>
				<div className="flex-1 border rounded-lg p-4 overflow-y-auto">
					<div className="flex items-center justify-between mb-3">
						<h3 className="font-semibold">
							{selectedTopic
								? `Goal Maps for ${selectedTopic.title}`
								: "Goal Maps"}
						</h3>
					</div>
					{isLoading ? (
						<div className="space-y-3">
							{Array(5)
								.fill(0)
								.map((_, i) => (
									<Skeleton
										// biome-ignore lint/suspicious/noArrayIndexKey: idc
										key={i}
										className="w-full h-20"
										style={{
											opacity: 1 - i * 0.2,
										}}
									/>
								))}
						</div>
					) : error ? (
						<div className="text-center py-8 text-destructive">
							Failed to load goal maps. Please try again.
						</div>
					) : goalMaps.length === 0 ? (
						<div className="text-center py-8 text-muted-foreground">
							{searchTerm
								? "No goal maps found matching your search."
								: selectedTopic
									? "No goal maps found for this topic."
									: "Select a topic to see goal maps."}
						</div>
					) : (
						<div className="grid gap-3">
							{goalMaps.map((goalMap) => (
								<div
									key={goalMap.goalMapId}
									className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
								>
									<div className="flex-1 min-w-0">
										<h3 className="font-semibold truncate">{goalMap.title}</h3>
										{goalMap.description && (
											<p className="text-sm text-muted-foreground mt-1 line-clamp-2">
												{goalMap.description}
											</p>
										)}
									</div>

									<div className="flex items-center">
										<Button asChild variant="ghost" size="icon">
											<Link
												to="/dashboard/goal/$goalMapId"
												params={{ goalMapId: goalMap.goalMapId }}
											>
												<Edit className="h-4 w-4" />
											</Link>
										</Button>
										<Button asChild variant="ghost" size="icon">
											<Link
												to="/dashboard/kit/$kitId"
												params={{ kitId: goalMap.goalMapId }}
											>
												<ExternalLink className="h-4 w-4" />
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
													variant="ghost"
													size="icon"
													onClick={() => handleDelete(goalMap.goalMapId)}
													disabled={deleteMutation.isPending}
												>
													<Trash2 className="h-4 w-4" />
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
							))}
						</div>
					)}
				</div>
			</div>
		</main>
	);
}
