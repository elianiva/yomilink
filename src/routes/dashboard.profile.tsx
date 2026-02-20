import { useForm } from "@tanstack/react-form";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Schema } from "effect";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { FieldInfo } from "@/components/ui/field-info";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { getMe } from "@/server/rpc/profile";

export const Route = createFileRoute("/dashboard/profile")({
	component: ProfilePage,
	loader: () => getMe(),
});

const ProfileSchema = Schema.Struct({
	name: Schema.NonEmptyString,
});

function ProfilePage() {
	const me = Route.useLoaderData();
	const navigate = useNavigate();
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);

	const form = useForm({
		defaultValues: {
			name: me?.name ?? "",
		},
		validators: {
			onChange: Schema.standardSchemaV1(ProfileSchema),
			onSubmit: Schema.standardSchemaV1(ProfileSchema),
		},
		onSubmit: async ({ value }) => {
			setError(null);
			setSuccess(null);
			try {
				const { error } = await authClient.updateUser({
					name: value.name,
				});
				if (error) {
					throw new Error(error.message ?? "Update failed");
				}
				setSuccess("Profile updated successfully");
			} catch (e: unknown) {
				setError(e instanceof Error ? e.message : "Failed to update profile");
			}
		},
	});

	const handleSignOut = async () => {
		await authClient.signOut();
		navigate({ to: "/login" });
	};

	if (me === null) {
		return (
			<div className="flex flex-1 items-center justify-center p-6">
				<div className="rounded-2xl border border-border/60 bg-white px-8 py-6 shadow-sm">
					<p className="text-sm text-muted-foreground">No profile found.</p>
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-1 items-center justify-center p-6">
			<div className="w-full max-w-md rounded-2xl border border-border/60 bg-white shadow-sm">
				<div className="p-8 space-y-6">
					<div className="flex items-center gap-4">
						<Avatar className="h-14 w-14 rounded-xl ring-4 ring-primary/10">
							<AvatarImage
								src={me.image ?? ""}
								alt={me.name ?? me.email ?? "User"}
							/>
							<AvatarFallback className="rounded-xl bg-primary/90 text-primary-foreground text-lg font-bold">
								{((me.name ?? me.email ?? "U")[0] ?? "U").toUpperCase()}
							</AvatarFallback>
						</Avatar>
						<div className="min-w-0">
							<h1 className="text-xl font-semibold truncate">
								{me.name ?? "User"}
							</h1>
							<p className="text-sm text-muted-foreground truncate">
								{me.email ?? ""}
							</p>
						</div>
					</div>

					{error ? (
						<div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
							{error}
						</div>
					) : null}

					{success ? (
						<div className="rounded-md border border-green-500/40 bg-green-500/10 px-3 py-2 text-sm text-green-700">
							{success}
						</div>
					) : null}

					<form
						onSubmit={(e) => {
							e.preventDefault();
							e.stopPropagation();
							form.handleSubmit();
						}}
						className="space-y-5"
					>
						<form.Field name="name">
							{(field) => (
								<div className="space-y-1.5">
									<Label htmlFor="name">Name</Label>
									<Input
										id="name"
										placeholder="Your name"
										value={field.state.value}
										onChange={(e) => field.handleChange(e.target.value)}
										onBlur={field.handleBlur}
										autoComplete="name"
									/>
									<FieldInfo field={field} />
								</div>
							)}
						</form.Field>

						<div className="space-y-1.5">
							<Label htmlFor="email">Email</Label>
							<Input
								id="email"
								value={me.email ?? ""}
								disabled
								className="bg-muted/50"
							/>
							<p className="text-xs text-muted-foreground">
								Email cannot be changed
							</p>
						</div>

						<div className="space-y-1.5">
							<Label htmlFor="role">Role</Label>
							<Input
								id="role"
								value={me.role}
								disabled
								className="bg-muted/50 capitalize"
							/>
						</div>

						<div className="flex gap-2 pt-2">
							<Button asChild variant="outline" className="flex-1">
								<Link to="/dashboard" preload="intent">
									Back
								</Link>
							</Button>
							<form.Subscribe
								selector={(s) => [s.canSubmit, s.isSubmitting] as const}
							>
								{([canSubmit, isSubmitting]) => (
									<Button
										type="submit"
										disabled={!canSubmit || isSubmitting}
										className="flex-1"
									>
										{isSubmitting ? "Saving..." : "Save changes"}
									</Button>
								)}
							</form.Subscribe>
						</div>
					</form>

					<div className="border-t pt-4">
						<Button
							variant="destructive"
							className="w-full"
							onClick={handleSignOut}
						>
							Sign out
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
