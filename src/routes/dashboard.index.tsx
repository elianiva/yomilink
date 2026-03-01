import { Link, createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { NewTopicDialog } from "@/features/analyzer/components/new-topic-dialog";
import type { Topic } from "@/features/analyzer/lib/topic-service";
import { GoalMapCard } from "@/features/goal-map/components/goal-map-card";
import { useRpcMutation, useRpcQuery } from "@/hooks/use-rpc-query";
import { cn } from "@/lib/utils";
import { GoalMapRpc } from "@/server/rpc/goal-map";
import { TopicRpc } from "@/server/rpc/topic";

export const Route = createFileRoute("/dashboard/")({
	component: DashboardHome,
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

	// Ensure topics is always an array
	const topics = useMemo(() => {
		if (Array.isArray(topicsData)) return topicsData;
		return [];
	}, [topicsData]);

	const {
		data: goalMapsData,
		isLoading: goalMapsLoading,
		rpcError: goalMapsError,
	} = useRpcQuery(GoalMapRpc.listGoalMapsByTopic({ topicId: selectedTopic?.id }));

	// Ensure goal maps is always an array
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
		<main className="w-full h-full flex flex-col">
			<div className="flex-1 overflow-hidden flex items-stretch gap-4">
				<div className="w-1/3 bg-white rounded-lg p-4 overflow-y-auto border-[0.5px]">
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
				<div className="flex-1 bg-white rounded-lg p-4 overflow-y-auto border-[0.5px]">
					<div className="mb-4">
						<div className="flex items-center justify-between">
							<h3 className="font-medium">
								{selectedTopic
									? `Goal Maps for ${selectedTopic.title}`
									: "Goal Maps"}
							</h3>
							<Button asChild size="sm">
								<Link
									to="/dashboard/goal-map/$goalMapId"
									params={{ goalMapId: "new" }}
									preload="intent"
								>
									<Plus className="mr-2 h-4 w-4" />
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
							{Array(4)
								.fill(0)
								.map((_, i) => (
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
						<div className="text-center py-8 text-muted-foreground">
							{selectedTopic
								? "No goal maps found for this topic."
								: "Select a topic to see goal maps."}
						</div>
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
		</main>
	);
}
