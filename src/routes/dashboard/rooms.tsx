import { createFileRoute } from "@tanstack/react-router";
import {
	BookOpen,
	Bot,
	ChevronRight,
	DoorOpen,
	Eye,
	Filter,
	Key,
	Pencil,
	Plus,
	RefreshCcw,
	Settings,
	Shield,
	Tag,
	Trash2,
	User,
	UserPlus,
	Users,
} from "lucide-react";
import { Guard } from "@/components/auth/Guard";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export const Route = createFileRoute("/dashboard/rooms")({
	component: () => (
		<Guard roles={["teacher", "admin"]}>
			<SystemAdministrationPage />
		</Guard>
	),
});

/** Small pill used throughout */
function Chip({
	children,
	color = "amber",
}: {
	children: React.ReactNode;
	color?: "amber" | "slate" | "green" | "sky" | "red" | "blue";
}) {
	const map: Record<string, string> = {
		amber: "bg-amber-200/80 text-amber-950 ring-amber-300/70",
		slate: "bg-muted text-foreground/80 ring-border",
		green: "bg-emerald-100 text-emerald-900 ring-emerald-300/80",
		sky: "bg-sky-100 text-sky-900 ring-sky-300/80",
		red: "bg-rose-100 text-rose-900 ring-rose-300/80",
		blue: "bg-blue-100 text-blue-900 ring-blue-300/80",
	};
	return (
		<span
			className={[
				"inline-flex items-center rounded-sm px-1.5 py-0.5 text-[10px] font-medium ring-1",
				map[color],
			].join(" ")}
		>
			{children}
		</span>
	);
}

/** Reusable tiny icon button cluster */
function RowActions() {
	const common = "h-7 w-7 p-0";
	return (
		<div className="flex items-center gap-1">
			<Button variant="outline" size="sm" className={common} title="View">
				<Eye className="size-4" />
			</Button>
			<Button variant="outline" size="sm" className={common} title="Edit">
				<Pencil className="size-4" />
			</Button>
			<Button variant="destructive" size="sm" className={common} title="Delete">
				<Trash2 className="size-4" />
			</Button>
		</div>
	);
}

/** Card header with title and right controls */
function SectionHeader({
	icon,
	title,
	onCreateLabel,
}: {
	icon?: React.ReactNode;
	title: string;
	onCreateLabel?: string;
}) {
	return (
		<div className="flex items-center justify-between">
			<div className="flex items-center gap-2">
				{icon}
				<h3 className="text-base font-semibold">{title}</h3>
			</div>
			<div className="flex items-center gap-2">
				<Button variant="outline" size="sm" className="h-7">
					<RefreshCcw className="size-3.5" />
				</Button>
				<Button variant="outline" size="sm" className="h-7">
					<Filter className="size-3.5" />
				</Button>
				{onCreateLabel ? (
					<Button size="sm" className="h-7 gap-1.5">
						<Plus className="size-4" /> {onCreateLabel}
					</Button>
				) : null}
			</div>
		</div>
	);
}

function SystemAdministrationPage() {
	// Dummy data
	const users = [
		{ id: 1, name: "Administrator", tags: ["CON"] },
		{ id: 34, name: "林 進介", tags: ["CON"] },
		{ id: 366, name: "Sensei", tags: ["CON"] },
		{ id: 368, name: "test", tags: ["CON"] },
		{ id: 370, name: "test", tags: ["CON"] },
		{ id: 373, name: "guest_teacher", tags: ["CON"] },
		{ id: 383, name: "guest teacher", tags: ["CON"] },
		{ id: 392, name: "Aryo Pinandito", tags: ["CON"] },
	];

	const groups = [
		{ id: 1, name: "General Group", badge: "GENERAL", people: 2665, rooms: 36 },
		{ id: 2, name: "LEL", badge: "", people: 30, rooms: 15 },
		{
			id: 3,
			name: "Authoring Support",
			badge: "SUPPORT",
			people: 1,
			rooms: 19,
		},
		{ id: 4, name: "yamanoto", badge: "EXTERNAL", people: 5, rooms: 2 },
		{ id: 5, name: "Teknik Pemesinan", badge: "150298", people: 0, rooms: 0 },
		{ id: 7, name: "Endocrinology", badge: "ENDO", people: 2, rooms: 0 },
	];

	const roles = [
		{ id: "r1", name: "Concept Mappers", tag: "CON", count: 603 },
		{ id: "r2", name: "Kit-Builders", tag: "KIT", count: 2258 },
	];

	const permissibles = [
		{ id: "p1", name: "Create Kit" },
		{ id: "p2", name: "Edit Role" },
		{ id: "p3", name: "Manage Users" },
	];

	const topics = [
		{ id: 75, name: "Endocrinology", tag: "Endocrinology" },
		{ id: 74, name: "test_net2", tag: "test_net2" },
		{ id: 73, name: "test_net", tag: "test_net" },
	];

	const supportTopicContent = [
		{ id: 75, name: "Endocrinology" },
		{ id: 74, name: "test_net2" },
		{ id: 73, name: "test_net" },
	];

	const sessions = [
		{ id: "s1", name: "DEMO22-SESSION" },
		{ id: "s2", name: "JSAI-SESSION" },
	];

	const rooms = [
		{ id: 179, name: "Aryo Pinandito's Room" },
		{ id: 180, name: "Aryo Pinandito's Room" },
		{ id: 181, name: "Aryo Pinandito's Room" },
		{ id: 182, name: "Aryo Pinandito's Room" },
		{ id: 183, name: "Aryo Pinandito's Room" },
		{ id: 184, name: "Aryo Pinandito's Room" },
		{ id: 185, name: "Aryo Pinandito's Room" },
		{ id: 186, name: "Aryo Pinandito's Room" },
	];

	const pairs = [
		{
			id: 49,
			session: "JSAI-SESSION",
			roomId: 227,
			room: "Aryo Pinandito's Room",
			members: 0,
			status: "EMPTY",
		},
		{
			id: 50,
			session: "JSAI-SESSION",
			roomId: 228,
			room: "Aryo Pinandito's Room",
			members: 0,
			status: "EMPTY",
		},
		{
			id: 51,
			session: "JSAI-SESSION",
			roomId: 229,
			room: "Aryo Pinandito's Room",
			members: 0,
			status: "EMPTY",
		},
		{
			id: 52,
			session: "JSAI-SESSION",
			roomId: 230,
			room: "Aryo Pinandito's Room",
			members: 0,
			status: "EMPTY",
		},
		{
			id: 53,
			session: "JSAI-SESSION",
			roomId: 231,
			room: "Aryo Pinandito's Room",
			members: 0,
			status: "EMPTY",
		},
		{
			id: 54,
			session: "JSAI-SESSION",
			roomId: 232,
			room: "RISMANTO RIDWAN's Room",
			members: 0,
			status: "EMPTY",
		},
		{
			id: 55,
			session: "JSAI-SESSION",
			roomId: 233,
			room: "Aryo Pinandito's Room",
			members: 0,
			status: "EMPTY",
		},
	];

	return (
		<div className="space-y-6">
			{/* Top pseudo-tabs */}
			<div className="flex items-center gap-2">
				<Button size="sm" className="h-8">
					System Administration
				</Button>
				<Button size="sm" variant="outline" className="h-8">
					Test Management
				</Button>
			</div>

			{/* Section: System Administration */}
			<div className="space-y-4">
				<h2 className="text-xl font-semibold">System Administration</h2>

				<div className="grid gap-6 lg:grid-cols-2">
					{/* Users */}
					<div className="rounded-lg border p-3">
						<SectionHeader
							icon={<User className="size-4 text-muted-foreground" />}
							title="Users"
							onCreateLabel="Create User"
						/>
						<div className="mt-3 space-y-1.5">
							{users.map((u) => (
								<div
									key={u.id}
									className="flex items-center justify-between rounded-md border px-3 py-2"
								>
									<div className="flex items-center gap-2 text-sm">
										<Chip color="blue">{u.id}</Chip>
										<div className="font-medium">{u.name}</div>
										{u.tags?.map((t) => (
											<Chip key={t}>{t}</Chip>
										))}
									</div>
									<RowActions />
								</div>
							))}
						</div>
					</div>

					{/* Groups */}
					<div className="rounded-lg border p-3">
						<SectionHeader
							icon={<Users className="size-4 text-muted-foreground" />}
							title="Group"
							onCreateLabel="Create Group"
						/>
						<div className="mt-3 space-y-1.5">
							{groups.map((g) => (
								<div
									key={g.id}
									className="flex items-center justify-between rounded-md border px-3 py-2"
								>
									<div className="flex items-center gap-2 text-sm">
										<Chip color="blue">{g.id}</Chip>
										<div className="font-medium">{g.name}</div>
										{g.badge ? <Chip>{g.badge}</Chip> : null}
									</div>
									<div className="flex items-center gap-3">
										<div className="text-xs text-muted-foreground flex items-center gap-1">
											<Users className="size-3.5" /> {g.people}
										</div>
										<div className="text-xs text-muted-foreground flex items-center gap-1">
											<DoorOpen className="size-3.5" /> {g.rooms}
										</div>
										<RowActions />
									</div>
								</div>
							))}
						</div>
					</div>

					{/* Role */}
					<div className="rounded-lg border p-3">
						<SectionHeader
							icon={<Shield className="size-4 text-muted-foreground" />}
							title="Role"
							onCreateLabel="Create Role"
						/>
						<div className="mt-3 space-y-1.5">
							{roles.map((r) => (
								<div
									key={r.id}
									className="flex items-center justify-between rounded-md border px-3 py-2"
								>
									<div className="flex items-center gap-2 text-sm">
										<Chip>{r.tag}</Chip>
										<div className="font-medium">{r.name}</div>
									</div>
									<div className="flex items-center gap-2">
										<div className="text-xs text-muted-foreground flex items-center gap-1">
											<Users className="size-3.5" /> {r.count}
										</div>
										<RowActions />
									</div>
								</div>
							))}
						</div>
					</div>

					{/* Permissible */}
					<div className="rounded-lg border p-3">
						<SectionHeader
							icon={<Key className="size-4 text-muted-foreground" />}
							title="Permissible"
							onCreateLabel="Create Permissible"
						/>
						<div className="mt-3 space-y-1.5">
							{permissibles.map((p) => (
								<div
									key={p.id}
									className="flex items-center justify-between rounded-md border px-3 py-2"
								>
									<div className="text-sm font-medium">{p.name}</div>
									<RowActions />
								</div>
							))}
						</div>
					</div>

					{/* Topic */}
					<div className="rounded-lg border p-3">
						<SectionHeader
							icon={<Tag className="size-4 text-muted-foreground" />}
							title="Topic"
							onCreateLabel="Create Topic"
						/>
						<div className="mt-3 space-y-1.5">
							{topics.map((t) => (
								<div
									key={t.id}
									className="flex items-center justify-between rounded-md border px-3 py-2"
								>
									<div className="flex items-center gap-2 text-sm">
										<Chip color="blue">{t.id}</Chip>
										<div className="font-medium">{t.name}</div>
										<Chip color="amber">{t.tag}</Chip>
									</div>
									<RowActions />
								</div>
							))}
						</div>
					</div>

					{/* Support: Topic Content and NLP */}
					<div className="rounded-lg border p-3">
						<SectionHeader
							icon={
								<div className="flex items-center gap-1.5 text-muted-foreground">
									<BookOpen className="size-4" />
									<Bot className="size-4" />
								</div>
							}
							title="Support: Topic Content and NLP"
						/>
						<div className="mt-3 space-y-1.5">
							{supportTopicContent.map((s) => (
								<div
									key={s.id}
									className="flex items-center justify-between rounded-md border px-3 py-2"
								>
									<div className="flex items-center gap-2 text-sm">
										<Chip color="blue">{s.id}</Chip>
										<div className="font-medium">{s.name}</div>
									</div>
									<RowActions />
								</div>
							))}
						</div>
					</div>
				</div>
			</div>

			<Separator />

			{/* Experiment Specific Administration */}
			<div className="space-y-4">
				<h2 className="text-xl font-semibold">
					Experiment Specific Administration
				</h2>

				<div className="grid gap-6 lg:grid-cols-2">
					{/* Session */}
					<div className="rounded-lg border p-3">
						<SectionHeader
							icon={<Settings className="size-4 text-muted-foreground" />}
							title="Session"
							onCreateLabel="Create Session"
						/>
						<div className="mt-3 space-y-1.5">
							{sessions.map((s) => (
								<div
									key={s.id}
									className="flex items-center justify-between rounded-md border px-3 py-2"
								>
									<div className="text-sm font-medium">{s.name}</div>
									<RowActions />
								</div>
							))}
						</div>
					</div>

					{/* Room */}
					<div className="rounded-lg border p-3">
						<SectionHeader
							icon={<DoorOpen className="size-4 text-muted-foreground" />}
							title="Room"
							onCreateLabel="Create Room"
						/>
						<div className="mt-3 space-y-1.5">
							{rooms.map((r) => (
								<div
									key={r.id}
									className="flex items-center justify-between rounded-md border px-3 py-2"
								>
									<div className="flex items-center gap-2 text-sm">
										<Chip color="blue">{r.id}</Chip>
										<div className="font-medium">{r.name}</div>
									</div>
									<div className="flex items-center gap-1">
										<Button
											variant="outline"
											size="sm"
											className="h-7 w-7 p-0"
											title="Edit"
										>
											<Pencil className="size-4" />
										</Button>
										<Button
											variant="destructive"
											size="sm"
											className="h-7 w-7 p-0"
											title="Delete"
										>
											<Trash2 className="size-4" />
										</Button>
									</div>
								</div>
							))}
						</div>
					</div>

					{/* Pair Groups */}
					<div className="rounded-lg border p-3 lg:col-span-2">
						<SectionHeader
							icon={<UserPlus className="size-4 text-muted-foreground" />}
							title="Pair Groups"
							onCreateLabel="Create pair"
						/>
						<div className="mt-3 space-y-1.5">
							{pairs.map((p) => (
								<div
									key={p.id}
									className="flex items-center justify-between rounded-md border px-3 py-2"
								>
									<div className="flex items-center gap-2 text-sm flex-wrap">
										<Chip color="blue">ID: {p.id}</Chip>
										<Chip color="slate">S: {p.session}</Chip>
										<Chip color="amber">
											R:{p.roomId} {p.room}
										</Chip>
										<Chip color="red">{p.status}</Chip>
									</div>
									<div className="flex items-center gap-2">
										<div className="text-xs text-muted-foreground flex items-center gap-1">
											<Users className="size-3.5" /> {p.members}
										</div>
										<RowActions />
									</div>
								</div>
							))}
						</div>
						<div className="mt-3 flex items-center justify-end">
							<Button variant="outline" size="sm" className="h-8 gap-1">
								Export CSV <ChevronRight className="size-4" />
							</Button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
