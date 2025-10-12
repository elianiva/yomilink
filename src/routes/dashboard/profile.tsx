import { useConvexQuery } from "@convex-dev/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { api } from "convex/_generated/api";
import { useId } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/dashboard/profile")({
  component: ProfilePage,
});

type Me = {
  name: string | null;
  email: string | null;
  image?: string | null;
  role: "teacher" | "admin" | "student";
};

function ProfilePage() {
  const me = useConvexQuery(api.users.me) as Me | undefined | null;

  const nameId = useId();
  const emailId = useId();
  const roleId = useId();
  const imageId = useId();

  if (typeof me === "undefined") {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
      </div>
    );
  }
  if (me === null) {
    return <div className="p-4 text-sm">No profile found.</div>;
  }
  return (
    <div className="flex w-full justify-center p-4">
      <form className="w-full max-w-md space-y-6">
        <div className="flex items-center gap-4">
          <Avatar className="h-12 w-12 rounded-lg">
            <AvatarImage src={me.image ?? ""} alt={me.name ?? me.email ?? "User"} />
            <AvatarFallback className="rounded-lg">
              {((me.name ?? me.email ?? "U")[0] ?? "U").toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="text-lg font-semibold truncate">
              {me.name ?? me.email ?? "User"}
            </div>
            <div className="text-sm text-muted-foreground truncate">
              {me.email ?? ""}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor={nameId}>Name</Label>
            <Input id={nameId} value={me.name ?? ""} readOnly />
          </div>
          <div className="grid gap-2">
            <Label htmlFor={emailId}>Email</Label>
            <Input id={emailId} value={me.email ?? ""} readOnly />
          </div>
          <div className="grid gap-2">
            <Label htmlFor={roleId}>Role</Label>
            <Input id={roleId} value={me.role} readOnly />
          </div>
          <div className="grid gap-2">
            <Label htmlFor={imageId}>Avatar URL</Label>
            <Input id={imageId} value={me.image ?? ""} readOnly />
          </div>
        </div>

        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to="/dashboard">Back</Link>
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              void authClient.signOut();
            }}
          >
            Log out
          </Button>
        </div>
      </form>
    </div>
  );
}
