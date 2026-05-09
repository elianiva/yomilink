import { Link, createFileRoute } from "@tanstack/react-router";
import { MapIcon, Plus } from "lucide-react";
import { useMemo, useState } from "react";

import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { NewTopicDialog } from "@/features/analyzer/components/new-topic-dialog";
import type { Topic } from "@/features/analyzer/lib/topic-service";
import { Guard } from "@/features/auth/components/Guard";
import { GoalMapCard } from "@/features/goal-map/components/goal-map-card";
import { useRpcMutation, useRpcQuery } from "@/hooks/use-rpc-query";
import { cn } from "@/lib/utils";
import { GoalMapRpc } from "@/server/rpc/goal-map";
import { TopicRpc } from "@/server/rpc/topic";

export const Route = createFileRoute("/dashboard/")({
	component: () => (
		<Guard roles={["teacher", "admin"]} redirectTo="/dashboard/assignments">
			<DashboardHome />
		</Guard>
	),
});

function DashboardHome() {
	const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
	const [goalMapToDelete, setGoalMapToDelete] = useState<string | null>(null);
	const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);

	const {
		data: topicsData,
		isLoading: topicsLoading,
		rpcError: topicsError,
	} = useRpcQuery(TopicRpc.listTopics());

	const topics = useMemo(() => {
		if (Array.isArray(topicsData)) return topicsData;
		return [];
	}, [topicsData]);

	const {
		data: goalMapsData,
		isLoading: goalMapsLoading,
		rpcError: goalMapsError,
	} = useRpcQuery(GoalMapRpc.listGoalMapsByTopic({ topicId: selectedTopic?.id }));

	const goalMaps = useMemo(() => {
		if (Array.isArray(goalMapsData)) return goalMapsData;
		return [];
	}, [goalMapsData]);

	const deleteMutation = useRpcMutation(GoalMapRpc.deleteGoalMap(), {
		operation: "delete goal map",
		showSuccess: true,
		successMessage: "Goal map deleted successfully",
	});

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
		<div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-0 h-full overflow-hidden border-t-[0.5px] bg-card -mx-6">
			{/* Topic sidebar */}
			<div className="overflow-y-auto p-4 border-r border-border/50">
				<div className="flex items-center justify-between mb-3">
					<h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
						Topics
					</h3>
					<NewTopicDialog />
				</div>
				<div className="space-y-px">
					{isLoading
						? Array.from({ length: 6 }).map((_, i) => (
								<div key={i} className="px-4 py-3">
									<Skeleton className="h-4 w-3/4 mb-1.5" />
									<Skeleton className="h-3 w-1/2" />
								</div>
							))
						: topics.map((topic) => (
								<button
									type="button"
									key={topic.id}
									onClick={() => setSelectedTopic(topic)}
									className={cn(
										"cursor-pointer interactive w-full text-left px-4 py-2 rounded-lg hover:bg-primary/20 bg-transparent text-foreground",
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

			{/* Goal maps area */}
			<div className="overflow-y-auto p-4">
				<div className="mb-4">
					<div className="flex items-center justify-between">
						<h3 className="font-medium">
							{selectedTopic ? `Goal Maps for ${selectedTopic.title}` : "Goal Maps"}
						</h3>
						<Button asChild size="sm" className="interactive-sm">
							<Link
								to="/dashboard/goal-map/$goalMapId"
								params={{ goalMapId: "new" }}
								preload="intent"
							>
								<Plus className="mr-2 size-4" />
								New Goal Map
							</Link>
						</Button>
					</div>
					{selectedTopic?.description && (
						<p className="text-sm text-muted-foreground mt-1">
							{selectedTopic.description}
						</p>
					)}
				</div>
				{isLoading ? (
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{Array.from({ length: 4 }).map((_, i) => (
							<Skeleton
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
				) : goalMaps.length === 0 ? (
					<EmptyState
						icon={MapIcon}
						title={selectedTopic ? "No goal maps found" : "Select a topic"}
						description={
							selectedTopic
								? `No goal maps exist for "${selectedTopic.title}" yet. Create one to get started.`
								: "Choose a topic from the sidebar to see its goal maps."
						}
						action={
							selectedTopic && (
								<Button asChild size="sm">
									<Link
										to="/dashboard/goal-map/$goalMapId"
										params={{ goalMapId: "new" }}
									>
										<Plus className="mr-2 size-4" />
										Create Goal Map
									</Link>
								</Button>
							)
						}
					/>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{goalMaps.map((goalMap) => (
							<GoalMapCard
								key={goalMap.id}
								goalMap={goalMap}
								isDeleteConfirmOpen={
									deleteConfirmOpen && goalMapToDelete === goalMap.id
								}
								isDeleting={deleteMutation.isPending}
								onDeleteClick={handleDelete}
								onConfirmDelete={confirmDelete}
							/>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
