import { Skeleton } from "@/components/ui/skeleton";

export interface DetailPageSkeletonProps {
	showTabs?: boolean;
	tabCount?: number;
}

export function DetailPageSkeleton({ showTabs = true, tabCount = 4 }: DetailPageSkeletonProps) {
	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-start gap-4">
				<Skeleton className="h-10 w-10 rounded-lg" />
				<div className="flex-1 space-y-2">
					<Skeleton className="h-7 w-64" />
					<Skeleton className="h-4 w-96" />
				</div>
				<Skeleton className="h-9 w-24" />
			</div>

			{/* Stats */}
			<div className="grid grid-cols-4 gap-4">
				{Array.from({ length: 4 }).map((_, i) => (
					<div key={i} className="rounded-xl border bg-card p-4 space-y-2">
						<Skeleton className="h-4 w-20" />
						<Skeleton className="h-8 w-16" />
					</div>
				))}
			</div>

			{/* Tabs */}
			{showTabs && (
				<div className="space-y-4">
					<div className="flex gap-2 border-b">
						{Array.from({ length: tabCount }).map((_, i) => (
							<Skeleton key={i} className="h-10 w-32" />
						))}
					</div>
					<Skeleton className="h-64 w-full rounded-xl" />
				</div>
			)}
		</div>
	);
}
