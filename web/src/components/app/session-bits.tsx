"use client";

import Link from "next/link";
import { format } from "date-fns";
import { Check, HelpCircle, MapPin, Puzzle, Repeat, Timer, Video, X, Zap } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { AvatarStack } from "@/components/ui/avatar";
import { useMe, useUserMap } from "@/lib/queries";
import { useStore } from "@/lib/store";
import { TEMPLATES } from "@/lib/templates";
import type { Group, RsvpStatus, Session, SessionTemplate } from "@/lib/types";
import { cn, formatDay, formatDuration, formatTime } from "@/lib/utils";

export const TEMPLATE_ICON: Record<SessionTemplate, typeof Zap> = {
  retrieval: Zap,
  jigsaw: Puzzle,
  cowork: Timer,
};

export function TemplateBadge({ template, className }: { template: SessionTemplate; className?: string }) {
  const Icon = TEMPLATE_ICON[template];
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-sm font-semibold text-teal-text", className)}>
      <Icon className="size-4" strokeWidth={2.2} />
      {TEMPLATES[template].name}
    </span>
  );
}

/** Calendar-leaf date block */
export function DateBlock({ date, className, live }: { date: string; className?: string; live?: boolean }) {
  const d = new Date(date);
  return (
    <div
      className={cn(
        "flex w-14 shrink-0 flex-col items-center justify-center rounded-2xl border py-2 leading-none",
        live ? "border-teal bg-teal text-white" : "border-border bg-surface",
        className,
      )}
      aria-hidden
    >
      <span className={cn("text-[11px] font-bold uppercase tracking-wider", live ? "text-white/85" : "text-teal-text")}>
        {format(d, "EEE")}
      </span>
      <span className="mt-1 text-[1.375rem] font-bold tracking-tight">{format(d, "d")}</span>
    </div>
  );
}

export function goingCount(s: Session) {
  return Object.values(s.rsvps).filter((v) => v === "yes").length;
}

export function LocationLine({ session, className }: { session: Session; className?: string }) {
  const Icon = session.videoUrl ? Video : MapPin;
  return (
    <span className={cn("inline-flex min-w-0 items-center gap-1.5", className)}>
      <Icon className="size-4 shrink-0" />
      <span className="truncate">{session.location}</span>
    </span>
  );
}

/** A session in a list. Links to the session page. */
export function SessionRow({
  session,
  group,
  showGroup,
  className,
}: {
  session: Session;
  group?: Group;
  showGroup?: boolean;
  className?: string;
}) {
  const users = useUserMap();
  const me = useMe();
  const going = Object.entries(session.rsvps)
    .filter(([, v]) => v === "yes")
    .map(([id]) => users[id]);
  const mine = session.rsvps[me.id];
  const live = session.status === "live";
  const ended = session.status === "ended";
  const total = group ? group.members.filter((m) => m.status === "active").length : undefined;

  return (
    <Link
      href={`/sessions/${session.id}`}
      className={cn(
        "pressable group flex items-center gap-4 rounded-[var(--radius-card)] border border-border bg-surface p-3.5 pr-4 hover:border-border-strong hover:shadow-raised active:scale-[0.995] sm:p-4",
        className,
      )}
    >
      <DateBlock date={session.startsAt} live={live} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {live && <Badge variant="live">Live now</Badge>}
          <TemplateBadge template={session.template} className="text-[0.8125rem]" />
          {showGroup && group && <span className="truncate text-[0.8125rem] font-medium text-muted-foreground">{group.name}</span>}
        </div>
        <h3 className="mt-1 truncate text-base font-bold tracking-tight">{session.title}</h3>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          <span>
            {formatDay(session.startsAt)}, {formatTime(session.startsAt)}
          </span>
          <span className="hidden sm:inline">{formatDuration(session.durationMin)}</span>
          <LocationLine session={session} className="max-w-[14rem]" />
          {session.recurrence !== "none" && (
            <span className="hidden items-center gap-1 md:inline-flex">
              <Repeat className="size-3.5" />
              {session.recurrence === "weekly" ? "Weekly" : "Twice weekly"}
            </span>
          )}
        </div>
      </div>
      <div className="hidden shrink-0 flex-col items-end gap-2 sm:flex">
        <AvatarStack users={going} size="xs" max={4} />
        <span className="text-xs font-medium text-muted-foreground">
          {total ? `${going.length} of ${total} going` : `${going.length} going`}
        </span>
      </div>
      {!ended && !live && !mine && (
        <Badge variant="gold" className="hidden shrink-0 md:inline-flex">
          RSVP
        </Badge>
      )}
    </Link>
  );
}

const RSVP_OPTIONS: { value: RsvpStatus; label: string; icon: typeof Check }[] = [
  { value: "yes", label: "Going", icon: Check },
  { value: "maybe", label: "Maybe", icon: HelpCircle },
  { value: "no", label: "Can't go", icon: X },
];

export function RsvpControl({ session, className }: { session: Session; className?: string }) {
  const me = useMe();
  const rsvp = useStore((s) => s.rsvp);
  const current = session.rsvps[me.id];
  return (
    <div role="group" aria-label="Your RSVP" className={cn("grid grid-cols-3 gap-2", className)}>
      {RSVP_OPTIONS.map(({ value, label, icon: Icon }) => {
        const selected = current === value;
        return (
          <button
            key={value}
            aria-pressed={selected}
            onClick={() => {
              rsvp(session.id, value);
              if (value === "yes") toast.success("You're going", { description: "We'll remind you 24 hours and 1 hour before." });
              else if (value === "maybe") toast("Marked as maybe", { description: "You'll still get reminders." });
              else toast("Thanks for letting the group know");
            }}
            className={cn(
              "pressable flex h-11 items-center justify-center gap-2 rounded-[var(--radius-control)] border text-[0.9375rem] font-semibold",
              selected
                ? value === "yes"
                  ? "border-teal bg-teal text-white"
                  : "border-foreground bg-foreground text-background"
                : "border-border-strong bg-surface text-foreground hover:border-foreground/40",
            )}
          >
            <Icon className="size-4" strokeWidth={2.4} />
            {label}
          </button>
        );
      })}
    </div>
  );
}
