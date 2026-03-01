import { useNavigate } from "@tanstack/react-router";
import { Activity, Download, RefreshCw } from "lucide-react";
import { useCallback } from "react";

import { ToolbarButton } from "@/components/toolbar/toolbar-button";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { TooltipTriggerProps } from "@/components/ui/tooltip";
import type { AssignmentAnalytics } from "@/features/analyzer/lib/analytics-service";
import { useRpcMutation } from "@/hooks/use-rpc-query";
import { toast } from "@/lib/error-toast";
import { AnalyticsRpc } from "@/server/rpc/analytics";

interface AnalyticsToolbarProps {
	selectedAssignmentId: string | null;
	analyticsData: AssignmentAnalytics | null;
	tooltipHandle: TooltipTriggerProps["handle"];
	onRefresh: () => void;
}

export function AnalyticsToolbar({
	selectedAssignmentId,
	analyticsData,
	tooltipHandle,
	onRefresh,
}: AnalyticsToolbarProps) {
	const navigate = useNavigate();

	const exportMutation = useRpcMutation(
		{
			...AnalyticsRpc.exportAnalyticsData(),
			onSuccess: (result) => {
				if (!result.success) return;
				const blob = new Blob([result.data.data], {
					type: result.data.contentType,
				});
				const url = URL.createObjectURL(blob);
				const a = document.createElement("a");
				a.href = url;
				a.download = result.data.filename;
				document.body.appendChild(a);
				a.click();
				document.body.removeChild(a);
				URL.revokeObjectURL(url);
				toast.success(`Exported ${result.data.filename}`);
			},
		},
		{
			operation: "export analytics",
			showSuccess: false,
		},
	);

	const handleExport = useCallback(
		(format: "csv" | "json") => {
			if (!selectedAssignmentId || !analyticsData) return;
			exportMutation.mutate({ analytics: analyticsData, format });
		},
		[selectedAssignmentId, exportMutation, analyticsData],
	);

	const handleMetrics = () => {
		if (!selectedAssignmentId) {
			toast.warning("Please select an assignment first");
			return;
		}
		navigate({
			to: "/dashboard/analytics/$assignmentId/metrics",
			params: { assignmentId: selectedAssignmentId },
		});
	};

	return (
		<div className="border-b-[0.5px] bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/50">
			<div className="h-12 px-3 flex items-center gap-2">
				<div className="font-medium">Analytics</div>
				<div className="ml-auto flex items-center gap-1.5">
					<ToolbarButton
						icon={RefreshCw}
						label="Refresh"
						onClick={onRefresh}
						handle={tooltipHandle}
					/>

					<Separator className="h-6" orientation="vertical" />

					<Button
						variant="outline"
						size="sm"
						className="h-8 gap-1"
						onClick={() => handleExport("csv")}
						disabled={!selectedAssignmentId || exportMutation.isPending}
					>
						<Download className="size-4" />
						Export CSV
					</Button>
					<Button
						variant="outline"
						size="sm"
						className="h-8 gap-1"
						onClick={() => handleExport("json")}
						disabled={!selectedAssignmentId || exportMutation.isPending}
					>
						<Download className="size-4" />
						Export JSON
					</Button>

					<Separator className="h-6" orientation="vertical" />

					<ToolbarButton
						icon={Activity}
						label="Metrics"
						onClick={handleMetrics}
						disabled={!selectedAssignmentId}
						handle={tooltipHandle}
					/>
				</div>
			</div>
		</div>
	);
}
