import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import type { UserWithCohorts, UpdateUserInput } from "@/features/user/lib/user-service.shared";

type UserDetailSheetProps = {
	user: UserWithCohorts | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSave: (userId: string, data: UpdateUserInput) => void;
	onBan: (userId: string, reason: string) => void;
	onUnban: (userId: string) => void;
	onRoleChange: (userId: string, role: string) => void;
	onPasswordReset: (userId: string) => void;
	isAdmin: boolean;
	currentUserId: string;
	isSaving?: boolean;
};

export function UserDetailSheet({
	user,
	open,
	onOpenChange,
	onSave,
	onBan,
	onUnban,
	onRoleChange,
	onPasswordReset,
	isAdmin,
	currentUserId,
	isSaving,
}: UserDetailSheetProps) {
	const [formData, setFormData] = useState<Partial<UpdateUserInput>>({});
	const [banReason, setBanReason] = useState("");
	const [showBanInput, setShowBanInput] = useState(false);

	useEffect(() => {
		if (user) {
			setFormData({
				name: user.name,
				email: user.email,
				studentId: user.studentId ?? "",
				age: user.age ?? undefined,
				jlptLevel: user.jlptLevel ?? undefined,
				japaneseLearningDuration: user.japaneseLearningDuration ?? undefined,
				previousJapaneseScore: user.previousJapaneseScore ?? undefined,
				mediaConsumption: user.mediaConsumption ?? undefined,
				motivation: user.motivation ?? undefined,
				studyGroup: user.studyGroup ?? "unassigned",
			});
		}
		setBanReason("");
		setShowBanInput(false);
	}, [user]);

	if (!user) return null;

	const canModifyRole = isAdmin && user.id !== currentUserId;
	const canBan = isAdmin && user.id !== currentUserId;

	const handleSave = () => {
		const changes: UpdateUserInput = {};
		for (const [key, value] of Object.entries(formData)) {
			if (value === undefined || value === "") continue;
			if (key === "studyGroup" && value === "unassigned") {
				// @ts-expect-error dynamic key assignment
				changes[key] = null;
				continue;
			}
			// @ts-expect-error dynamic key assignment
			changes[key] = value;
		}
		onSave(user.id, changes);
	};

	const handleBan = () => {
		if (banReason.trim()) {
			onBan(user.id, banReason.trim());
			setShowBanInput(false);
			setBanReason("");
		}
	};

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent className="sm:max-w-lg overflow-y-auto">
				<SheetHeader>
					<SheetTitle>User Details</SheetTitle>
					<SheetDescription>View and edit user information</SheetDescription>
				</SheetHeader>

				<div className="space-y-6 px-6 py-6">
					{/* Basic Info */}
					<div className="space-y-4">
						<h3 className="text-sm font-medium text-muted-foreground">
							Basic Information
						</h3>
						<div className="grid gap-4">
							<div className="grid gap-2">
								<Label htmlFor="name">Name</Label>
								<Input
									id="name"
									value={formData.name ?? ""}
									onChange={(e) =>
										setFormData({ ...formData, name: e.target.value })
									}
								/>
							</div>
							<div className="grid gap-2">
								<Label htmlFor="studentId">Student ID</Label>
								<Input
									id="studentId"
									value={formData.studentId ?? ""}
									onChange={(e) =>
										setFormData({ ...formData, studentId: e.target.value })
									}
								/>
							</div>
							<div className="grid gap-2">
								<Label htmlFor="email">Email</Label>
								<Input
									id="email"
									type="email"
									value={formData.email ?? ""}
									onChange={(e) =>
										setFormData({ ...formData, email: e.target.value })
									}
								/>
							</div>
							{canModifyRole && (
								<div className="grid gap-2">
									<Label htmlFor="role">Role</Label>
									<Select
										value={user.role ?? "student"}
										onValueChange={(role) => onRoleChange(user.id, role)}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="student">Student</SelectItem>
											<SelectItem value="teacher">Teacher</SelectItem>
											<SelectItem value="admin">Admin</SelectItem>
										</SelectContent>
									</Select>
								</div>
							)}
						</div>
					</div>

					{/* Profile Fields */}
					<div className="space-y-4">
						<h3 className="text-sm font-medium text-muted-foreground">Profile</h3>
						<div className="grid gap-4">
							<div className="grid gap-2">
								<Label htmlFor="age">Age</Label>
								<Input
									id="age"
									type="number"
									value={formData.age ?? ""}
									onChange={(e) =>
										setFormData({
											...formData,
											age: e.target.value
												? Number(e.target.value)
												: undefined,
										})
									}
								/>
							</div>
							<div className="grid gap-2">
								<Label htmlFor="jlptLevel">JLPT Level</Label>
								<Select
									value={formData.jlptLevel ?? ""}
									onValueChange={(level) =>
										setFormData({
											...formData,
											jlptLevel: level as UpdateUserInput["jlptLevel"],
										})
									}
								>
									<SelectTrigger>
										<SelectValue placeholder="Select level" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="None">None</SelectItem>
										<SelectItem value="N5">N5</SelectItem>
										<SelectItem value="N4">N4</SelectItem>
										<SelectItem value="N3">N3</SelectItem>
										<SelectItem value="N2">N2</SelectItem>
										<SelectItem value="N1">N1</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div className="grid gap-2">
								<Label htmlFor="studyGroup">Study Group</Label>
								<Select
									value={formData.studyGroup ?? "unassigned"}
									onValueChange={(group) =>
										setFormData({
											...formData,
											studyGroup: group as UpdateUserInput["studyGroup"],
										})
									}
								>
									<SelectTrigger>
										<SelectValue placeholder="Select group" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="unassigned">Unassigned</SelectItem>
										<SelectItem value="experiment">Experiment</SelectItem>
										<SelectItem value="control">Control</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div className="grid gap-2">
								<Label htmlFor="motivation">Motivation</Label>
								<Textarea
									id="motivation"
									value={formData.motivation ?? ""}
									onChange={(e) =>
										setFormData({ ...formData, motivation: e.target.value })
									}
								/>
							</div>
						</div>
					</div>

					{/* Cohorts */}
					<div className="space-y-2">
						<h3 className="text-sm font-medium text-muted-foreground">Cohorts</h3>
						<div className="flex flex-wrap gap-2">
							{user.cohorts.length > 0 ? (
								user.cohorts.map((c) => (
									<Badge key={c.id} variant="secondary">
										{c.name}
									</Badge>
								))
							) : (
								<span className="text-sm text-muted-foreground">
									No cohorts assigned
								</span>
							)}
						</div>
					</div>

					{/* Admin Actions */}
					{canBan && (
						<div className="space-y-4 border-t pt-4">
							<h3 className="text-sm font-medium text-muted-foreground">
								Admin Actions
							</h3>
							{user.banned ? (
								<Button variant="outline" onClick={() => onUnban(user.id)}>
									Unban User
								</Button>
							) : showBanInput ? (
								<div className="space-y-2">
									<Textarea
										placeholder="Enter ban reason..."
										value={banReason}
										onChange={(e) => setBanReason(e.target.value)}
									/>
									<div className="flex gap-2">
										<Button variant="destructive" onClick={handleBan}>
											Confirm Ban
										</Button>
										<Button
											variant="outline"
											onClick={() => setShowBanInput(false)}
										>
											Cancel
										</Button>
									</div>
								</div>
							) : (
								<div className="flex gap-2">
									<Button
										variant="destructive"
										onClick={() => setShowBanInput(true)}
									>
										Ban User
									</Button>
									<Button
										variant="outline"
										onClick={() => onPasswordReset(user.id)}
									>
										Reset Password
									</Button>
								</div>
							)}
						</div>
					)}
				</div>

				{/* Footer */}
				<div className="flex justify-end gap-2 border-t px-6 pb-6 pt-4">
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Cancel
					</Button>
					<Button onClick={handleSave} disabled={isSaving}>
						{isSaving ? "Saving..." : "Save Changes"}
					</Button>
				</div>
			</SheetContent>
		</Sheet>
	);
}
