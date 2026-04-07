import { FormRpc } from "@/server/rpc/form";

import { useRpcQuery } from "./use-rpc-query";

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
	const query = useRpcQuery({
		...FormRpc.checkFormUnlock({ formId }),
		enabled: enabled && !!formId,
		refetchInterval: pollingInterval,
	});

	const status = query.data ?? null;

	return {
		...query,
		status,
		isUnlocked: status?.isUnlocked ?? false,
		reason: status?.reason ?? null,
		earliestUnlockAt: status?.earliestUnlockAt ?? null,
	};
}
