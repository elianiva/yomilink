import { Badge } from "@/components/ui/badge";

interface DiagnosisStatsProps {
    correct: number;
    missing: number;
    excessive: number;
    total: number;
    score: number;
}

function StatPill({ label, value }: { label: string; value: number }) {
    return (
        <div className="flex items-center justify-between gap-2 first:rounded-l-sm last:rounded-r-sm first:border-r-0 last:border-l-0 border border-border/60 bg-background py-1 px-2">
            <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                {label}
            </span>
            <span className="text-sm font-semibold tabular-nums">{value}</span>
        </div>
    );
}

export function DiagnosisStats({ correct, missing, excessive, total, score }: DiagnosisStatsProps) {
    const hasEdges = total > 0;
    const percentage = hasEdges ? Math.round(score * 100) : 0;

    return (
        <div>
            <div className="flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                    <p className="text-sm font-medium">Score</p>
                    <p className="text-[11px] text-muted-foreground capitalize">
                        goal map comparison
                    </p>
                </div>
                <div className="text-right">
                    <div className="text-xl font-semibold tabular-nums">
                        {hasEdges ? `${percentage}%` : "—"}
                    </div>
                    <p className="text-[11px] text-muted-foreground">match rate</p>
                </div>
            </div>

            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                />
            </div>

            <div className="mt-2 grid grid-cols-3">
                <StatPill label="Correct" value={correct} />
                <StatPill label="Missing" value={missing} />
                <StatPill label="Extra" value={excessive} />
            </div>

            <div className="mt-1 flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
                {hasEdges ? `${correct}/${total} matched` : "No edges"}
            </div>
        </div>
    );
}
