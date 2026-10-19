"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { differenceInCalendarDays } from "date-fns";
import {
  CalendarDays,
  CalendarPlus,
  CalendarX2,
  CircleCheck,
  Clock,
  Ellipsis,
  Lock,
  MapPin,
  Pencil,
  Play,
  Repeat,
  Video,
} from "lucide-react";
import { toast } from "sonner";
import { useShallow } from "zustand/react/shallow";
import { Page, PageHeader } from "@/components/app/app-shell";
import { RetroDialog } from "@/components/app/retro-dialog";
import { SessionEditDialog } from "@/components/app/session-edit-dialog";
import { RECURRENCE_LABEL, dayPhrase, downloadSessionIcs, timeRange, useNow } from "@/components/app/session-helpers";
import { SessionNotes } from "@/components/app/session-notes";
import { SessionRoles, WhosComing } from "@/components/app/session-people";
import { StepsTimeline } from "@/components/app/session-plan";
import { PrepChecklist } from "@/components/app/session-prep";
import { RetroSummary } from "@/components/app/session-retro-summary";
import { RsvpControl, TemplateBadge, goingCount } from "@/components/app/session-bits";
import { CircleLoader } from "@/components/brand/logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ConfirmDialog,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/overlays";
import { EmptyState, Panel } from "@/components/ui/surface";
import { activeMembers, isMember, useMe, useUserMap } from "@/lib/queries";
import { teachersFor, useStore } from "@/lib/store";
import { ROLES, TEMPLATES, stepsFor } from "@/lib/templates";
import type { Group, Session } from "@/lib/types";
import { firstName, formatDay, formatDuration, formatRelative, formatTime } from "@/lib/utils";

const JOIN_WINDOW_MS = 15 * 60_000;

/** Calendar-aware, so it never contradicts "Tomorrow" in the header */
function startsLabel(startsAt: string, now: number) {
  const days = differenceInCalendarDays(new Date(startsAt), now);
  if (days <= 0) return `Starts ${formatRelative(startsAt)}`;
  if (days === 1) return "Starts tomorrow";
  return `Starts in ${days} days`;
}

export default function SessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const session = useStore((s) => s.sessions.find((x) => x.id === sessionId));
  const group = useStore((s) => s.groups.find((g) => g.id === session?.groupId));
  const me = useMe();
  const [leaving, setLeaving] = React.useState(false);

  if (leaving) {
    return (
      <div className="grid min-h-[50dvh] place-items-center">
        <CircleLoader size={32} />
      </div>
    );
  }

  if (!session || !group) {
    return (
      <Page width="narrow">
        <EmptyState
          icon={<CalendarX2 />}
          title="Session not found"
          description="It may have been cancelled, or the link is wrong."
          action={
            <Button asChild variant="outline">
              <Link href="/groups">See your groups</Link>
            </Button>
          }
        />
      </Page>
    );
  }

  if (!isMember(group, me.id)) {
    return (
      <Page width="narrow">
        <EmptyState
          icon={<Lock />}
          title="This session is only visible to group members"
          description={`Join ${group.name} to see the plan, RSVPs and notes.`}
          action={
            <Button asChild variant="outline">
              <Link href={`/groups/${group.id}`}>View the group</Link>
            </Button>
          }
        />
      </Page>
    );
  }

  return <SessionView session={session} group={group} onLeave={() => setLeaving(true)} />;
}

function SessionView({ session, group, onLeave }: { session: Session; group: Group; onLeave: () => void }) {
  const router = useRouter();
  const me = useMe();
  const users = useUserMap();
  const allUsers = useStore((s) => s.users);
  const now = useNow(30_000);
  const startSession = useStore((s) => s.startSession);
  const deleteSession = useStore((s) => s.deleteSession);
  const myRetro = useStore((s) => s.retros.find((r) => r.sessionId === session.id && r.userId === me.id));
  const series = useStore(
    useShallow((s) =>
      session.seriesId
        ? s.sessions.filter((x) => x.seriesId === session.seriesId).sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt))
        : [],
    ),
  );
  const nextInGroup = useStore((s) =>
    s.sessions
      .filter((x) => x.groupId === group.id && x.status === "scheduled" && +new Date(x.startsAt) > +new Date(session.startsAt))
      .sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt))[0],
  );

  const [retroOpen, setRetroOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [cancelOpen, setCancelOpen] = React.useState(false);

  const members = activeMembers(group).map((m) => users[m.userId]).filter(Boolean);
  const isOwner = group.ownerId === me.id;
  const roleOf = (role: string) => Object.entries(session.roles).find(([, r]) => r === role)?.[0];
  const facilitator = users[roleOf("facilitator") ?? ""];
  const scribe = users[roleOf("scribe") ?? ""];
  const canStart = isOwner || facilitator?.id === me.id;
  const myRole = session.roles[me.id];
  const myTopic = session.template === "jigsaw" ? session.jigsawTopics[me.id] : undefined;

  const start = +new Date(session.startsAt);
  const end = start + session.durationMin * 60_000;
  const live = session.status === "live";
  const ended = session.status === "ended";
  const scheduled = session.status === "scheduled";
  const overdue = scheduled && now > end;
  const inWindow = live || (scheduled && now >= start - JOIN_WINDOW_MS && now <= end);
  const steps = stepsFor(session.template, session.durationMin, teachersFor({ users: allUsers }, session, group));
  const seriesIndex = series.findIndex((s) => s.id === session.id);
  const groupBase = `/groups/${group.id}`;

  const startNow = () => {
    startSession(session.id);
    router.push(`/sessions/${session.id}/live`);
  };

  const addToCalendar = () => {
    if (downloadSessionIcs(session, group)) {
      toast.success("Calendar file downloaded", { description: "Open it to add the session to Google, Outlook or Apple Calendar." });
    } else {
      toast.error("We couldn't make the calendar file. Try again?");
    }
  };

  const videoButton = session.videoUrl && inWindow && (
    <Button asChild variant="outline" size="lg">
      <a href={session.videoUrl} target="_blank" rel="noreferrer">
        <Video /> Join video call
      </a>
    </Button>
  );

  return (
    <Page>
      <PageHeader
        back={{ href: `${groupBase}/sessions`, label: group.name }}
        eyebrow={
          <span className="flex flex-wrap items-center gap-2">
            <TemplateBadge template={session.template} />
            {live && <Badge variant="live">Live now</Badge>}
            {ended && <Badge variant="neutral">Finished</Badge>}
          </span>
        }
        title={session.title}
        description={
          <span className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[0.9375rem]">
            <span className="inline-flex items-center gap-1.5 font-semibold text-foreground">
              <CalendarDays className="size-4 shrink-0" aria-hidden />
              {formatDay(session.startsAt)}, {timeRange(session)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-4 shrink-0" aria-hidden />
              {formatDuration(session.durationMin)}
            </span>
            <span className="inline-flex min-w-0 items-center gap-1.5">
              {session.videoUrl ? <Video className="size-4 shrink-0" aria-hidden /> : <MapPin className="size-4 shrink-0" aria-hidden />}
              <span className="truncate">{session.location}</span>
            </span>
            {session.recurrence !== "none" && (
              <span className="inline-flex items-center gap-1.5">
                <Repeat className="size-4 shrink-0" aria-hidden />
                {RECURRENCE_LABEL[session.recurrence]}
                {seriesIndex >= 0 && series.length > 1 && `, ${seriesIndex + 1} of ${series.length}`}
              </span>
            )}
          </span>
        }
        actions={
          <>
            {!ended && (
              <Button variant="outline" onClick={addToCalendar}>
                <CalendarPlus /> Add to calendar
              </Button>
            )}
            {isOwner && scheduled && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" aria-label="Session options" className="size-11">
                    <Ellipsis />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onSelect={() => setEditOpen(true)}>
                    <Pencil /> Edit session
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem destructive onSelect={() => setCancelOpen(true)}>
                    <CalendarX2 /> Cancel session
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </>
        }
      />

      <div className="stagger grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-12">
        <div className="min-w-0 space-y-10">
          {/* Primary action */}
          {live ? (
            <Panel className="border-teal/40 bg-teal-soft/60 p-5 sm:p-7">
              <p className="text-[0.9375rem] font-bold text-teal-text">Happening now</p>
              <h2 className="mt-1 text-h3">
                Step {Math.min(session.currentStep, steps.length - 1) + 1} of {steps.length}: {steps[Math.min(session.currentStep, steps.length - 1)]?.title}
              </h2>
              <p className="mt-1 text-[0.9375rem] text-muted-foreground">
                {goingCount(session)} of {members.length} said they&rsquo;d be there. Jump in, the timer is running.
              </p>
              <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                <Button asChild variant="teal" size="lg">
                  <Link href={`/sessions/${session.id}/live`}>
                    <Play /> Join Session Mode
                  </Link>
                </Button>
                {videoButton}
              </div>
            </Panel>
          ) : ended ? (
            <Panel className="p-5 sm:p-7">
              {myRetro ? (
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <CircleCheck className="mt-0.5 size-5 shrink-0 text-teal-text" aria-hidden />
                    <div>
                      <h2 className="text-h3">Thanks for your retro</h2>
                      <p className="mt-0.5 text-[0.9375rem] text-muted-foreground">
                        {nextInGroup
                          ? `Nice work. Next up is ${nextInGroup.title}, ${dayPhrase(nextInGroup.startsAt)} at ${formatTime(nextInGroup.startsAt)}.`
                          : "Nice work. Same time next week?"}
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" onClick={() => setRetroOpen(true)} className="self-start sm:self-auto">
                    Edit your answers
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-h3">How did it go?</h2>
                    <p className="mt-0.5 max-w-md text-[0.9375rem] text-muted-foreground">
                      Two minutes, five questions. The group sees a combined summary, never who said what.
                    </p>
                  </div>
                  <Button size="lg" onClick={() => setRetroOpen(true)}>
                    Add your retro
                  </Button>
                </div>
              )}
            </Panel>
          ) : (
            <Panel className="p-5 sm:p-7">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h2 className="text-h3">{overdue ? "This time has passed" : "Are you coming?"}</h2>
                <span className="text-sm font-medium text-muted-foreground">
                  {overdue ? `Was ${formatRelative(session.startsAt)}` : startsLabel(session.startsAt, now)}
                </span>
              </div>
              {(myRole || myTopic) && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {myRole && (
                    <Badge variant="gold" size="md">
                      You&rsquo;re the {ROLES[myRole].name.toLowerCase()}
                    </Badge>
                  )}
                  {myTopic && (
                    <Badge variant="teal" size="md">
                      You teach: {myTopic}
                    </Badge>
                  )}
                </div>
              )}
              {!overdue && <RsvpControl session={session} className="mt-4 max-w-md" />}

              <div className="mt-6 flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center">
                {canStart ? (
                  <>
                    <Button size="lg" onClick={startNow}>
                      <Play /> Start session
                    </Button>
                    {videoButton}
                    <p className="text-sm text-muted-foreground sm:ml-2">Opens Session Mode for everyone.</p>
                  </>
                ) : (
                  <>
                    {videoButton}
                    <p className="flex items-center gap-2 text-sm text-muted-foreground">
                      {inWindow && <CircleLoader size={16} label="Waiting" />}
                      {facilitator
                        ? inWindow
                          ? `Waiting for the facilitator, ${firstName(facilitator.name)}, to start.`
                          : `${firstName(facilitator.name)}, the facilitator, starts Session Mode on the day.`
                        : "Waiting for the facilitator to start Session Mode."}
                    </p>
                  </>
                )}
              </div>
            </Panel>
          )}

          {(live || ended) && <SessionNotes key={session.id} session={session} scribe={scribe} />}
          {ended && <RetroSummary sessionId={session.id} memberCount={members.length} />}

          {session.agenda && (
            <section aria-labelledby="agenda-title">
              <h2 id="agenda-title" className="mb-2 text-lg font-bold tracking-tight">
                Agenda
              </h2>
              <p className="max-w-[65ch] whitespace-pre-line text-body">{session.agenda}</p>
            </section>
          )}

          {session.prep.length > 0 && !ended && <PrepChecklist session={session} members={members} meId={me.id} />}

          <section aria-labelledby="plan-title">
            <div className="mb-3">
              <h2 id="plan-title" className="text-lg font-bold tracking-tight">
                How it runs
              </h2>
              <p className="text-sm text-muted-foreground">{TEMPLATES[session.template].description}</p>
            </div>
            <Panel className="p-5">
              <StepsTimeline steps={steps} current={live ? session.currentStep : undefined} showInstructions />
            </Panel>
          </section>

          {ended && session.prep.length > 0 && <PrepChecklist session={session} members={members} meId={me.id} />}
        </div>

        <aside className="min-w-0 space-y-10">
          <WhosComing session={session} members={members} meId={me.id} canNudge={isOwner && scheduled && !overdue} />
          <SessionRoles session={session} members={members} meId={me.id} />
        </aside>
      </div>

      <RetroDialog session={session} open={retroOpen} onOpenChange={setRetroOpen} />
      {isOwner && <SessionEditDialog session={session} open={editOpen} onOpenChange={setEditOpen} />}
      <ConfirmDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="Cancel this session?"
        description={
          session.seriesId
            ? "It comes off everyone's calendar. The other sessions in the series stay as they are."
            : "It comes off everyone's calendar, and we'll let the group know."
        }
        confirmLabel="Cancel session"
        cancelLabel="Keep it"
        destructive
        onConfirm={() => {
          onLeave();
          router.push(`${groupBase}/sessions`);
          deleteSession(session.id);
          toast("Session cancelled", { description: "We'll let the group know." });
        }}
      />
    </Page>
  );
}
