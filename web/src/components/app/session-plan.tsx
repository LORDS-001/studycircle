import type { TemplateStep } from "@/lib/templates";
import { cn, formatDuration } from "@/lib/utils";

/** The template's steps as a compact timeline, with minutes per step. */
export function StepsTimeline({
  steps,
  current,
  showInstructions,
  className,
}: {
  steps: TemplateStep[];
  /** Index of the live step, if the session is running */
  current?: number;
  showInstructions?: boolean;
  className?: string;
}) {
  const total = steps.reduce((a, s) => a + s.minutes, 0);
  return (
    <div className={className}>
      <ol className="relative">
        {steps.map((step, i) => {
          const isCurrent = current === i;
          const isDone = current !== undefined && i < current;
          const last = i === steps.length - 1;
          return (
            <li key={`${step.title}-${i}`} className="relative flex gap-3 pb-3 last:pb-0" aria-current={isCurrent ? "step" : undefined}>
              {!last && <span className="absolute bottom-0 left-[5px] top-4 w-px bg-border-strong" aria-hidden />}
              <span
                className={cn(
                  "relative mt-[5px] size-[11px] shrink-0 rounded-full border-2",
                  isCurrent ? "border-teal bg-teal" : isDone ? "border-foreground/40 bg-foreground/40" : "border-border-strong bg-surface",
                )}
                aria-hidden
              />
              <div className="flex min-w-0 flex-1 items-baseline justify-between gap-3">
                <div className="min-w-0">
                  <p className={cn("text-[0.9375rem] font-semibold leading-5", isDone && "text-muted-foreground")}>
                    {step.title}
                    {isCurrent && <span className="ml-2 text-sm font-semibold text-teal-text">Now</span>}
                  </p>
                  {showInstructions && <p className="mt-0.5 text-sm leading-5 text-muted-foreground">{step.instruction}</p>}
                </div>
                <span className="shrink-0 text-sm font-medium tabular-nums text-muted-foreground">{step.minutes} min</span>
              </div>
            </li>
          );
        })}
      </ol>
      <p className="mt-3 border-t border-border pt-3 text-sm text-muted-foreground">
        {steps.length} steps, {formatDuration(total)} in total
      </p>
    </div>
  );
}
