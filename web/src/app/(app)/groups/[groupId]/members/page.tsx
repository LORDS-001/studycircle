"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { differenceInCalendarDays, format } from "date-fns";
import { Check, Ellipsis, Info, Lock, LogOut, Sparkles, UserMinus, UserPlus, UserRoundCog } from "lucide-react";
import { toast } from "sonner";
import { useShallow } from "zustand/react/shallow";
import { InviteDialog } from "@/components/app/invite-dialog";
import { SeatRing } from "@/components/brand/rings";
import { Avatar } from "@/components/ui/avatar";
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
import { Panel, Progress } from "@/components/ui/surface";
import { useCurrentGroup } from "@/lib/group-context";
import { activeMembers, useContribution, useMe, useUserMap } from "@/lib/queries";
import { useStore } from "@/lib/store";
import type { GroupMember, ID, User } from "@/lib/types";
import { firstName, formatRelative, plural } from "@/lib/utils";

type Contribution = NonNullable<ReturnType<typeof useContribution>[ID]>;

interface MemberStats extends Contribution {
  /** Ended sessions since this member joined, so newcomers aren't measured against sessions before their time */
  eligible: number;
  attendedSinceJoined: number;
}

function listOf(items: string[]) {
  if (items.length <= 1) return items.join("");
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

/** One or two warm, specific lines from a member's stats. Never negative: low numbers simply say nothing. */
function thanksLine(s: MemberStats, joinedAt: string, you: boolean): string {
  const days = differenceInCalendarDays(new Date(), new Date(joinedAt));
  const lines: string[] = [];

  if (s.eligible === 0 && days <= 14) {
    const when = days === 0 ? "today" : days === 1 ? "yesterday" : `${days} days ago`;
    return you ? `You joined ${when}. Welcome to the circle!` : `Joined ${when}. Welcome!`;
  }
  if (s.eligible >= 2 && s.attendedSinceJoined === s.eligible) {
    lines.push(you ? "You haven't missed a session" : "Hasn't missed a session");
  }
  if (s.taught.length > 0) {
    const topics = s.taught.length > 2 ? `${s.taught.slice(0, 2).join(", ")} and more` : listOf(s.taught);
    lines.push(`${you ? "You taught" : "Taught"} ${topics}`);
  }
  if (s.questions > 0 && lines.length < 2) lines.push(`Thanks for adding ${plural(s.questions, "question")}!`);
  if (s.retros > 0 && lines.length < 2) lines.push(`Thanks for the feedback on ${plural(s.retros, "session")}`);
  if (lines.length === 0 && s.attendedSinceJoined > 0) {
    lines.push(`${you ? "You've" : "Has"} studied with the group ${s.attendedSinceJoined === 1 ? "once" : `${s.attendedSinceJoined} times`}`);
  }
  if (lines.length === 0) return `Part of the circle since ${format(new Date(joinedAt), "d MMMM")}`;
  return lines
    .slice(0, 2)
    .map((l) => (/[.!?]$/.test(l) ? l : `${l}.`))
    .join(" ");
}

type PendingAction = { kind: "transfer" | "remove" | "leave"; user: User };

export default function GroupMembersPage() {
  const group = useCurrentGroup();
  const me = useMe();
  const users = useUserMap();
  const router = useRouter();
  const contribution = useContribution(group.id);
  const sessions = useStore((s) => s.sessions);
  const { approveMember, declineMember, removeMember, transferOwnership, leaveGroup } = useStore(
    useShallow((s) => ({
      approveMember: s.approveMember,
      declineMember: s.declineMember,
      removeMember: s.removeMember,
      transferOwnership: s.transferOwnership,
      leaveGroup: s.leaveGroup,
    })),
  );
  const [action, setAction] = React.useState<PendingAction | null>(null);
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  const isOwner = group.ownerId === me.id;
  const active = activeMembers(group);
  const seatsLeft = Math.max(0, group.maxSize - active.length);
  const full = seatsLeft === 0;

  // Stable, non-score order: organiser first, then by join date
  const ordered = React.useMemo(
    () =>
      group.members
        .filter((m) => m.status === "active")
        .sort((a, b) => {
          if (a.userId === group.ownerId) return -1;
          if (b.userId === group.ownerId) return 1;
          return +new Date(a.joinedAt) - +new Date(b.joinedAt);
        }),
    [group.members, group.ownerId],
  );
  const pending = group.members
    .filter((m) => m.status === "pending")
    .sort((a, b) => +new Date(a.joinedAt) - +new Date(b.joinedAt));

  const statsFor = React.useCallback(
    (m: GroupMember): MemberStats => {
      const base = contribution[m.userId] ?? { attended: 0, scheduled: 0, rsvpReliability: 0, questions: 0, taught: [], retros: 0 };
      const joined = +new Date(m.joinedAt);
      const since = sessions.filter(
        (s) => s.groupId === group.id && s.status === "ended" && +new Date(s.startsAt) + s.durationMin * 60_000 >= joined,
      );
      return {
        ...base,
        eligible: since.length,
        attendedSinceJoined: since.filter((s) => s.rsvps[m.userId] === "yes").length,
      };
    },
    [contribution, sessions, group.id],
  );

  const ask = (kind: PendingAction["kind"], user: User) => {
    setAction({ kind, user });
    setConfirmOpen(true);
  };

  const confirm = (() => {
    if (!action) return null;
    const name = firstName(action.user.name);
    if (action.kind === "transfer")
      return {
        title: `Make ${name} the organiser?`,
        description: `${name} will approve requests, edit the charter and manage members. You'll stay in the group as a member.`,
        confirmLabel: "Make organiser",
        destructive: false,
        run: () => {
          transferOwnership(group.id, action.user.id);
          toast.success(`${name} is now the organiser`);
        },
      };
    if (action.kind === "remove")
      return {
        title: `Remove ${name} from the group?`,
        description: `${name} will lose access to sessions, notes and chat. They can ask to rejoin later.`,
        confirmLabel: "Remove",
        destructive: true,
        run: () => {
          removeMember(group.id, action.user.id);
          toast(`${name} was removed from the group`);
        },
      };
    return {
      title: `Leave ${group.name}?`,
      description: "You'll lose access to the group's sessions, notes and chat. You can ask to rejoin later.",
      confirmLabel: "Leave group",
      destructive: true,
      run: () => {
        leaveGroup(group.id);
        toast("You left the group");
        router.push("/groups");
      },
    };
  })();

  return (
    <div className="stagger space-y-10">
      {/* Requests */}
      {isOwner && pending.length > 0 && (
        <section aria-labelledby="requests-title">
          <div className="mb-3 flex items-center gap-2.5">
            <h2 id="requests-title" className="text-lg font-bold tracking-tight">
              Asking to join
            </h2>
            <Badge variant="gold">{pending.length}</Badge>
          </div>
          {full && (
            <p id="requests-full" className="mb-3 flex items-start gap-2 text-sm text-muted-foreground">
              <Info className="mt-0.5 size-4 shrink-0" />
              The group is full. Raise the size limit in Edit group to let someone in.
            </p>
          )}
          <Panel as="ul" className="divide-y divide-border">
            {pending.map((m) => {
              const u = users[m.userId];
              const name = u?.name ?? "A classmate";
              return (
                <li key={m.userId} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4 sm:px-5">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <Avatar user={u} size="md" />
                    <div className="min-w-0">
                      <div className="truncate font-bold">{name}</div>
                      <div className="truncate text-sm text-muted-foreground">
                        Asked {formatRelative(m.joinedAt)}
                        {u?.school && <span className="hidden sm:inline"> · {u.school}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0">
                    <Button
                      variant="ghost"
                      onClick={() => {
                        declineMember(group.id, m.userId);
                        toast("Request declined");
                      }}
                      aria-label={`Decline ${name}`}
                    >
                      Decline
                    </Button>
                    <Button
                      variant="primary"
                      disabled={full}
                      aria-describedby={full ? "requests-full" : undefined}
                      aria-label={`Approve ${name}`}
                      onClick={() => {
                        approveMember(group.id, m.userId);
                        toast.success(`${firstName(name)} is in`, {
                          description: "They can see sessions, notes and chat now.",
                        });
                      }}
                    >
                      <Check /> Approve
                    </Button>
                  </div>
                </li>
              );
            })}
          </Panel>
        </section>
      )}

      {/* Members and what they bring */}
      <section aria-labelledby="members-title">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-center gap-3">
            <SeatRing filled={active.length} total={group.maxSize} size={40} />
            <div>
              <h2 id="members-title" className="text-lg font-bold tracking-tight">
                Members
              </h2>
              <p className="text-sm text-muted-foreground">
                {active.length} of {group.maxSize} seats taken. Here&rsquo;s what everyone brings to the group.
              </p>
            </div>
          </div>
          <p className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
            <Lock className="size-3.5" strokeWidth={2.4} />
            Only members of this group can see this.
          </p>
        </div>

        <Panel as="ul" className="divide-y divide-border">
          {ordered.map((m) => {
            const u = users[m.userId];
            if (!u) return null;
            return (
              <MemberRow
                key={m.userId}
                user={u}
                member={m}
                stats={statsFor(m)}
                organiser={m.userId === group.ownerId}
                you={m.userId === me.id}
                viewerIsOwner={isOwner}
                onAsk={ask}
              />
            );
          })}
        </Panel>

        {seatsLeft > 0 && (
          <InviteDialog group={group}>
            <Button
              variant="ghost"
              className="mt-3 h-auto w-full justify-start gap-4 whitespace-normal rounded-[var(--radius-card)] border-[1.5px] border-dashed border-border-strong p-4 text-left hover:border-foreground/40 hover:bg-surface active:scale-[0.99] sm:px-5"
            >
              <span className="grid size-12 shrink-0 place-items-center rounded-full bg-surface-2 text-foreground [&_svg]:size-5">
                <UserPlus />
              </span>
              <span className="min-w-0">
                <span className="block font-bold">Invite a classmate</span>
                <span className="block text-sm font-medium text-muted-foreground">
                  {seatsLeft === 1 ? "One seat left" : `${seatsLeft} seats left`}. Share a link or the code {group.inviteCode}.
                </span>
              </span>
            </Button>
          </InviteDialog>
        )}
      </section>

      {confirm && (
        <ConfirmDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          title={confirm.title}
          description={confirm.description}
          confirmLabel={confirm.confirmLabel}
          destructive={confirm.destructive}
          onConfirm={confirm.run}
        />
      )}
    </div>
  );
}

/* ---------- One member ---------- */

function Stat({ label, value, children }: { label: string; value: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-semibold text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-[1.0625rem] font-bold tabular-nums tracking-tight">{value}</dd>
      {children}
    </div>
  );
}

function MemberRow({
  user,
  member,
  stats,
  organiser,
  you,
  viewerIsOwner,
  onAsk,
}: {
  user: User;
  member: GroupMember;
  stats: MemberStats;
  organiser: boolean;
  you: boolean;
  viewerIsOwner: boolean;
  onAsk: (kind: PendingAction["kind"], user: User) => void;
}) {
  const name = firstName(user.name);
  const canManage = viewerIsOwner && !you;
  const canLeave = you && !organiser;

  return (
    <li className="relative grid gap-x-8 gap-y-4 p-5 sm:p-6 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] lg:pr-16">
      <div className="flex min-w-0 items-start gap-3.5 pr-10 lg:pr-0">
        <Avatar user={user} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h3 className="min-w-0 truncate text-h3">{user.name}</h3>
            {you && <span className="text-sm font-medium text-muted-foreground">(you)</span>}
            {organiser && <Badge variant="blue">Organiser</Badge>}
          </div>
          <p className="text-sm text-muted-foreground">Joined {format(new Date(member.joinedAt), "d MMM")}</p>
          <p className="mt-2.5 flex gap-2 text-[0.9375rem] font-medium leading-6">
            <Sparkles className="mt-[3px] size-4 shrink-0 text-teal-text" strokeWidth={2.2} aria-hidden />
            <span>{thanksLine(stats, member.joinedAt, you)}</span>
          </p>
        </div>
      </div>

      <div className="min-w-0">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-4 rounded-2xl bg-surface-2/70 p-4 sm:grid-cols-4">
          <Stat
            label="Attended"
            value={stats.eligible > 0 ? `${stats.attendedSinceJoined} of ${stats.eligible}` : "First one soon"}
          />
          <Stat label="RSVP reliability" value={stats.rsvpReliability > 0 ? `${stats.rsvpReliability}%` : "Not yet"}>
            {stats.rsvpReliability > 0 && (
              <Progress
                value={stats.rsvpReliability}
                className="mt-2 h-1.5 bg-surface-3"
                label={`${name} replied to ${stats.rsvpReliability}% of session invites`}
              />
            )}
          </Stat>
          <Stat label="Questions added" value={stats.questions} />
          <Stat label="Retros completed" value={stats.retros} />
        </dl>
        {stats.taught.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-xs font-semibold text-muted-foreground">Taught</span>
            {stats.taught.map((t, i) => (
              <Badge key={`${t}-${i}`} variant="teal" size="md">
                {t}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {(canManage || canLeave) && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="subtle"
              size="icon"
              aria-label={you ? "Your membership options" : `Options for ${user.name}`}
              className="absolute right-2.5 top-3.5 size-11 sm:right-3.5 sm:top-4.5"
            >
              <Ellipsis />
            </Button>
          </DropdownMenuTrigger>
          <MemberMenu canManage={canManage} name={name} onAsk={(k) => onAsk(k, user)} />
        </DropdownMenu>
      )}
    </li>
  );
}

function MemberMenu({
  canManage,
  name,
  onAsk,
}: {
  canManage: boolean;
  name: string;
  onAsk: (kind: PendingAction["kind"]) => void;
}) {
  return (
    <DropdownMenuContent>
      {canManage ? (
        <>
          <DropdownMenuItem onSelect={() => onAsk("transfer")}>
            <UserRoundCog /> Make {name} organiser
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem destructive onSelect={() => onAsk("remove")}>
            <UserMinus /> Remove from group
          </DropdownMenuItem>
        </>
      ) : (
        <DropdownMenuItem destructive onSelect={() => onAsk("leave")}>
          <LogOut /> Leave group
        </DropdownMenuItem>
      )}
    </DropdownMenuContent>
  );
}
