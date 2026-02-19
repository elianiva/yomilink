import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { FormRpc } from "@/server/rpc/form";

export type FormUnlockStatus = {
	isUnlocked: boolean;
	reason: string | null;
	earliestUnlockAt: string | null;
};

export type UseFormUnlockOptions = {
	formId: string;
	pollingInterval?: number;
	enabled?: boolean;
};

export function useFormUnlock({
	formId,
	pollingInterval = 30000,
	enabled = true,
}: UseFormUnlockOptions) {
	const [localStatus, setLocalStatus] = useState<FormUnlockStatus | null>(null);

	const query = useQuery({
		...FormRpc.checkFormUnlock({ formId }),
		enabled: enabled && !!formId,
		refetchInterval: pollingInterval,
	});

	useEffect(() => {
		if (query.data && !query.isError) {
			setLocalStatus(query.data as FormUnlockStatus);
		}
	}, [query.data, query.isError]);

	const status = localStatus ?? {
		isUnlocked: false,
		reason: null,
		earliestUnlockAt: null,
	};

	return {
		...query,
		status,
		isUnlocked: status.isUnlocked,
		reason: status.reason,
		earliestUnlockAt: status.earliestUnlockAt,
	};
}
