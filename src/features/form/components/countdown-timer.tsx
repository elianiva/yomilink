import { useEffect, useState } from "react";
import type * as React from "react";

interface CountdownTimerProps {
  targetDate: Date | string | number;
  onComplete?: () => void;
  className?: string;
  showDays?: boolean;
  showHours?: boolean;
  showMinutes?: boolean;
  showSeconds?: boolean;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

function calculateTimeRemaining(targetDate: Date | string | number): TimeRemaining {
  const target = new Date(targetDate).getTime();
  const now = Date.now();
  const difference = target - now;

  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
  }

  const days = Math.floor(difference / (1000 * 60 * 60 * 24));
  const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((difference % (1000 * 60)) / 1000);

  return { days, hours, minutes, seconds, total: difference };
}

export function CountdownTimer({
  targetDate,
  onComplete,
  className = "",
  showDays = true,
  showHours = true,
  showMinutes = true,
  showSeconds = true,
}: CountdownTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>(() =>
    calculateTimeRemaining(targetDate)
  );

  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = calculateTimeRemaining(targetDate);
      setTimeRemaining(remaining);

      if (remaining.total <= 0) {
        clearInterval(timer);
        onComplete?.();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate, onComplete]);

  if (timeRemaining.total <= 0) {
    return (
      <div className={className}>
        <span className="text-green-600 font-medium">Available now</span>
      </div>
    );
  }

  const parts: React.ReactNode[] = [];

  if (showDays && timeRemaining.days > 0) {
    parts.push(
      <span key="days" className="countdown-days">
        <span className="countdown-value">{timeRemaining.days}</span>
        <span className="countdown-label">d</span>
      </span>
    );
  }

  if (showHours && timeRemaining.hours > 0) {
    parts.push(
      <span key="hours" className="countdown-hours">
        <span className="countdown-value">{timeRemaining.hours}</span>
        <span className="countdown-label">h</span>
      </span>
    );
  }

  if (showMinutes && timeRemaining.minutes > 0) {
    parts.push(
      <span key="minutes" className="countdown-minutes">
        <span className="countdown-value">{timeRemaining.minutes}</span>
        <span className="countdown-label">m</span>
      </span>
    );
  }

  if (showSeconds || (parts.length === 0)) {
    parts.push(
      <span key="seconds" className="countdown-seconds">
        <span className="countdown-value">{timeRemaining.seconds}</span>
        <span className="countdown-label">s</span>
      </span>
    );
  }

  return (
    <div className={`countdown-timer flex items-center gap-1 ${className}`}>
      <span className="text-muted-foreground text-sm">Unlocks in:</span>
      <div className="flex items-center gap-1">
        {parts.reduce<React.ReactNode[]>((acc, part, index) => {
          if (index > 0) {
            acc.push(<span key={`sep-${index}`} className="text-muted-foreground mx-0.5">:</span>);
          }
          acc.push(part);
          return acc;
        }, [])}
      </div>
    </div>
  );
}

export function createDefaultCountdownData(): Pick<CountdownTimerProps, "showDays" | "showHours" | "showMinutes" | "showSeconds"> {
  return {
    showDays: true,
    showHours: true,
    showMinutes: true,
    showSeconds: true,
  };
}
