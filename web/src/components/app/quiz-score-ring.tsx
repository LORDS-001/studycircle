import { arcPath } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

/*
 * Quiz score in the ring grammar: one rounded segment per question.
 * Designed for the brand-blue results card: cream for "Got it", gold when it's a
 * great result, faint cream for "Not yet". Long quizzes become one continuous arc.
 */
export function QuizScoreRing({
  correct,
  total,
  celebrate,
  size = 168,
  className,
  children,
}: {
  correct: number;
  total: number;
  celebrate?: boolean;
  size?: number;
  className?: string;
  children?: React.ReactNode;
}) {
  const r = 20.5;
  const on = celebrate ? "stroke-brand-gold" : "stroke-brand-cream/85";
  const off = "stroke-brand-cream/15";
  const segmented = total > 0 && total <= 20;
  const gap = total > 12 ? 7 : total > 6 ? 10 : 14;
  const span = total ? 360 / total : 360;

  return (
    <div className={cn("relative grid shrink-0 place-items-center", className)} style={{ width: size, height: size }}>
      <svg viewBox="0 0 48 48" fill="none" className="absolute inset-0 size-full" aria-hidden>
        {segmented ? (
          Array.from({ length: total }, (_, i) => {
            const c = -90 + span * i + span / 2;
            const half = span / 2 - gap / 2;
            return (
              <path
                key={i}
                d={arcPath(24, 24, r, c - half, c + half)}
                strokeWidth={3.2}
                strokeLinecap="round"
                className={i < correct ? on : off}
              />
            );
          })
        ) : (
          <>
            <circle cx={24} cy={24} r={r} strokeWidth={3.2} className={off} />
            {correct > 0 && (
              <path
                d={arcPath(24, 24, r, -90, -90 + Math.min(359.9, (360 * correct) / Math.max(1, total)))}
                strokeWidth={3.2}
                strokeLinecap="round"
                className={on}
              />
            )}
          </>
        )}
      </svg>
      <div className="relative text-center">{children}</div>
    </div>
  );
}
