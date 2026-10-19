import { cn } from "@/lib/utils";

/*
 * The mark: five segments, one circle. Segment 0 is top-right — the lit one,
 * the teacher. Gaps sit on 72° boundaries starting at 12 o'clock.
 * Never rotate it and never light more than one segment.
 */

const CENTERS = [-54, 18, 90, 162, 234];

export function arcPath(cx: number, cy: number, r: number, startDeg: number, endDeg: number) {
  const rad = (d: number) => (d * Math.PI) / 180;
  const x1 = cx + r * Math.cos(rad(startDeg));
  const y1 = cy + r * Math.sin(rad(startDeg));
  const x2 = cx + r * Math.cos(rad(endDeg));
  const y2 = cy + r * Math.sin(rad(endDeg));
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${x1.toFixed(3)} ${y1.toFixed(3)} A ${r} ${r} 0 ${large} 1 ${x2.toFixed(3)} ${y2.toFixed(3)}`;
}

export function Mark({
  size = 28,
  tone = "auto",
  className,
  title = "StudyCircle",
}: {
  size?: number;
  /** auto = blue + teal in light theme, cream + gold in dark theme */
  tone?: "auto" | "light" | "dark";
  className?: string;
  title?: string | null;
}) {
  const base =
    tone === "light" ? "stroke-brand-blue" : tone === "dark" ? "stroke-brand-cream" : "stroke-brand-blue dark:stroke-brand-cream";
  const lit =
    tone === "light" ? "stroke-brand-teal" : tone === "dark" ? "stroke-brand-gold" : "stroke-brand-teal dark:stroke-brand-gold";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title ?? undefined}
      className={cn("shrink-0", className)}
    >
      {CENTERS.map((c, i) => (
        <path
          key={c}
          d={arcPath(24, 24, 18.5, c - 19, c + 19)}
          strokeWidth={6.5}
          strokeLinecap="round"
          className={i === 0 ? lit : base}
        />
      ))}
    </svg>
  );
}

export function Logo({
  size = 28,
  tone = "auto",
  className,
}: {
  size?: number;
  tone?: "auto" | "light" | "dark";
  className?: string;
}) {
  const text =
    tone === "light" ? "text-brand-blue" : tone === "dark" ? "text-brand-cream" : "text-brand-blue dark:text-brand-cream";
  return (
    <span className={cn("inline-flex items-center", className)} style={{ gap: size * 0.32 }}>
      <Mark size={size} tone={tone} title={null} />
      <span
        className={cn("font-bold leading-none", text)}
        style={{ fontSize: size * 0.82, letterSpacing: "-0.045em" }}
      >
        studycircle
      </span>
      <span className="sr-only">StudyCircle</span>
    </span>
  );
}

/** Loading indicator built from the mark: the lit segment travels the circle. */
export function CircleLoader({ size = 28, className, label = "Loading" }: { size?: number; className?: string; label?: string }) {
  return (
    <span role="status" aria-label={label} className={cn("inline-flex", className)}>
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden>
        {CENTERS.map((c, i) => (
          <path
            key={c}
            d={arcPath(24, 24, 18.5, c - 19, c + 19)}
            strokeWidth={6.5}
            strokeLinecap="round"
            className="stroke-foreground/15"
            style={{ animation: `sc-lit 1.25s ${i * 0.25}s infinite steps(1, end)` }}
          />
        ))}
      </svg>
      <style>{`@keyframes sc-lit{0%{stroke:var(--teal)}20%{stroke:color-mix(in srgb,var(--foreground) 15%,transparent)}}`}</style>
    </span>
  );
}
