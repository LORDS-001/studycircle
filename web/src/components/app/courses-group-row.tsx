"use client";

import Link from "next/link";
import { CircleCheck, Clock, Globe, Lock, Repeat, Target } from "lucide-react";
import { SeatRing } from "@/components/brand/rings";
import { AvatarStack } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { activeMembers } from "@/lib/queries";
import { GOALS } from "@/lib/templates";
import type { Group, ID, User } from "@/lib/types";
import { cn, plural } from "@/lib/utils";

export type GroupStatus = "member" | "pending" | "open" | "full";

export function groupStatus(group: Group, meId: ID): GroupStatus {
  const mine = group.members.find((m) => m.userId === meId);
  if (mine?.status === "active") return "member";
  if (mine?.status === "pending") return "pending";
  return activeMembers(group).length >= group.maxSize ? "full" : "open";
}

export const STATUS_ORDER: Record<GroupStatus, number> = { member: 0, pending: 1, open: 2, full: 3 };

export function GroupStatusLabel({ status, seatsLeft }: { status: GroupStatus; seatsLeft: number }) {
  if (status === "member")
    return (
      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-text">
        <CircleCheck className="size-4" strokeWidth={2.4} />
        You&rsquo;re a member
      </span>
    );
  if (status === "pending")
    return (
      <Badge variant="outline" size="md">
        <Clock /> Request pending
      </Badge>
    );
  if (status === "full")
    return (
      <Badge variant="neutral" size="md">
        Full
      </Badge>
    );
  return (
    <span className="text-sm font-semibold">
      Open<span className="font-medium text-muted-foreground"> · {plural(seatsLeft, "seat")} left</span>
    </span>
  );
}

/** A group inside a course: the seat ring leads, the charter reads as one line of facts. */
export function CourseGroupRow({ group, meId, users }: { group: Group; meId: ID; users: Record<ID, User> }) {
  const members = activeMembers(group);
  const status = groupStatus(group, meId);
  const seatsLeft = Math.max(0, group.maxSize - members.length);
  const VisIcon = group.visibility === "private" ? Lock : Globe;

  return (
    <Link
      href={`/groups/${group.id}`}
      className={cn(
        "pressable group grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-4 gap-y-3 px-4 py-4 hover:bg-surface-2/70 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:px-5",
        "active:scale-[0.995]",
      )}
    >
      <SeatRing filled={members.length} total={group.maxSize} size={52} />
      <div className="min-w-0">
        <h3 className="truncate text-base font-bold tracking-tight">{group.name}</h3>
        {group.description && <p className="mt-0.5 truncate text-sm text-muted-foreground">{group.description}</p>}
        <dl className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.8125rem] font-medium text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <dt>
              <Target className="size-3.5" aria-hidden />
              <span className="sr-only">Goal</span>
            </dt>
            <dd className="text-foreground/85">{GOALS[group.goal]}</dd>
          </div>
          <div className="flex items-center gap-1.5">
            <dt>
              <Repeat className="size-3.5" aria-hidden />
              <span className="sr-only">Cadence</span>
            </dt>
            <dd>{group.cadence}</dd>
          </div>
          <div className="flex items-center gap-1.5">
            <dt>
              <VisIcon className="size-3.5" aria-hidden />
              <span className="sr-only">Who can join</span>
            </dt>
            <dd>{group.visibility === "private" ? "Private" : "Public"}</dd>
          </div>
        </dl>
      </div>
      <div className="col-span-2 flex items-center justify-between gap-3 border-t border-border pt-3 sm:col-span-1 sm:flex-col sm:items-end sm:justify-center sm:gap-2 sm:border-t-0 sm:pt-0">
        <AvatarStack users={members.map((m) => users[m.userId])} size="xs" max={4} />
        <GroupStatusLabel status={status} seatsLeft={seatsLeft} />
      </div>
    </Link>
  );
}
