import { Caveat } from "next/font/google";
import { cn } from "@/lib/utils";

/** Handwriting face for the marketing pages' margin notes. Never used in the product UI. */
export const caveat = Caveat({ subsets: ["latin"], variable: "--font-caveat", weight: ["500", "700"], display: "swap" });

/** A handwritten margin note, like a classmate scribbled it on the page. */
export function HandNote({
  children,
  className,
  arrow,
}: {
  children: React.ReactNode;
  className?: string;
  arrow?: "down-right" | "down-left" | "left";
}) {
  return (
    <span aria-hidden className={cn("pointer-events-none inline-flex select-none items-start gap-1 font-hand font-bold leading-[0.95]", className)}>
      <span className="whitespace-pre-line">{children}</span>
      {arrow && (
        <svg
          viewBox="0 0 48 40"
          fill="none"
          className={cn(
            "mt-3 h-8 w-10 shrink-0",
            arrow === "down-left" && "order-first -scale-x-100",
            arrow === "left" && "order-first rotate-[70deg]",
          )}
        >
          <path d="M4 6c14 0 28 6 34 24" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
          <path d="M30 26l8 6 3-10" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
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

/** Soft organic shape for background decoration */
export function Blob({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("pointer-events-none absolute -z-10 block", className)}
      style={{ borderRadius: "58% 42% 55% 45% / 48% 58% 42% 52%" }}
    />
  );
}

export function SectionLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn("text-label mb-2 text-teal-text", className)}>{children}</p>;
}
