"use client";

import * as React from "react";
import { Check, Send } from "lucide-react";
import { toast } from "sonner";
import { listNames } from "@/components/app/session-helpers";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ROLES, ROLE_ORDER } from "@/lib/templates";
import type { RsvpStatus, Session, User } from "@/lib/types";
import { cn, firstName } from "@/lib/utils";

const RSVP_GROUPS: { key: RsvpStatus | "none"; label: string }[] = [
  { key: "yes", label: "Going" },
  { key: "maybe", label: "Maybe" },
  { key: "no", label: "Can't go" },
  { key: "none", label: "No answer" },
];

/** RSVPs grouped Going / Maybe / Can't go / No answer, with a nudge for the organiser. */
export function WhosComing({
  session,
  members,
  meId,
  canNudge,
  className,
}: {
  session: Session;
  members: User[];
  meId: string;
  canNudge: boolean;
  className?: string;
}) {
  const [nudged, setNudged] = React.useState(false);
  const by = (key: RsvpStatus | "none") =>
    members.filter((u) => (key === "none" ? !session.rsvps[u.id] : session.rsvps[u.id] === key));
  const going = by("yes").length;
  // The organiser can't nudge themselves
  const waiting = by("none").filter((u) => u.id !== meId);
  const id = React.useId();

  return (
    <section aria-labelledby={id} className={className}>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 id={id} className="text-lg font-bold tracking-tight">
          {session.status === "ended" ? "Who said they’d come" : "Who’s coming"}
        </h2>
        <span className="text-sm font-medium text-muted-foreground">
          {going} of {members.length} going
        </span>
      </div>

      <div className="space-y-4">
        {RSVP_GROUPS.map(({ key, label }) => {
          const list = by(key);
          if (!list.length) return null;
          return (
            <div key={key}>
              <h3 className="mb-1.5 text-sm font-semibold text-muted-foreground">
                {label} <span className="font-medium text-subtle-foreground">· {list.length}</span>
              </h3>
              <ul className="space-y-1">
                {list.map((u) => (
                  <li key={u.id} className="flex items-center gap-2.5 py-1">
                    <Avatar user={u} size="sm" className={cn(key === "no" && "opacity-60")} />
                    <span className={cn("truncate text-[0.9375rem] font-medium", key === "no" && "text-muted-foreground")}>
                      {u.name}
                      {u.id === meId && <span className="font-normal text-subtle-foreground"> (you)</span>}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {canNudge && waiting.length > 0 && (
        <div className="mt-4 rounded-2xl bg-surface-2 p-4">
          {nudged ? (
            <p className="flex items-center gap-2 text-sm font-medium" role="status">
              <Check className="size-4 shrink-0" strokeWidth={2.6} aria-hidden />
              Nudge sent to {listNames(waiting.map((u) => firstName(u.name)))}.
            </p>
          ) : (
            <>
              <p className="text-sm leading-5">
                {waiting.length === 1
                  ? `${firstName(waiting[0].name)} hasn't answered yet. Send a nudge?`
                  : `${waiting.length} people haven't answered yet. Send a nudge?`}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 h-10"
                onClick={() => {
                  setNudged(true);
                  toast.success("Nudge sent", {
                    description: `We emailed ${listNames(waiting.map((u) => firstName(u.name)))} a friendly reminder.`,
                  });
                }}
              >
                <Send /> Send a nudge
              </Button>
            </>
          )}
        </div>
      )}
    </section>
  );
}

/** Rotating roles for this session, plus Jigsaw subtopics. */
export function SessionRoles({
  session,
  members,
  meId,
  className,
}: {
  session: Session;
  members: User[];
  meId: string;
  className?: string;
}) {
  const id = React.useId();
  const jigsaw = session.template === "jigsaw";
  const rows = members
    .filter((u) => session.roles[u.id] || (jigsaw && session.jigsawTopics[u.id]))
    .sort((a, b) => {
      const ra = session.roles[a.id];
      const rb = session.roles[b.id];
      return (ra ? ROLE_ORDER.indexOf(ra) : 99) - (rb ? ROLE_ORDER.indexOf(rb) : 99);
    });
  if (!rows.length) return null;

  return (
    <section aria-labelledby={id} className={className}>
      <div className="mb-3">
        <h2 id={id} className="text-lg font-bold tracking-tight">
          {jigsaw ? "Roles and topics" : "Roles"}
        </h2>
        <p className="text-sm text-muted-foreground">Roles rotate every session, so everyone gets a turn.</p>
      </div>
      <ul className="divide-y divide-border rounded-[var(--radius-card)] border border-border bg-surface">
        {rows.map((u) => {
          const role = session.roles[u.id];
          const topic = jigsaw ? session.jigsawTopics[u.id] : undefined;
          return (
            <li key={u.id} className="flex items-start gap-3 px-4 py-3">
              <Avatar user={u} size="sm" className="mt-0.5" />
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-baseline gap-x-2 text-[0.9375rem]">
                  <span className="font-semibold">
                    {firstName(u.name)}
                    {u.id === meId && <span className="font-normal text-subtle-foreground"> (you)</span>}
                  </span>
                  {role && <span className="font-medium text-muted-foreground">{ROLES[role].name}</span>}
                </p>
                {role && <p className="text-sm text-subtle-foreground">{ROLES[role].job}</p>}
                {topic && (
                  <p className="mt-1 text-sm">
                    <span className="text-muted-foreground">Teaches </span>
                    <span className="font-semibold">{topic}</span>
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
