"use client";

import { useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { type FormUnlockStatus, useFormUnlock } from "@/hooks/use-form-unlock";

interface RestrictiveFormGuardProps {
	formId: string;
	redirectUrl?: string;
	pollingInterval?: number;
	enabled?: boolean;
	children: React.ReactNode;
}

export function RestrictiveFormGuard({
	formId,
	redirectUrl,
	pollingInterval = 30000,
	enabled = true,
	children,
}: RestrictiveFormGuardProps) {
	const navigate = useNavigate();
	const [hasRedirected, setHasRedirected] = useState(false);
	const [status, setStatus] = useState<FormUnlockStatus | null>(null);

	const { isLoading, data, isError } = useFormUnlock({
		formId,
		pollingInterval,
		enabled: enabled && !!formId,
	});

	useEffect(() => {
		if (data) {
			setStatus(data as FormUnlockStatus);
		}
	}, [data]);

	useEffect(() => {
		if (!enabled || !formId || hasRedirected) {
			return;
		}

		if (status && !status.isUnlocked && redirectUrl) {
			setHasRedirected(true);
			navigate({ to: redirectUrl });
		}
	}, [status, redirectUrl, navigate, enabled, formId, hasRedirected]);

	if (!enabled || !formId) {
		return <>{children}</>;
	}

	if (isError) {
		return (
			<div className="flex flex-col items-center justify-center min-h-[200px] gap-4">
				<p className="text-destructive">Failed to check form status</p>
				<Button variant="outline" onClick={() => window.location.reload()}>
					Retry
				</Button>
			</div>
		);
	}

	if (isLoading || !status) {
		return (
			<div className="flex items-center justify-center min-h-[200px]">
				<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
			</div>
		);
	}

	if (!status.isUnlocked && redirectUrl) {
		return (
			<div className="flex flex-col items-center justify-center min-h-[200px] gap-4 text-center">
				<div className="space-y-2">
					<h3 className="text-lg font-semibold">Form Required</h3>
					<p className="text-muted-foreground max-w-md">
						{status.reason ||
							"You must complete a required form before accessing this page."}
					</p>
					{status.earliestUnlockAt && (
						<p className="text-sm text-muted-foreground">
							Available after:{" "}
							{new Date(status.earliestUnlockAt).toLocaleString()}
						</p>
					)}
				</div>
				{redirectUrl && (
					<Button onClick={() => navigate({ to: redirectUrl })}>
						Complete Form
					</Button>
				)}
			</div>
		);
	}

	if (!status.isUnlocked && !redirectUrl) {
		return (
			<div className="flex flex-col items-center justify-center min-h-[200px] gap-4 text-center">
				<div className="space-y-2">
					<h3 className="text-lg font-semibold">Form Required</h3>
					<p className="text-muted-foreground max-w-md">
						{status.reason ||
							"You must complete a required form before accessing this page."}
					</p>
					{status.earliestUnlockAt && (
						<p className="text-sm text-muted-foreground">
							Available after:{" "}
							{new Date(status.earliestUnlockAt).toLocaleString()}
						</p>
					)}
				</div>
			</div>
		);
	}

	return <>{children}</>;
}
