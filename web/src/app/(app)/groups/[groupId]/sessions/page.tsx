"use client";

import * as React from "react";
import Link from "next/link";
import { addWeeks, endOfWeek, format, isSameMonth, startOfWeek } from "date-fns";
import { CalendarPlus, CalendarSearch, ChevronRight, CircleCheck, History, NotebookPen, Repeat } from "lucide-react";
import { RECURRENCE_LABEL, dayPhrase, useNow } from "@/components/app/session-helpers";
import { SessionRow, TEMPLATE_ICON } from "@/components/app/session-bits";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/surface";
import { useCurrentGroup } from "@/lib/group-context";
import { useGroupSessions, useMe } from "@/lib/queries";
import { useStore } from "@/lib/store";
import { TEMPLATES } from "@/lib/templates";
import type { Session } from "@/lib/types";
import { cn, formatTime, plural } from "@/lib/utils";

const WEEK = { weekStartsOn: 1 } as const;

function weekRange(start: Date) {
  const end = endOfWeek(start, WEEK);
  return isSameMonth(start, end) ? `${format(start, "d")} – ${format(end, "d MMM")}` : `${format(start, "d MMM")} – ${format(end, "d MMM")}`;
}

export default function GroupSessionsPage() {
  const group = useCurrentGroup();
  const me = useMe();
  const now = useNow(60_000);
  const { upcoming, past } = useGroupSessions(group.id);
  const retros = useStore((s) => s.retros);
  const base = `/groups/${group.id}`;

  const buckets = React.useMemo(() => {
    const thisWeek = startOfWeek(now, WEEK);
    const nextWeek = addWeeks(thisWeek, 1);
    const later = addWeeks(thisWeek, 2);
    const groups: { key: string; title: string; range?: string; sessions: Session[] }[] = [
      { key: "live", title: "Happening now", sessions: [] },
      { key: "this", title: "This week", range: weekRange(thisWeek), sessions: [] },
      { key: "next", title: "Next week", range: weekRange(nextWeek), sessions: [] },
      { key: "later", title: "Later", sessions: [] },
    ];
    for (const s of upcoming) {
      const t = +new Date(s.startsAt);
      if (s.status === "live") groups[0].sessions.push(s);
      else if (t < +nextWeek) groups[1].sessions.push(s);
      else if (t < +later) groups[2].sessions.push(s);
      else groups[3].sessions.push(s);
    }
    return groups.filter((g) => g.sessions.length);
  }, [upcoming, now]);

  const series = React.useMemo(() => {
    const map = new Map<string, Session[]>();
    for (const s of upcoming) {
      if (!s.seriesId || s.recurrence === "none") continue;
      map.set(s.seriesId, [...(map.get(s.seriesId) ?? []), s]);
    }
    return Array.from(map.values());
  }, [upcoming]);

  const next = upcoming.find((s) => s.status !== "live");
  const summary = upcoming.length
    ? `${plural(upcoming.length, "session")} coming up.${next ? ` The next one is ${dayPhrase(next.startsAt)} at ${formatTime(next.startsAt)}.` : ""}`
    : "Nothing on the calendar yet.";

  return (
    <div className="stagger">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-h2">Sessions</h2>
          <p className="mt-1 text-[0.9375rem] text-muted-foreground">{summary}</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" className="flex-1 sm:flex-none">
            <Link href={`${base}/availability`}>
              <CalendarSearch /> Find a time
            </Link>
          </Button>
          <Button asChild className="flex-1 sm:flex-none">
            <Link href={`${base}/sessions/new`}>
              <CalendarPlus /> Schedule session
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-12">
        <div className="min-w-0 space-y-9">
          {buckets.length === 0 ? (
            <EmptyState
              icon={<CalendarSearch />}
              title="No sessions coming up"
              description="Check when everyone's free, then pick the time that suits the most people."
              action={
                <div className="flex flex-wrap justify-center gap-2">
                  <Button asChild>
                    <Link href={`${base}/availability`}>Find a time</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href={`${base}/sessions/new`}>Schedule manually</Link>
                  </Button>
                </div>
              }
            />
          ) : (
            buckets.map((b) => (
              <section key={b.key} aria-labelledby={`bucket-${b.key}`}>
                <div className="mb-3 flex items-baseline gap-3">
                  <h3 id={`bucket-${b.key}`} className={cn("text-[0.9375rem] font-bold", b.key === "live" && "text-teal-text")}>
                    {b.title}
                  </h3>
                  {b.range && <span className="text-sm text-subtle-foreground">{b.range}</span>}
                  <span className="ml-auto text-sm font-medium text-subtle-foreground">{b.sessions.length}</span>
                </div>
                <ul className="space-y-2.5">
                  {b.sessions.map((s) => (
                    <li key={s.id}>
                      <SessionRow session={s} group={group} />
                    </li>
                  ))}
                </ul>
              </section>
            ))
          )}
        </div>

        <aside className="min-w-0 space-y-10">
          {series.length > 0 && (
            <section aria-labelledby="series-title">
              <h3 id="series-title" className="mb-3 text-[0.9375rem] font-bold">
                Repeating
              </h3>
              <ul className="space-y-2">
                {series.map((list) => {
                  const first = list[0];
                  const Icon = TEMPLATE_ICON[first.template];
                  return (
                    <li key={first.seriesId} className="flex gap-3 rounded-2xl bg-surface-2 px-4 py-3.5">
                      <Repeat className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0 text-sm">
                        <p className="font-semibold">
                          {RECURRENCE_LABEL[first.recurrence]}, {format(new Date(first.startsAt), "h:mm a").toLowerCase()}
                        </p>
                        <p className="mt-0.5 flex items-center gap-1.5 text-muted-foreground">
                          <Icon className="size-3.5 shrink-0" />
                          <span className="truncate">{TEMPLATES[first.template].name}</span>
                        </p>
                        <p className="mt-0.5 text-muted-foreground">
                          {plural(list.length, "session")} left
                          {group.examDate ? ` before the exam on ${format(new Date(group.examDate), "EEE d MMM")}` : ""}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          <section aria-labelledby="past-title">
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <h3 id="past-title" className="text-[0.9375rem] font-bold">
                Past sessions
              </h3>
              {past.length > 0 && <span className="text-sm font-medium text-subtle-foreground">{past.length}</span>}
            </div>
            {past.length === 0 ? (
              <p className="flex items-start gap-2.5 rounded-2xl border border-dashed border-border-strong px-4 py-4 text-sm leading-5 text-muted-foreground">
                <History className="mt-0.5 size-4 shrink-0" />
                Notes and retros from finished sessions collect here.
              </p>
            ) : (
              <ul className="divide-y divide-border overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface">
                {past.map((s) => {
                  const Icon = TEMPLATE_ICON[s.template];
                  const hasNotes = !!(s.notes.summary || s.notes.openQuestions || s.notes.actionItems);
                  const retroDone = retros.some((r) => r.sessionId === s.id && r.userId === me.id);
                  const retroDue = !retroDone && s.status === "ended" && s.rsvps[me.id] === "yes";
                  return (
                    <li key={s.id}>
                      <Link
                        href={`/sessions/${s.id}`}
                        className="group flex min-h-14 items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-2 focus-visible:-outline-offset-2"
                      >
                        <Icon className="size-4 shrink-0 text-muted-foreground" aria-label={TEMPLATES[s.template].name} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[0.9375rem] font-semibold">{s.title}</p>
                          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.8125rem] text-muted-foreground">
                            <span>{format(new Date(s.startsAt), "EEE d MMM")}</span>
                            {hasNotes && (
                              <span className="inline-flex items-center gap-1">
                                <NotebookPen className="size-3.5" /> Notes
                              </span>
                            )}
                            {retroDone && (
                              <span className="inline-flex items-center gap-1 font-medium text-foreground">
                                <CircleCheck className="size-3.5" /> Retro done
                              </span>
                            )}
                          </div>
                        </div>
                        {retroDue && <Badge variant="gold">Add retro</Badge>}
                        <ChevronRight className="size-4 shrink-0 text-subtle-foreground transition-transform duration-150 group-hover:translate-x-0.5" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
