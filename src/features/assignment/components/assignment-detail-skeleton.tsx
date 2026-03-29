import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function AssignmentDetailSkeleton() {
	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-start justify-between">
				<div className="space-y-2">
					<div className="flex items-center gap-3">
						<Skeleton className="h-8 w-8" />
						<Skeleton className="h-8 w-64" />
					</div>
					<Skeleton className="h-4 w-96" />
					<Skeleton className="h-3 w-32" />
				</div>
			</div>

			{/* Overview Cards */}
			<div className="grid gap-4 md:grid-cols-3">
				<Card>
					<CardHeader className="pb-2">
						<Skeleton className="h-4 w-20" />
					</CardHeader>
					<CardContent>
						<Skeleton className="h-8 w-32" />
						<Skeleton className="h-3 w-24 mt-2" />
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="pb-2">
						<Skeleton className="h-4 w-20" />
					</CardHeader>
					<CardContent>
						<Skeleton className="h-8 w-32" />
						<Skeleton className="h-3 w-24 mt-2" />
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="pb-2">
						<Skeleton className="h-4 w-20" />
					</CardHeader>
					<CardContent>
						<Skeleton className="h-8 w-32" />
						<Skeleton className="h-3 w-24 mt-2" />
					</CardContent>
				</Card>
			</div>

			{/* Tabs */}
			<div className="space-y-4">
				<div className="flex gap-2">
					<Skeleton className="h-10 w-24" />
					<Skeleton className="h-10 w-24" />
					<Skeleton className="h-10 w-24" />
					<Skeleton className="h-10 w-24" />
				</div>
				<Card>
					<CardHeader>
						<Skeleton className="h-6 w-48" />
						<Skeleton className="h-4 w-64 mt-2" />
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid gap-4 md:grid-cols-2">
							<div className="space-y-2">
								<Skeleton className="h-4 w-24" />
								<Skeleton className="h-4 w-48" />
							</div>
							<div className="space-y-2">
								<Skeleton className="h-4 w-24" />
								<Skeleton className="h-4 w-48" />
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
