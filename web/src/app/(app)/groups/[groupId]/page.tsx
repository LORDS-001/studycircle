"use client";

import Link from "next/link";
import { CalendarPlus, CircleCheck, Pin, Play, Sparkles, Star } from "lucide-react";
import { CharterCard } from "@/components/app/group-bits";
import { EditGroupDialogTrigger } from "./_components/edit-trigger";
import { MemberCircle } from "@/components/app/member-circle";
import { LocationLine, RsvpControl, TemplateBadge, goingCount } from "@/components/app/session-bits";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState, Panel, Progress } from "@/components/ui/surface";
import { useCurrentGroup } from "@/lib/group-context";
import { activeMembers, useGroupSessions, useMe, useUserMap } from "@/lib/queries";
import { useShallow } from "zustand/react/shallow";
import { useStore } from "@/lib/store";
import { ROLES } from "@/lib/templates";
import { cn, formatDay, formatDuration, formatRelative, formatTime } from "@/lib/utils";

export default function GroupOverviewPage() {
  const group = useCurrentGroup();
  const me = useMe();
  const users = useUserMap();
  const { upcoming, past } = useGroupSessions(group.id);
  const questions = useStore(useShallow((s) => s.questions.filter((q) => q.groupId === group.id)));
  const retros = useStore((s) => s.retros);
  const members = activeMembers(group).map((m) => users[m.userId]).filter(Boolean);
  const next = upcoming[0];
  const lastNotes = past.find((s) => s.notes.summary);
  const groupRetros = retros.filter((r) => past.some((s) => s.id === r.sessionId));
  const avgRating = groupRetros.length ? groupRetros.reduce((a, r) => a + r.rating, 0) / groupRetros.length : null;
  const topics = Array.from(new Set(questions.map((q) => q.topic)));
  const myRole = next?.roles[me.id];
  const facilitator = next ? Object.entries(next.roles).find(([, r]) => r === "facilitator")?.[0] : undefined;
  const base = `/groups/${group.id}`;
  const isOwner = group.ownerId === me.id;

  return (
    <div className="stagger grid gap-4 lg:grid-cols-3 lg:gap-5">
      {/* Up next */}
      <Panel className="flex flex-col p-5 sm:p-7 lg:col-span-2">
        {next ? (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-label text-teal-text">{next.status === "live" ? "Happening now" : "Up next"}</span>
              {next.status === "live" && <Badge variant="live">Live</Badge>}
            </div>
            <h2 className="mt-3 text-h2">{next.title}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[0.9375rem] text-muted-foreground">
              <span className="font-semibold text-foreground">
                {formatDay(next.startsAt)}, {formatTime(next.startsAt)}
              </span>
              <span>{formatDuration(next.durationMin)}</span>
              <TemplateBadge template={next.template} />
              <LocationLine session={next} />
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold">
                {goingCount(next)} of {members.length} going
              </span>
              {myRole && (
                <Badge variant="gold" size="md">
                  You&rsquo;re the {ROLES[myRole].name.toLowerCase()}
                </Badge>
              )}
              {next.template === "jigsaw" && next.jigsawTopics[me.id] && (
                <Badge variant="teal" size="md">
                  You teach: {next.jigsawTopics[me.id]}
                </Badge>
              )}
            </div>

            {next.prep.length > 0 && (
              <ul className="mt-5 space-y-2">
                {next.prep.map((p) => {
                  const done = p.doneBy.includes(me.id);
                  return (
                    <li key={p.id} className="flex items-center gap-2.5 text-[0.9375rem]">
                      <CircleCheck className={cn("size-[18px] shrink-0", done ? "text-teal-text" : "text-border-strong")} />
                      <span className={cn(done && "text-muted-foreground line-through decoration-1")}>{p.text}</span>
                    </li>
                  );
                })}
              </ul>
            )}

            <div className="mt-auto flex flex-col gap-3 pt-6 sm:flex-row sm:items-center">
              {next.status === "live" ? (
                <Button asChild variant="teal" size="lg" className="sm:w-auto">
                  <Link href={`/sessions/${next.id}/live`}>
                    <Play /> Join Session Mode
                  </Link>
                </Button>
              ) : (
                <>
                  <RsvpControl session={next} className="flex-1 sm:max-w-md" />
                  <Button asChild variant="ghost" className="sm:ml-auto">
                    <Link href={`/sessions/${next.id}`}>Session details</Link>
                  </Button>
                </>
              )}
            </div>
          </>
        ) : (
          <EmptyState
            className="border-none py-8"
            icon={<CalendarPlus />}
            title="No sessions yet"
            description="Ask everyone to add their availability, then pick one of the suggested times."
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
        )}
      </Panel>

      {/* The circle */}
      <Panel className="flex flex-col items-center p-5 sm:p-6">
        <div className="mb-2 self-stretch">
          <h2 className="text-h3">Your circle</h2>
          <p className="text-sm text-muted-foreground">{next ? "Roles for the next session" : "Roles rotate every session"}</p>
        </div>
        <MemberCircle
          members={members}
          roles={next?.roles}
          litUserId={facilitator}
          size={248}
          className="my-3"
          center={
            <div className="max-w-24">
              <div className="text-2xl font-bold tracking-tight">
                {members.length}/{group.maxSize}
              </div>
              <div className="text-xs font-medium text-muted-foreground">members</div>
            </div>
          }
        />
        <p className="mt-auto pt-2 text-center text-xs text-muted-foreground">The highlighted member keeps the group moving.</p>
      </Panel>

      {group.pinnedMessage && (
        <div className="flex items-start gap-3 rounded-[var(--radius-card)] bg-gold-soft px-5 py-4 text-gold-foreground dark:bg-surface-2 dark:text-foreground lg:col-span-3">
          <Pin className="mt-0.5 size-[18px] shrink-0 rotate-45" />
          <p className="text-[0.9375rem] font-medium leading-6">{group.pinnedMessage}</p>
        </div>
      )}

      <CharterCard group={group} className="lg:col-span-2" action={isOwner ? <EditGroupDialogTrigger group={group} /> : undefined} />

      {/* Question bank */}
      <Panel className="flex flex-col p-5 sm:p-6">
        <h2 className="text-h3">Question bank</h2>
        <p className="text-sm text-muted-foreground">
          {questions.length} questions across {topics.length} topics
        </p>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {topics.map((t) => (
            <Badge key={t} variant="neutral" size="md">
              {t}
            </Badge>
          ))}
        </div>
        <div className="mt-auto flex gap-2 pt-5">
          <Button asChild variant="primary" className="flex-1">
            <Link href={`${base}/questions/quiz`}>
              <Sparkles /> Quiz me
            </Link>
          </Button>
          <Button asChild variant="outline" className="flex-1">
            <Link href={`${base}/questions`}>Add questions</Link>
          </Button>
        </div>
      </Panel>

      {/* Latest notes */}
      <Panel className="p-5 sm:p-6 lg:col-span-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-h3">Latest notes</h2>
            {lastNotes && (
              <p className="text-sm text-muted-foreground">
                {lastNotes.title}, {formatRelative(lastNotes.startsAt)}
              </p>
            )}
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link href={`${base}/notes`}>All notes</Link>
          </Button>
        </div>
        {lastNotes ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <h3 className="mb-1 text-xs font-semibold text-muted-foreground">Summary</h3>
              <p className="text-[0.9375rem] leading-6">{lastNotes.notes.summary}</p>
            </div>
            <div>
              <h3 className="mb-1 text-xs font-semibold text-muted-foreground">Still open</h3>
              <p className="text-[0.9375rem] leading-6">{lastNotes.notes.openQuestions || "Nothing open. Nice."}</p>
            </div>
          </div>
        ) : (
          <p className="mt-4 text-[0.9375rem] text-muted-foreground">Notes from your sessions will collect here.</p>
        )}
      </Panel>

      {/* How sessions are going */}
      <Panel className="p-5 sm:p-6">
        <h2 className="text-h3">How sessions feel</h2>
        <p className="text-sm text-muted-foreground">From {groupRetros.length} retro answers</p>
        {avgRating ? (
          <>
            <div className="mt-4 flex items-end gap-2">
              <span className="text-[2.5rem] font-bold leading-none tracking-tight">{avgRating.toFixed(1)}</span>
              <span className="mb-1 text-sm font-medium text-muted-foreground">out of 5</span>
            </div>
            <div className="mt-2 flex gap-1" aria-hidden>
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  className={cn("size-4", i <= Math.round(avgRating) ? "fill-foreground text-foreground dark:fill-gold dark:text-gold" : "text-border-strong")}
                />
              ))}
            </div>
            <div className="mt-5 space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Sessions held</span>
                <span className="font-semibold">{past.length}</span>
              </div>
              <Progress value={Math.min(100, (past.length / 8) * 100)} label="Sessions held toward 8 before the exam" />
              <p className="text-xs text-muted-foreground">Aim for 8 sessions before the exam</p>
            </div>
          </>
        ) : (
          <p className="mt-4 text-[0.9375rem] text-muted-foreground">After your first session, the group&rsquo;s ratings show up here.</p>
        )}
      </Panel>
    </div>
  );
}
