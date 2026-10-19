"use client";

import * as React from "react";
import Link from "next/link";
import { addDays, format, isSameDay, startOfDay } from "date-fns";
import { BookOpen, CalendarPlus, MessageSquareHeart, Play, Plus, Sparkles } from "lucide-react";
import { Page } from "@/components/app/app-shell";
import { SessionRow } from "@/components/app/session-bits";
import { SeatRing } from "@/components/brand/rings";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState, Panel, SectionTitle } from "@/components/ui/surface";
import {
  activeMembers,
  useMe,
  useMyCourses,
  useMyGroups,
  useMyUpcomingSessions,
  usePendingRetros,
} from "@/lib/queries";
import { useStore } from "@/lib/store";
import type { Session } from "@/lib/types";
import { cn, firstName, formatDay, formatTime } from "@/lib/utils";

function greeting(d = new Date()) {
  const h = d.getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

/** "today", "tomorrow", "Thursday", "on Thu 24 Oct" — reads naturally mid-sentence */
function dayPhrase(date: string) {
  const d = formatDay(date);
  if (d === "Today" || d === "Tomorrow") return d.toLowerCase();
  return /^[A-Z][a-z]+day$/.test(d) ? d : `on ${d}`;
}

function WeekStrip({ sessions }: { sessions: Session[] }) {
  const today = startOfDay(new Date());
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i));
  return (
    <ol className="grid grid-cols-7 gap-1.5 sm:gap-2" aria-label="Your next seven days">
      {days.map((d, i) => {
        const daySessions = sessions.filter((s) => isSameDay(new Date(s.startsAt), d));
        const has = daySessions.length > 0;
        return (
          <li
            key={d.toISOString()}
            className={cn(
              "flex flex-col items-center rounded-2xl border px-1 pb-2.5 pt-2 transition-colors",
              i === 0 ? "border-foreground bg-foreground text-background" : "border-border bg-surface",
            )}
            aria-label={`${format(d, "EEEE d MMMM")}: ${has ? `${daySessions.length} session${daySessions.length > 1 ? "s" : ""}` : "no sessions"}`}
          >
            <span className={cn("text-[11px] font-semibold", i === 0 ? "text-background/75" : "text-muted-foreground")}>
              {format(d, "EEEEE")}
              <span className="hidden sm:inline">{format(d, "EEE").slice(1)}</span>
            </span>
            <span className="mt-0.5 text-lg font-bold tracking-tight">{format(d, "d")}</span>
            <span className="mt-1 flex h-1.5 gap-1" aria-hidden>
              {daySessions.slice(0, 3).map((s) => (
                <span key={s.id} className={cn("size-1.5 rounded-full", i === 0 ? "bg-gold" : "bg-teal")} />
              ))}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export default function DashboardPage() {
  const me = useMe();
  const groups = useMyGroups();
  const courses = useMyCourses();
  const upcoming = useMyUpcomingSessions();
  const pendingRetros = usePendingRetros();
  const allGroups = useStore((s) => s.groups);
  const sessionsAll = useStore((s) => s.sessions);
  const [now] = React.useState(() => new Date());

  const live = upcoming.find((s) => s.status === "live");
  const next = upcoming.find((s) => s.status === "scheduled");
  const groupOf = (id: string) => allGroups.find((g) => g.id === id);
  const needsRsvp = upcoming.filter((s) => s.status === "scheduled" && !s.rsvps[me.id]).length;

  const subline = live
    ? `${live.title} is happening now.`
    : next
      ? `Your next session is ${dayPhrase(next.startsAt)} at ${formatTime(next.startsAt)}.`
      : groups.length
        ? "Nothing scheduled yet. Find a time that works for everyone."
        : "Join a course to find a study group, or start your own.";

  return (
    <Page>
      <div className="stagger">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-muted-foreground">{format(now, "EEEE d MMMM")}</p>
            <h1 className="mt-1 text-h1">
              {greeting(now)}, {firstName(me.name)}
            </h1>
            <p className="mt-1.5 text-body text-muted-foreground">{subline}</p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/courses">
                <BookOpen /> Browse courses
              </Link>
            </Button>
            <Button asChild>
              <Link href="/groups/new">
                <Plus /> New group
              </Link>
            </Button>
          </div>
        </header>

        {live && (
          <Link
            href={`/sessions/${live.id}/live`}
            className="pressable group mb-6 flex items-center gap-4 overflow-hidden rounded-[var(--radius-card)] bg-brand-blue p-5 text-brand-cream active:scale-[0.995] dark:bg-surface-2"
          >
            <span className="relative grid size-12 shrink-0 place-items-center rounded-full bg-teal">
              <span className="absolute inset-0 animate-ping rounded-full bg-teal/50 motion-reduce:hidden" />
              <Play className="relative size-5 fill-current" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-brand-cream/70">{groupOf(live.groupId)?.name}</span>
              <span className="block truncate text-lg font-bold">{live.title} is live</span>
            </span>
            <span className="hidden rounded-xl bg-brand-cream px-4 py-2.5 text-sm font-bold text-brand-blue sm:block">
              Join Session Mode
            </span>
          </Link>
        )}

        {pendingRetros.length > 0 && (
          <div className="mb-6 flex flex-col gap-3 rounded-[var(--radius-card)] bg-gold-soft p-4 text-gold-foreground sm:flex-row sm:items-center sm:p-5 dark:bg-surface-2 dark:text-foreground">
            <MessageSquareHeart className="size-6 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="font-bold">How did &ldquo;{pendingRetros[0].title}&rdquo; go?</p>
              <p className="text-sm opacity-80">Two minutes. It helps your group make the next session better.</p>
            </div>
            <Button asChild variant="primary" size="sm" className="h-10 self-start sm:self-auto">
              <Link href={`/sessions/${pendingRetros[0].id}?retro=1`}>
                Take the retro{pendingRetros.length > 1 ? ` (${pendingRetros.length})` : ""}
              </Link>
            </Button>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-10">
          <section aria-labelledby="upcoming-title">
            <SectionTitle
              id="upcoming-title"
              action={
                needsRsvp > 0 && (
                  <Badge variant="gold" size="md">
                    {needsRsvp} need{needsRsvp === 1 ? "s" : ""} your RSVP
                  </Badge>
                )
              }
            >
              Coming up
            </SectionTitle>
            <WeekStrip sessions={upcoming} />
            <div className="mt-4 flex flex-col gap-2.5">
              {upcoming.slice(0, 6).map((s) => (
                <SessionRow key={s.id} session={s} group={groupOf(s.groupId)} showGroup />
              ))}
              {upcoming.length === 0 && (
                <EmptyState
                  icon={<CalendarPlus />}
                  title="No sessions coming up"
                  description={
                    groups.length
                      ? "Open a group and use the availability heatmap to find a time that suits everyone."
                      : "Once you're in a group, your sessions show up here."
                  }
                  action={
                    <Button asChild variant="outline">
                      <Link href={groups.length ? `/groups/${groups[0].id}/availability` : "/courses"}>
                        {groups.length ? "Find a time" : "Find a group"}
                      </Link>
                    </Button>
                  }
                />
              )}
            </div>
          </section>

          <aside className="flex flex-col gap-8">
            <section aria-labelledby="groups-title">
              <SectionTitle
                id="groups-title"
                action={
                  <Button asChild variant="ghost" size="sm">
                    <Link href="/groups">See all</Link>
                  </Button>
                }
              >
                Your groups
              </SectionTitle>
              <Panel as="ul" className="divide-y divide-border overflow-hidden">
                {groups.map((g) => {
                  const nextForGroup = sessionsAll
                    .filter((s) => s.groupId === g.id && s.status !== "ended" && +new Date(s.startsAt) > now.getTime() - 3600_000)
                    .sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt))[0];
                  const course = courses.find((c) => c.id === g.courseId);
                  return (
                    <li key={g.id}>
                      <Link href={`/groups/${g.id}`} className="flex items-center gap-3.5 px-4 py-3.5 transition-colors hover:bg-surface-2">
                        <SeatRing filled={activeMembers(g).length} total={g.maxSize} size={36} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-bold">{g.name}</span>
                          <span className="block truncate text-sm text-muted-foreground">
                            {course?.code}
                            {nextForGroup ? `, next ${dayPhrase(nextForGroup.startsAt)}` : ", nothing scheduled"}
                          </span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
                {groups.length === 0 && (
                  <li className="px-4 py-6 text-center text-sm text-muted-foreground">
                    You&rsquo;re not in a group yet.{" "}
                    <Link href="/courses" className="font-semibold text-teal-text hover:underline">
                      Find one
                    </Link>
                  </li>
                )}
              </Panel>
            </section>

            {groups[0] && (
              <section className="rounded-[var(--radius-card)] bg-brand-blue p-5 text-brand-cream dark:bg-surface-2">
                <Sparkles className="size-5 text-brand-gold" />
                <h2 className="mt-3 text-lg font-bold">Five minutes free?</h2>
                <p className="mt-1 text-sm leading-6 text-brand-cream/75">
                  Answering from memory beats re-reading. Try a quick quiz from {groups[0].name}&rsquo;s question bank.
                </p>
                <Button asChild variant="gold" className="mt-4 w-full">
                  <Link href={`/groups/${groups[0].id}/questions/quiz`}>Start a 5-question quiz</Link>
                </Button>
              </section>
            )}

            <section aria-labelledby="courses-title">
              <SectionTitle
                id="courses-title"
                action={
                  <Button asChild variant="ghost" size="sm">
                    <Link href="/courses">Manage</Link>
                  </Button>
                }
              >
                Your courses
              </SectionTitle>
              <ul className="flex flex-wrap gap-2">
                {courses.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/courses/${c.id}`}
                      className="pressable inline-flex h-10 items-center gap-2 rounded-full border border-border-strong bg-surface px-3.5 text-sm hover:border-foreground/40"
                    >
                      <span className="font-bold">{c.code}</span>
                      <span className="text-muted-foreground">{c.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          </aside>
        </div>
      </div>
    </Page>
  );
}
