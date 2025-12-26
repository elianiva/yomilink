import { cn } from "@/lib/utils";

export interface Proposition {
	source: string;
	link: string;
	target: string;
	type?: "match" | "miss" | "excess";
	learnerNames?: string[];
}

export function PropositionList({
	propositions,
}: {
	propositions: Proposition[];
}) {
	return (
		<div className="space-y-2">
			{propositions.length === 0 ? (
				<div className="text-sm text-muted-foreground">No propositions</div>
			) : (
				propositions.map((prop) => (
					<div
						key={prop.source + prop.link + prop.target}
						className="flex items-center gap-2 rounded-md border p-2"
					>
						<span className="badge rounded-pill bg-warning text-dark mx-1">
							{prop.source}
						</span>
						<span className="text-xs"> </span>
						<span className="badge bg-secondary mx-1">{prop.link}</span>
						<span className="text-xs"> </span>
						<span className="badge rounded-pill bg-warning text-dark mx-1">
							{prop.target}
						</span>
						{prop.type && (
							<span
								className={cn(
									"badge rounded-pill mx-1",
									prop.type === "match" && "bg-green-500",
									prop.type === "miss" && "bg-red-500",
									prop.type === "excess" && "bg-blue-500",
								)}
							>
								{prop.type}
							</span>
						)}
						{prop.learnerNames && (
							<span className="badge bg-slate-100 text-xs ml-auto">
								{prop.learnerNames.length}x
							</span>
						)}
					</div>
				))
			)}
		</div>
	);
}

export function PropositionAuthorList({
	authors,
}: {
	authors: Array<{
		name: string;
		mapId: string;
		type: string;
		timestamp: Date;
	}>;
}) {
	return (
		<div className="space-y-2">
			{authors.map((author) => (
				<div
					key={author.mapId}
					className="flex items-center gap-2 rounded-md border p-2"
				>
					<span className="font-medium">{author.name}</span>
					{author.type === "draft" && (
						<span className="badge bg-secondary text-xs">D</span>
					)}
					{author.type === "submitted" && (
						<span className="badge bg-primary text-xs">S</span>
					)}
					<span className="ml-auto text-xs text-muted-foreground">
						{new Date(author.timestamp).toLocaleString()}
					</span>
					<span className="badge bg-slate-100 text-xs ml-2">
						ID: {author.mapId}
					</span>
				</div>
			))}
		</div>
	);
}
