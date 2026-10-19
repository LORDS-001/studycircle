import { cn } from "@/lib/utils";

/** A quiet two-or-three step indicator: "Step 1 of 2 · Your profile" over segmented bars. */
export function StepProgress({
  steps,
  current,
  className,
  showName = true,
}: {
  steps: string[];
  current: number;
  className?: string;
  /** Hide the step name when the step's own heading already says it */
  showName?: boolean;
}) {
  return (
    <div className={className}>
      <p className="text-sm font-semibold text-muted-foreground" aria-live="polite">
        Step {current + 1} of {steps.length}
        {showName ? (
          <span className="text-foreground"> · {steps[current]}</span>
        ) : (
          <span className="sr-only">: {steps[current]}</span>
        )}
      </p>
      <ol className="mt-2.5 flex gap-1.5">
        {steps.map((label, i) => (
          <li key={label} className="flex-1" aria-current={i === current ? "step" : undefined}>
            <span className="sr-only">
              {label}
              {i < current ? ", done" : i === current ? ", current step" : ""}
            </span>
            <span
              aria-hidden
              className={cn(
                "block h-1.5 rounded-full transition-colors duration-300 ease-[var(--ease-out)]",
                i <= current ? "bg-teal" : "bg-surface-3",
              )}
            />
          </li>
        ))}
      </ol>
    </div>
  );
}
