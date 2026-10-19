import Link from "next/link";
import { Caveat } from "next/font/google";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** Handwriting face for the marketing pages' margin notes. Never used in the product UI. */
export const caveat = Caveat({ subsets: ["latin"], variable: "--font-caveat", weight: ["500", "700"], display: "swap" });

const EASE = "ease-[cubic-bezier(0.32,0.72,0,1)]";

/** A handwritten margin note, like a classmate scribbled it on the page. */
export function HandNote({
  children,
  className,
  arrow,
}: {
  children: React.ReactNode;
  className?: string;
  arrow?: "down-right" | "down-left";
}) {
  return (
    <span aria-hidden className={cn("pointer-events-none inline-flex select-none items-start gap-1 font-hand font-bold leading-[0.95]", className)}>
      <span className="whitespace-pre-line">{children}</span>
      {arrow && (
        <svg viewBox="0 0 48 40" fill="none" className={cn("mt-3 h-8 w-10 shrink-0", arrow === "down-left" && "order-first -scale-x-100")}>
          <path d="M4 6c14 0 28 6 34 24" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M30 26l8 6 3-10" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </span>
  );
}

/** Hand-drawn underline */
export function Squiggle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 12" fill="none" aria-hidden className={cn("h-3 w-28", className)} preserveAspectRatio="none">
      <path d="M2 8c18-6 30 4 48-1s30-5 44 0 18 2 24-2" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/** Soft ambient light. Radial gradients only, so it costs nothing to scroll past. */
export function Glow({ className, tone = "teal" }: { className?: string; tone?: "teal" | "gold" | "blue" }) {
  const color = tone === "teal" ? "var(--teal)" : tone === "gold" ? "var(--gold)" : "#243b6b";
  return (
    <span
      aria-hidden
      className={cn("pointer-events-none absolute -z-10 block rounded-full", className)}
      style={{ background: `radial-gradient(closest-side, color-mix(in srgb, ${color} 22%, transparent), transparent)` }}
    />
  );
}

/** Small pill eyebrow above a section heading */
export function Eyebrow({ children, className, tone = "light" }: { children: React.ReactNode; className?: string; tone?: "light" | "dark" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]",
        tone === "light" ? "bg-surface text-teal-text ring-1 ring-border" : "bg-white/10 text-brand-gold ring-1 ring-white/15",
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", tone === "light" ? "bg-teal" : "bg-brand-gold")} />
      {children}
    </span>
  );
}

/**
 * Double-bezel frame: an outer tray with a hairline and a little padding,
 * and an inner core with concentric corners. Reads like machined hardware.
 */
export function Bezel({
  children,
  className,
  innerClassName,
  radius = "2rem",
  tone = "light",
}: {
  children: React.ReactNode;
  className?: string;
  innerClassName?: string;
  radius?: string;
  tone?: "light" | "dark";
}) {
  return (
    <div
      className={cn(
        "p-1.5",
        tone === "light" ? "bg-foreground/[0.035] ring-1 ring-foreground/[0.06] dark:bg-white/[0.03]" : "bg-white/[0.06] ring-1 ring-white/10",
        className,
      )}
      style={{ borderRadius: radius }}
    >
      <div
        className={cn(
          "relative h-full overflow-hidden",
          tone === "light"
            ? "bg-surface shadow-[inset_0_1px_0_rgb(255_255_255/0.7),0_1px_2px_rgb(36_59_107/0.05),0_20px_40px_-24px_rgb(36_59_107/0.22)] dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.06)]"
            : "bg-white/[0.04] shadow-[inset_0_1px_0_rgb(255_255_255/0.08)]",
          innerClassName,
        )}
        style={{ borderRadius: `calc(${radius} - 0.375rem)` }}
      >
        {children}
      </div>
    </div>
  );
}

/** Pill CTA with its arrow nested in its own circle */
export function ArrowButton({
  href,
  children,
  variant = "primary",
  className,
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "teal" | "gold" | "ghost" | "light";
  className?: string;
}) {
  const styles = {
    primary: { shell: "bg-primary text-primary-foreground hover:bg-primary-hover", dot: "bg-white/15 dark:bg-brand-blue/10" },
    teal: { shell: "bg-teal text-white hover:bg-teal-hover", dot: "bg-white/20" },
    gold: { shell: "bg-brand-gold text-brand-blue hover:brightness-[0.97]", dot: "bg-brand-blue/10" },
    light: { shell: "bg-brand-cream text-brand-blue hover:bg-white", dot: "bg-brand-blue/10" },
    ghost: {
      shell: "bg-surface text-foreground ring-1 ring-border-strong hover:ring-foreground/30",
      dot: "bg-foreground/[0.06]",
    },
  }[variant];
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex h-14 items-center justify-between gap-4 rounded-full py-2 pl-7 pr-2 text-base font-semibold transition-[transform,background-color,box-shadow,filter] duration-300 active:scale-[0.98]",
        EASE,
        styles.shell,
        className,
      )}
    >
      {children}
      <span
        className={cn(
          "grid size-10 place-items-center rounded-full transition-transform duration-500 group-hover:-translate-y-px group-hover:translate-x-0.5 group-hover:scale-105",
          EASE,
          styles.dot,
        )}
      >
        <ArrowUpRight className="size-[18px]" strokeWidth={1.8} />
      </span>
    </Link>
  );
}
