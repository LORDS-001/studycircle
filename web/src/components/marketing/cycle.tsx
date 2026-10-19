"use client";

import * as React from "react";
import { arcPath } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

const STAGES = [
  {
    title: "Form your circle",
    body: "Create a group inside your course, write a short charter, and share one invite link on WhatsApp. Three to six people, because small groups actually talk.",
  },
  {
    title: "Find a time",
    body: "Everyone paints their free hours once. The heatmap shows when the most people are free and suggests the top three slots.",
  },
  {
    title: "Prepare",
    body: "RSVPs, a prep checklist and reminders 24 hours and 1 hour before. Everyone adds a couple of questions to the shared bank.",
  },
  {
    title: "Run the session",
    body: "Session Mode walks the group through a proven template with a shared timer and rotating roles, so nobody has to be the organiser every time.",
  },
  {
    title: "Reflect",
    body: "A two-minute retro and shared notes. The next session gets better, the roles rotate, and the circle starts again.",
  },
];

const CENTERS = [-54, 18, 90, 162, 234];

export function Cycle() {
  const [active, setActive] = React.useState(0);
  const stage = STAGES[active];
  return (
    <div className="grid items-center gap-10 md:grid-cols-[minmax(0,420px)_1fr] md:gap-16">
      <div className="relative mx-auto aspect-square w-full max-w-[380px]">
        <svg viewBox="0 0 48 48" fill="none" className="size-full" role="tablist" aria-label="The StudyCircle cycle">
          {CENTERS.map((c, i) => (
            <path
              key={c}
              role="tab"
              tabIndex={i === active ? 0 : -1}
              aria-selected={i === active}
              aria-label={STAGES[i].title}
              d={arcPath(24, 24, 18.5, c - 19, c + 19)}
              strokeWidth={6.5}
              strokeLinecap="round"
              onClick={() => setActive(i)}
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              onKeyDown={(e) => {
                if (e.key === "ArrowRight" || e.key === "ArrowDown") {
                  e.preventDefault();
                  setActive((active + 1) % 5);
                  (e.currentTarget.parentNode?.children[(active + 1) % 5] as SVGPathElement | undefined)?.focus();
                }
                if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
                  e.preventDefault();
                  setActive((active + 4) % 5);
                  (e.currentTarget.parentNode?.children[(active + 4) % 5] as SVGPathElement | undefined)?.focus();
                }
              }}
              className={cn(
                "cursor-pointer outline-none transition-[stroke] duration-200",
                i === active ? "stroke-teal dark:stroke-gold" : "stroke-foreground hover:stroke-foreground/80",
                "focus-visible:[stroke-width:7.5]",
              )}
            />
          ))}
        </svg>
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div>
            <div className="text-[clamp(2.5rem,8vw,4rem)] font-bold leading-none tracking-[-0.05em]">{active + 1}</div>
            <div className="mt-1 text-sm font-semibold text-muted-foreground">of 5</div>
          </div>
        </div>
      </div>
      <div role="tabpanel" aria-live="polite" className="min-h-[200px]">
        <ol className="mb-6 flex flex-wrap gap-2">
          {STAGES.map((s, i) => (
            <li key={s.title}>
              <button
                onClick={() => setActive(i)}
                className={cn(
                  "pressable h-9 rounded-full border px-3.5 text-sm font-semibold transition-colors",
                  i === active
                    ? "border-foreground bg-foreground text-background"
                    : "border-border-strong text-muted-foreground hover:border-foreground/40 hover:text-foreground",
                )}
              >
                {s.title}
              </button>
            </li>
          ))}
        </ol>
        <h3 key={stage.title} className="animate-fade-in text-h2">
          {stage.title}
        </h3>
        <p key={stage.body} className="mt-3 max-w-lg animate-fade-in text-lg leading-8 text-muted-foreground">
          {stage.body}
        </p>
      </div>
    </div>
  );
}
