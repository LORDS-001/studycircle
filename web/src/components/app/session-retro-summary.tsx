"use client";

import * as React from "react";
import { Star } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { useStore } from "@/lib/store";
import type { Retro } from "@/lib/types";
import { cn, plural } from "@/lib/utils";

const BALANCE: { value: Retro["balanced"]; label: string }[] = [
  { value: "yes", label: "Yes" },
  { value: "somewhat", label: "Somewhat" },
  { value: "no", label: "No" },
];

/** Combined retro for a session. Open answers are listed without names. */
export function RetroSummary({ sessionId, memberCount, className }: { sessionId: string; memberCount: number; className?: string }) {
  const retros = useStore(useShallow((s) => s.retros.filter((r) => r.sessionId === sessionId)));
  const id = React.useId();

  const avg = retros.length ? retros.reduce((a, r) => a + r.rating, 0) / retros.length : 0;
  const helped = retros.map((r) => r.helped).filter(Boolean);
  const change = retros.map((r) => r.change).filter(Boolean);

  return (
    <section aria-labelledby={id} className={className}>
      <div className="mb-4">
        <h2 id={id} className="text-lg font-bold tracking-tight">
          How it went
        </h2>
        <p className="text-sm text-muted-foreground">
          {retros.length
            ? `${retros.length} of ${memberCount} sent a retro. Written answers are anonymous.`
            : "Once people send their retros, a combined summary shows up here."}
        </p>
      </div>

      {retros.length > 0 && (
        <div className="rounded-[var(--radius-card)] border border-border bg-surface">
          <div className="grid gap-6 p-5 sm:grid-cols-[auto_1fr] sm:gap-10 sm:p-6">
            <div>
              <div className="flex items-end gap-2">
                <span className="text-[2.5rem] font-bold leading-none tracking-tight">{avg.toFixed(1)}</span>
                <span className="mb-1 text-sm font-medium text-muted-foreground">out of 5</span>
              </div>
              <div className="mt-2 flex gap-1" role="img" aria-label={`Average rating ${avg.toFixed(1)} out of 5`}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className={cn("size-4", i <= Math.round(avg) ? "fill-foreground text-foreground dark:fill-gold dark:text-gold" : "text-border-strong")} aria-hidden />
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold">Did everyone get a chance to contribute?</h3>
              <dl className="mt-3 space-y-2">
                {BALANCE.map(({ value, label }) => {
                  const n = retros.filter((r) => r.balanced === value).length;
                  return (
                    <div key={value} className="grid grid-cols-[5.5rem_1fr_2rem] items-center gap-3 text-sm">
                      <dt className="font-medium text-muted-foreground">{label}</dt>
                      <div className="h-2 overflow-hidden rounded-full bg-surface-3" aria-hidden>
                        <div
                          className="h-full rounded-full bg-teal transition-[width] duration-300 ease-[var(--ease-out)]"
                          style={{ width: `${(n / retros.length) * 100}%` }}
                        />
                      </div>
                      <dd className="text-right font-semibold tabular-nums">{n}</dd>
                    </div>
                  );
                })}
              </dl>
            </div>
          </div>

          {(helped.length > 0 || change.length > 0) && (
            <div className="grid border-t border-border sm:grid-cols-2 sm:divide-x sm:divide-border">
              <AnswerList title="What helped" answers={helped} />
              <AnswerList title="Change next time" answers={change} className="border-t border-border sm:border-t-0" />
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function AnswerList({ title, answers, className }: { title: string; answers: string[]; className?: string }) {
  return (
    <div className={cn("p-5 sm:p-6", className)}>
      <h3 className="flex items-baseline justify-between gap-2 text-sm font-semibold">
        {title}
        <span className="font-medium text-subtle-foreground">{plural(answers.length, "answer")}</span>
      </h3>
      {answers.length ? (
        <ul className="mt-3 space-y-2.5">
          {answers.map((a, i) => (
            <li key={i} className="border-l-2 border-border-strong pl-3 text-[0.9375rem] leading-6">
              {a}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">Nothing yet.</p>
      )}
    </div>
  );
}
