import { useMemo, useRef } from "react";

export function useStableSerializedValue<T>(value: T): T {
	const key = useMemo(() => JSON.stringify(value), [value]);
	const ref = useRef<{ key: string; value: T }>({ key, value });

	if (ref.current.key !== key) {
		ref.current = { key, value };
	}

	return ref.current.value;
}
