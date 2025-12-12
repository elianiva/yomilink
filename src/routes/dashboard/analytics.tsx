import { createFileRoute } from "@tanstack/react-router";
import {
	Activity,
	ChevronDown,
	ImageDown,
	Redo2,
	Search,
	Trash2,
	Undo2,
	ZoomIn,
	ZoomOut,
} from "lucide-react";
import { useId, useMemo, useState } from "react";
import { Guard } from "@/components/auth/Guard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/dashboard/analytics")({
	component: () => (
		<Guard roles={["teacher", "admin"]}>
			<StaticAnalyzerPage />
		</Guard>
	),
});

type Learner = {
	id: string;
	name: string;
	kit: string;
	group: string;
	type: "All" | "Passed" | "Failed" | "In Progress";
	score: number;
};

const demoLearners: Learner[] = [
	{
		id: "l1",
		name: "Andi",
		kit: "Intro Kit",
		group: "Room 102",
		type: "All",
		score: 78,
	},
	{
		id: "l2",
		name: "Budi",
		kit: "Intro Kit",
		group: "Room 102",
		type: "All",
		score: 64,
	},
	{
		id: "l3",
		name: "Citra",
		kit: "Ecosystems",
		group: "Room 207",
		type: "All",
		score: 85,
	},
];

function LegendDot({ color }: { color: string }) {
	return (
		<span
			className="inline-block size-3 rounded-full"
			style={{ backgroundColor: color }}
		/>
	);
}

function SectionTitle({ children }: { children: React.ReactNode }) {
	return (
		<div className="text-xs font-medium text-muted-foreground uppercase tracking-wide pl-0.5">
			{children}
		</div>
	);
}

function ToolbarButton({
	children,
	title,
}: {
	children: React.ReactNode;
	title: string;
}) {
	return (
		<Button variant="outline" size="sm" className="h-8 w-8 p-0" title={title}>
			{children}
		</Button>
	);
}

function StaticAnalyzerPage() {
	// Left rail state
	const [who, setWho] = useState<"Teacher" | "Group">("Teacher");
	const [min, setMin] = useState(1);
	const [max, setMax] = useState(1);
	const [firstOnly, setFirstOnly] = useState(false);
	const [lastOnly, setLastOnly] = useState(false);

	// Filters
	const [kitFilter, setKitFilter] = useState("All");
	const [groupFilter, setGroupFilter] = useState("All");
	const [typeFilter, setTypeFilter] = useState<
		"All" | "Passed" | "Failed" | "In Progress"
	>("All");
	const [query, setQuery] = useState("");
	const firstId = useId();
	const lastId = useId();

	const filteredLearners = useMemo(() => {
		const q = query.trim().toLowerCase();
		return demoLearners.filter((l) => {
			if (kitFilter !== "All" && l.kit !== kitFilter) return false;
			if (groupFilter !== "All" && l.group !== groupFilter) return false;
			if (typeFilter !== "All" && l.type !== typeFilter) return false;
			if (q && !l.name.toLowerCase().includes(q)) return false;
			return true;
		});
	}, [kitFilter, groupFilter, typeFilter, query]);

	return (
		<div className="h-full grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
			{/* Left rail */}
			<aside className="rounded-lg border bg-card">
				<div className="border-b p-3 flex items-center justify-between">
					<h2 className="text-sm font-semibold">Static Analyzer</h2>
					<div className="text-[10px] text-muted-foreground">Teacher View</div>
				</div>

				<div className="p-3 space-y-4">
					{/* Groups Map */}
					<div className="space-y-2">
						<SectionTitle>Groups Map</SectionTitle>

						<div className="flex items-center gap-1.5">
							<Button
								size="sm"
								variant={who === "Teacher" ? "default" : "outline"}
								className="h-7"
								onClick={() => setWho("Teacher")}
							>
								Teacher
							</Button>
							<Button
								size="sm"
								variant={who === "Group" ? "default" : "outline"}
								className="h-7"
								onClick={() => setWho("Group")}
							>
								Group
							</Button>

							<div className="ml-auto text-xs text-muted-foreground">Range</div>
						</div>

						<div className="space-y-2 rounded-md border p-3">
							<div className="flex items-center gap-2">
								<div className="flex-1">
									<Slider
										min={1}
										max={10}
										defaultValue={[min, max]}
										onValueChange={(v) => {
											const [mi, ma] = v as number[];
											setMin(mi);
											setMax(ma);
										}}
									/>
								</div>
								<div className="flex items-center gap-2 text-xs text-muted-foreground w-[120px]">
									<div className="min-w-0">Min</div>
									<div className="font-medium tabular-nums">{min}</div>
								</div>
								<div className="flex items-center gap-2 text-xs text-muted-foreground w-[120px]">
									<div className="min-w-0">Max</div>
									<div className="font-medium tabular-nums">{max}</div>
								</div>
							</div>

							<div className="flex items-center gap-3">
								<div className="flex items-center gap-2 text-xs">
									<Switch
										aria-labelledby={firstId}
										checked={firstOnly}
										onCheckedChange={setFirstOnly}
									/>
									<span id={firstId}>First</span>
								</div>
								<div className="flex items-center gap-2 text-xs">
									<Switch
										aria-labelledby={lastId}
										checked={lastOnly}
										onCheckedChange={setLastOnly}
									/>
									<span id={lastId}>Last</span>
								</div>
								<Button
									size="sm"
									variant="outline"
									className="ml-auto h-7"
									onClick={() => {
										setMin(1);
										setMax(1);
										setFirstOnly(false);
										setLastOnly(false);
									}}
								>
									Clear
								</Button>
							</div>
						</div>
					</div>

					<Separator />

					{/* Learners Maps */}
					<div className="space-y-2">
						<SectionTitle>Learners Maps</SectionTitle>

						<div className="grid grid-cols-1 gap-2">
							<div className="flex items-center gap-2">
								<Select value={kitFilter} onValueChange={setKitFilter}>
									<SelectTrigger size="sm" className="h-8 w-full">
										<SelectValue placeholder="Kits" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="All">Kits: All</SelectItem>
										<SelectItem value="Intro Kit">Intro Kit</SelectItem>
										<SelectItem value="Ecosystems">Ecosystems</SelectItem>
									</SelectContent>
								</Select>

								<Select value={groupFilter} onValueChange={setGroupFilter}>
									<SelectTrigger size="sm" className="h-8 w-full">
										<SelectValue placeholder="Groups" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="All">Groups: All</SelectItem>
										<SelectItem value="Room 102">Room 102</SelectItem>
										<SelectItem value="Room 207">Room 207</SelectItem>
									</SelectContent>
								</Select>
							</div>

							<div className="flex items-center gap-2">
								<Select
									value={typeFilter}
									onValueChange={(v) => setTypeFilter(v as Learner["type"])}
								>
									<SelectTrigger size="sm" className="h-8 w-[160px]">
										<SelectValue placeholder="Type" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="All">Type: All</SelectItem>
										<SelectItem value="Passed">Passed</SelectItem>
										<SelectItem value="Failed">Failed</SelectItem>
										<SelectItem value="In Progress">In Progress</SelectItem>
									</SelectContent>
								</Select>

								<div className="relative flex-1">
									<Search className="absolute left-2 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
									<Input
										className="pl-8 h-8"
										placeholder="Search learner…"
										value={query}
										onChange={(e) => setQuery(e.target.value)}
									/>
								</div>
							</div>
						</div>

						<div className="mt-2 rounded-md border">
							<div className="flex items-center justify-between text-xs text-muted-foreground px-3 py-2 border-b">
								<div>Name</div>
								<div>Score</div>
							</div>
							<div className="max-h-64 overflow-auto">
								{filteredLearners.length === 0 ? (
									<div className="px-3 py-6 text-center text-xs text-muted-foreground">
										No data, please open a Kit.
									</div>
								) : (
									filteredLearners.map((l) => (
										<div
											key={l.id}
											className="flex items-center justify-between px-3 py-2 border-b last:border-b-0"
										>
											<div className="text-sm">{l.name}</div>
											<div className="text-xs font-semibold tabular-nums">
												{l.score}
											</div>
										</div>
									))
								)}
							</div>
						</div>
					</div>
				</div>
			</aside>

			{/* Right main area */}
			<section className="rounded-lg border overflow-hidden flex flex-col">
				{/* Top toolbar */}
				<div className="border-b bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/50">
					<div className="h-12 px-3 flex items-center gap-2">
						<div className="font-semibold">Static Analyzer</div>
						<div className="ml-auto flex items-center gap-1.5">
							<ToolbarButton title="Undo">
								<Undo2 className="size-4" />
							</ToolbarButton>
							<ToolbarButton title="Redo">
								<Redo2 className="size-4" />
							</ToolbarButton>

							<Separator className="h-6" orientation="vertical" />

							<ToolbarButton title="Zoom Out">
								<ZoomOut className="size-4" />
							</ToolbarButton>
							<ToolbarButton title="Zoom In">
								<ZoomIn className="size-4" />
							</ToolbarButton>

							<Separator className="h-6" orientation="vertical" />

							<Select defaultValue="learnermap">
								<SelectTrigger size="sm" className="h-8 min-w-[140px]">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="teachermap">Layout: Teachermap</SelectItem>
									<SelectItem value="learnermap">Layout: Learnermap</SelectItem>
								</SelectContent>
							</Select>

							<Button variant="outline" size="sm" className="h-8 gap-1">
								Map <ChevronDown className="size-4" />
							</Button>

							<Separator className="h-6" orientation="vertical" />

							<ToolbarButton title="Export Image">
								<ImageDown className="size-4" />
							</ToolbarButton>
							<ToolbarButton title="Metrics (Dynamic)">
								<Activity className="size-4" />
							</ToolbarButton>
							<ToolbarButton title="Clear Canvas">
								<Trash2 className="size-4" />
							</ToolbarButton>
						</div>
					</div>
				</div>

				{/* Legend + canvas */}
				<div className="p-3">
					<div className="flex items-center gap-4">
						<div className="text-xs text-muted-foreground">Legend</div>
						<div className="flex items-center gap-3">
							<div className="flex items-center gap-2 text-xs">
								<LegendDot color="#16a34a" /> Correct
							</div>
							<div className="flex items-center gap-2 text-xs">
								<LegendDot color="#3b82f6" /> Extra
							</div>
							<div className="flex items-center gap-2 text-xs">
								<LegendDot color="#ef4444" /> Missing
							</div>
							<div className="flex items-center gap-2 text-xs">
								<LegendDot color="#64748b" /> Neutral
							</div>
						</div>
					</div>
				</div>

				<div className="flex-1 m-3 rounded-md border border-dashed bg-muted/10 grid place-items-center">
					<div className="text-sm text-muted-foreground px-4 text-center">
						Canvas placeholder. The static analyzer visualization will render
						here.
					</div>
				</div>
			</section>
		</div>
	);
}
