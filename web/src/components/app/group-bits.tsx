"use client";

import * as React from "react";
import { differenceInCalendarDays, format } from "date-fns";
import { CalendarClock, Flag, Lock, Plus, Repeat, Target, Globe, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/field";
import { Panel } from "@/components/ui/surface";
import { GOALS } from "@/lib/templates";
import type { Group } from "@/lib/types";
import { cn } from "@/lib/utils";

export function VisibilityBadge({ visibility }: { visibility: Group["visibility"] }) {
  return visibility === "private" ? (
    <Badge variant="outline">
      <Lock /> Private
    </Badge>
  ) : (
    <Badge variant="outline">
      <Globe /> Public
    </Badge>
  );
}

export function examCountdown(examDate?: string) {
  if (!examDate) return null;
  const days = differenceInCalendarDays(new Date(examDate), new Date());
  if (days < 0) return "Exam passed";
  if (days === 0) return "Exam today";
  if (days === 1) return "Exam tomorrow";
  if (days < 14) return `${days} days to the exam`;
  return `${Math.round(days / 7)} weeks to the exam`;
}

/** The group charter: goal, norms, cadence, exam date. */
export function CharterCard({ group, className, action }: { group: Group; className?: string; action?: React.ReactNode }) {
  const rows = [
    { icon: Target, label: "Goal", value: GOALS[group.goal] },
    { icon: Repeat, label: "Cadence", value: group.cadence },
    {
      icon: CalendarClock,
      label: "Exam",
      value: group.examDate ? (
        <>
          {format(new Date(group.examDate), "EEE d MMMM")}
          <span className="block text-sm font-medium text-muted-foreground">{examCountdown(group.examDate)}</span>
        </>
      ) : (
        "Not set"
      ),
    },
  ];
  return (
    <Panel className={cn("p-5 sm:p-6", className)}>
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-h3">
          <Flag className="size-[18px] text-teal-text" strokeWidth={2.4} />
          Group charter
        </h2>
        {action}
      </div>
      <dl className="grid gap-4 sm:grid-cols-3">
        {rows.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex gap-3">
            <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-surface-2 text-muted-foreground">
              <Icon className="size-[18px]" />
            </div>
            <div className="min-w-0">
              <dt className="text-xs font-semibold text-muted-foreground">{label}</dt>
              <dd className="font-bold leading-6">{value}</dd>
            </div>
          </div>
        ))}
      </dl>
      {group.norms.length > 0 && (
        <div className="mt-5 border-t border-border pt-4">
          <h3 className="mb-2.5 text-xs font-semibold text-muted-foreground">We agreed to</h3>
          <ul className="flex flex-wrap gap-2">
            {group.norms.map((n) => (
              <li key={n} className="rounded-full border border-border-strong px-3 py-1 text-sm font-medium">
                {n}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Panel>
  );
}

const NORM_SUGGESTIONS = ["Come prepared", "Cameras on", "No phones", "Start on time", "Ask “why?” out loud", "Everyone speaks"];

/** Chip input for group norms, with one-tap suggestions */
export function NormsInput({ value, onChange, id }: { value: string[]; onChange: (v: string[]) => void; id?: string }) {
  const [draft, setDraft] = React.useState("");
  const add = (n: string) => {
    const t = n.trim();
    if (!t || value.some((v) => v.toLowerCase() === t.toLowerCase())) return;
    onChange([...value, t]);
    setDraft("");
  };
  const suggestions = NORM_SUGGESTIONS.filter((s) => !value.includes(s));
  return (
    <div className="space-y-3">
      {value.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {value.map((n) => (
            <li key={n} className="animate-pop inline-flex items-center gap-1 rounded-full bg-foreground py-1 pl-3 pr-1 text-sm font-semibold text-background">
              {n}
              <button
                type="button"
                onClick={() => onChange(value.filter((v) => v !== n))}
                className="grid size-6 place-items-center rounded-full hover:bg-background/15"
                aria-label={`Remove ${n}`}
              >
                <X className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-2">
        <Input
          id={id}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add(draft);
            }
          }}
          placeholder="Add your own norm"
        />
        <button
          type="button"
          onClick={() => add(draft)}
          disabled={!draft.trim()}
          className="pressable grid size-11 shrink-0 place-items-center rounded-[var(--radius-control)] border border-border-strong bg-surface hover:border-foreground/40 disabled:opacity-40"
          aria-label="Add norm"
        >
          <Plus className="size-5" />
        </button>
      </div>
      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => add(s)}
              className="pressable inline-flex items-center gap-1 rounded-full border border-dashed border-border-strong px-3 py-1 text-sm font-medium text-muted-foreground hover:border-foreground/40 hover:text-foreground"
            >
              <Plus className="size-3.5" />
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
