import { useProgress } from "@bprogress/react";
import { useRouterState } from "@tanstack/react-router";
import { useEffect, useRef } from "react";

export function RouteProgress() {
  const { start, stop } = useProgress();

  const isPending = useRouterState({
    // Be tolerant to router state shape across versions
    select: (s) => {
      const anyS = s as any;
      return Boolean(
        anyS?.isLoading ??
          anyS?.isTransitioning ??
          (typeof anyS?.status === "string" && anyS.status === "pending") ??
          anyS?.pending,
      );
    },
  });

  const startedRef = useRef(false);

  useEffect(() => {
    let startTimer: number | undefined;
    let stopTimer: number | undefined;

    if (isPending && !startedRef.current) {
      // Small delay to avoid flicker on fast transitions
      startTimer = window.setTimeout(() => {
        start();
        startedRef.current = true;
      }, 80);
    } else if (!isPending && startedRef.current) {
      // Allow a brief minimum visibility for smooth finish
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
