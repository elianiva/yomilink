import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { BarChart3, Box, Map as MapIcon } from "lucide-react";
import { useState } from "react";
import { ManageKitDialog } from "@/components/kit/manage-kits";
import { Button } from "@/components/ui/button";
import type { AuthUser } from "@/lib/auth";
import { KitsRpc } from "@/server/rpc/kits";
import { ProfileRpc } from "@/server/rpc/profile";

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
	const [isJoinOpen, setIsJoinOpen] = useState(false);
	const navigate = useNavigate();
	const { data: me } = useQuery(ProfileRpc.getMe());
	const { data: kits = [] } = useQuery(KitsRpc.listStudentKits());

	return (
		<div className="space-y-6">
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				<div className="rounded-lg border p-4 space-y-2">
					<div className="flex items-center gap-2">
						<Box className="size-4 text-muted-foreground" />
						<div className="font-medium">Kits</div>
					</div>
					<p className="text-sm text-muted-foreground">
						Manage your kit-build concept maps
					</p>
					<div className="flex gap-2">
						<ManageKitDialog
							open={isJoinOpen}
							onClose={() => setIsJoinOpen(false)}
							kits={kits}
							onConfirm={(kitId) => {
								navigate({
									to: "/dashboard/kit/$kitId",
									params: { kitId },
								});
							}}
						/>
					</div>
				</div>

				{me?.role === "teacher" || me?.role === "admin" ? (
					<div className="rounded-lg border p-4 space-y-2">
						<div className="flex items-center gap-2">
							<MapIcon className="size-4 text-muted-foreground" />
							<div className="font-medium">Goal Map Editor</div>
						</div>
						<p className="text-sm text-muted-foreground">
							Create a teacher goal map and generate a student kit.
						</p>
						<div className="flex gap-2">
							<Button asChild className="mt-1">
								<Link
									to="/dashboard/goal/$goalMapId"
									params={{ goalMapId: "new" }}
									preload="intent"
								>
									New Goal Map
								</Link>
							</Button>
						</div>
					</div>
				) : null}

				<div className="rounded-lg border p-4 space-y-2">
					<div className="flex items-center gap-2">
						<BarChart3 className="size-4 text-muted-foreground" />
						<div className="font-medium">Analytics / Results</div>
					</div>
					<p className="text-sm text-muted-foreground">
						Explore analytics or results.
					</p>
					<div className="flex gap-2">
						<Button asChild variant="outline" className="mt-1">
							<Link to="/dashboard/analytics" preload="intent">
								Analytics
							</Link>
						</Button>
						<Button asChild variant="outline" className="mt-1">
							<Link to="/dashboard/results" preload="intent">
								Results
							</Link>
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
