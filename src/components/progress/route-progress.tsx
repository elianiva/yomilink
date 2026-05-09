import { useProgress } from "@bprogress/react";
import { useRouterState } from "@tanstack/react-router";
import { useEffect, useRef } from "react";

export function RouteProgress() {
	const { start, stop } = useProgress();

	const isPending = useRouterState({
		select: (s) => s.isLoading || s.isTransitioning || s.status === "pending",
	});

	const startedRef = useRef(false);

	useEffect(() => {
		let startTimer: number | undefined;
		let stopTimer: number | undefined;

		if (isPending && !startedRef.current) {
			startTimer = window.setTimeout(() => {
				start();
				startedRef.current = true;
			}, 80);
		} else if (!isPending && startedRef.current) {
			stopTimer = window.setTimeout(() => {
				stop();
				startedRef.current = false;
			}, 150);
		}

		return () => {
			if (startTimer) window.clearTimeout(startTimer);
			if (stopTimer) window.clearTimeout(stopTimer);
		};
	}, [isPending, start, stop]);

	return null;
}

export default RouteProgress;
