import { Skeleton } from "@/components/ui/skeleton";

export interface CardSkeletonProps {
	count?: number;
}

export function CardSkeleton({ count = 1 }: CardSkeletonProps) {
	return (
		<div className="space-y-4">
			{Array.from({ length: count }).map((_, i) => (
				<div key={i} className="rounded-xl border bg-card p-6 space-y-4">
					<div className="flex items-center gap-4">
						<Skeleton className="h-12 w-12 rounded-lg" />
						<div className="space-y-2 flex-1">
							<Skeleton className="h-5 w-3/4" />
							<Skeleton className="h-4 w-1/2" />
						</div>
					</div>
					<Skeleton className="h-20 w-full" />
					<div className="flex gap-2">
						<Skeleton className="h-9 w-20" />
						<Skeleton className="h-9 w-20" />
					</div>
				</div>
			))}
		</div>
	);
}
