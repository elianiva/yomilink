import { Skeleton } from "@/components/ui/skeleton";

export interface TableSkeletonProps {
	rows?: number;
	columns?: number;
	showHeader?: boolean;
	showToolbar?: boolean;
}

export function TableSkeleton({
	rows = 5,
	columns = 4,
	showHeader = true,
	showToolbar = true,
}: TableSkeletonProps) {
	return (
		<div className="space-y-4">
			{showToolbar && (
				<div className="flex items-center justify-between">
					<Skeleton className="h-9 w-64" />
					<div className="flex gap-2">
						<Skeleton className="h-9 w-24" />
						<Skeleton className="h-9 w-24" />
					</div>
				</div>
			)}
			<div className="rounded-xl border">
				{showHeader && (
					<div
						className="border-b p-4 grid gap-4"
						style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
					>
						{Array.from({ length: columns }).map((_, i) => (
							<Skeleton key={i} className="h-5" />
						))}
					</div>
				)}
				<div className="divide-y">
					{Array.from({ length: rows }).map((_, rowIdx) => (
						<div
							key={rowIdx}
							className="p-4 grid gap-4 items-center"
							style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
						>
							{Array.from({ length: columns }).map((_, colIdx) => (
								<Skeleton
									key={colIdx}
									className="h-4"
									style={{ width: colIdx === 0 ? "80%" : "60%" }}
								/>
							))}
						</div>
					))}
				</div>
			</div>
			<div className="flex items-center justify-between">
				<Skeleton className="h-4 w-32" />
				<div className="flex gap-2">
					<Skeleton className="h-9 w-24" />
					<Skeleton className="h-9 w-24" />
				</div>
			</div>
		</div>
	);
}
