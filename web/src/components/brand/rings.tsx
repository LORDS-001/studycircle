import { cn } from "@/lib/utils";
import { arcPath } from "./logo";

/*
 * Rings borrow the mark's grammar — rounded segments around a circle —
 * to show real data. They are not the logo, so the segment count follows the data.
 */

function segments(count: number, gapDeg: number) {
  const span = 360 / count;
  return Array.from({ length: count }, (_, i) => {
    const center = -90 + span * i + span / 2;
    const half = span / 2 - gapDeg / 2;
    return { start: center - half, end: center + half };
  });
}

/** Group capacity: one segment per seat, filled seats are members. */
export function SeatRing({
  filled,
  total,
  size = 40,
  className,
}: {
  filled: number;
  total: number;
  size?: number;
  className?: string;
}) {
  const stroke = total > 5 ? 5.5 : 6.5;
  const gap = total > 5 ? 34 : 30;
  const full = filled >= total;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      role="img"
      aria-label={`${filled} of ${total} seats taken`}
      className={cn("shrink-0", className)}
    >
      {segments(total, gap).map((s, i) => (
        <path
          key={i}
          d={arcPath(24, 24, 18.5, s.start, s.end)}
          strokeWidth={stroke}
          strokeLinecap="round"
          className={cn(
            i < filled ? (full ? "stroke-foreground" : "stroke-teal") : "stroke-foreground/12",
          )}
        />
      ))}
    </svg>
  );
}

/**
 * Session Mode ring: one segment per step. Done steps are solid,
 * the current step fills with progress (0–1), future steps are faint.
 */
export function StepRing({
  steps,
  current,
  progress,
  size = 320,
  className,
  children,
}: {
  steps: number;
  current: number;
  progress: number;
  size?: number;
  className?: string;
  children?: React.ReactNode;
}) {
  const gap = steps > 8 ? 6 : steps > 5 ? 9 : 12;
  const segs = segments(steps, gap);
  const r = 21;
  return (
    <div className={cn("relative grid place-items-center", className)} style={{ width: size, height: size }}>
      <svg viewBox="0 0 48 48" fill="none" className="absolute inset-0 size-full" aria-hidden>
        {segs.map((s, i) => {
          const isDone = i < current;
          const isCurrent = i === current;
          return (
            <g key={i}>
              <path
                d={arcPath(24, 24, r, s.start, s.end)}
                strokeWidth={2.4}
                strokeLinecap="round"
                className={isDone ? "stroke-brand-cream/80" : "stroke-brand-cream/14"}
              />
              {isCurrent && progress > 0.002 && (
                <path
                  d={arcPath(24, 24, r, s.start, s.start + (s.end - s.start) * Math.min(1, progress))}
                  strokeWidth={2.4}
                  strokeLinecap="round"
                  className="stroke-brand-gold"
                />
              )}
            </g>
          );
        })}
      </svg>
      <div className="relative">{children}</div>
    </div>
  );
}
