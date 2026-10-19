"use client";

import * as React from "react";
import Link from "next/link";
import { BookOpen, CalendarPlus, Clock, Plus, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { useShallow } from "zustand/react/shallow";
import { Page, PageHeader } from "@/components/app/app-shell";
import { SeatRing } from "@/components/brand/rings";
import { AvatarStack } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState, SectionTitle } from "@/components/ui/surface";
import { activeMembers, useMe, useMyGroups, useMyUpcomingSessions, useUserMap } from "@/lib/queries";
import { useStore } from "@/lib/store";
import type { Course, Group, Session, User } from "@/lib/types";
import { cn, firstName, formatDay, formatTime, plural } from "@/lib/utils";

export default function GroupsPage() {
  const me = useMe();
  const users = useUserMap();
  const groups = useMyGroups();
  const upcoming = useMyUpcomingSessions();
  const courses = useStore((s) => s.courses);
  const pending = useStore(
    useShallow((s) =>
      s.groups.filter((g) => g.members.some((m) => m.userId === s.currentUserId && m.status === "pending")),
    ),
  );
  const declineMember = useStore((s) => s.declineMember);

  const nextByGroup = React.useMemo(() => {
    const map: Record<string, Session> = {};
    for (const s of upcoming) map[s.groupId] ??= s;
    return map;
  }, [upcoming]);

  // Soonest session first; groups without one keep their order at the end
  const sorted = React.useMemo(
    () =>
      [...groups].sort((a, b) => {
        const na = nextByGroup[a.id];
        const nb = nextByGroup[b.id];
        if (na && nb) return +new Date(na.startsAt) - +new Date(nb.startsAt);
        return Number(!!nb) - Number(!!na);
      }),
    [groups, nextByGroup],
  );

  const courseOf = (g: Group) => courses.find((c) => c.id === g.courseId);

  return (
    <Page>
      <PageHeader
        title="Your groups"
        description={
          groups.length
            ? `${plural(groups.length, "group")}, with the next session first.`
            : "Groups you join or start show up here."
        }
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/courses">
                <BookOpen />
                Browse courses
              </Link>
            </Button>
            <Button asChild>
              <Link href="/groups/new">
                <Plus />
                Create group
              </Link>
            </Button>
          </>
        }
      />

      <div className="stagger space-y-10">
        {sorted.length > 0 ? (
          <ul className="grid gap-3 sm:gap-4 md:grid-cols-2">
            {sorted.map((g) => (
              <li key={g.id}>
                <GroupCard group={g} course={courseOf(g)} next={nextByGroup[g.id]} users={users} meId={me.id} />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={<UsersRound />}
            title="You're not in a group yet"
            description="Groups of three to six work best. Find one in your courses, or start your own and invite classmates."
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <Button asChild>
                  <Link href="/courses">Browse courses</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/groups/new">Create group</Link>
                </Button>
              </div>
            }
          />
        )}

        {pending.length > 0 && (
          <section aria-labelledby="pending-requests">
            <SectionTitle id="pending-requests">Waiting for approval</SectionTitle>
            <ul className="divide-y divide-border overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface">
              {pending.map((g) => {
                const course = courseOf(g);
                const owner = users[g.ownerId];
                return (
                  <li key={g.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:gap-4 sm:px-5">
                    <Link href={`/groups/${g.id}`} className="flex min-w-0 flex-1 items-center gap-4 rounded-xl">
                      <SeatRing filled={activeMembers(g).length} total={g.maxSize} size={40} />
                      <span className="min-w-0">
                        <span className="block truncate font-bold hover:underline">{g.name}</span>
                        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Clock className="size-3.5 shrink-0" />
                          <span className="truncate">
                            {course ? `${course.code} · ` : ""}
                            {owner
                              ? `${firstName(owner.name)} will review your request`
                              : "Your request is being reviewed"}
                          </span>
                        </span>
                      </span>
                    </Link>
                    <Button
                      variant="ghost"
                      className="self-start sm:self-auto"
                      onClick={() => {
                        declineMember(g.id, me.id);
                        toast("Request cancelled", { description: `You can ask to join ${g.name} again any time.` });
                      }}
                    >
                      Cancel request
                    </Button>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </div>
    </Page>
  );
}

function GroupCard({
  group,
  course,
  next,
  users,
  meId,
}: {
  group: Group;
  course?: Course;
  next?: Session;
  users: Record<string, User>;
  meId: string;
}) {
  const members = activeMembers(group);
  const isOwner = group.ownerId === meId;
  const requests = group.members.filter((m) => m.status === "pending").length;
  const live = next?.status === "live";

  return (
    <Link
      href={`/groups/${group.id}`}
      className="pressable group flex h-full flex-col rounded-[var(--radius-card)] border border-border bg-surface p-4 hover:border-border-strong hover:shadow-raised active:scale-[0.995] sm:p-5"
    >
      <div className="flex items-start gap-4">
        <SeatRing filled={members.length} total={group.maxSize} size={52} />
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-h3">{group.name}</h2>
          {course && (
            <p className="truncate text-sm text-muted-foreground">
              <span className="font-semibold text-foreground/85">{course.code}</span> · {course.title}
            </p>
          )}
        </div>
        {isOwner && requests > 0 && (
          <Badge variant="gold" className="shrink-0">
            {requests} to review
          </Badge>
        )}
      </div>

      <div
        className={cn(
          "mt-4 flex items-center gap-3 rounded-2xl px-3.5 py-3",
          live ? "bg-teal text-teal-foreground" : "bg-surface-2",
        )}
      >
        {next ? (
          <>
            <div className="min-w-0 flex-1">
              <div className={cn("text-xs font-semibold", live ? "text-teal-foreground/85" : "text-muted-foreground")}>
                {live ? "Happening now" : "Next session"}
              </div>
              <div className="truncate text-[0.9375rem] font-bold">
                {live ? next.title : `${formatDay(next.startsAt)}, ${formatTime(next.startsAt)}`}
              </div>
              {!live && <div className="truncate text-sm text-muted-foreground">{next.title}</div>}
            </div>
            {live && <Badge variant="neutral">Live</Badge>}
          </>
        ) : (
          <div className="flex min-w-0 items-center gap-2.5 text-sm text-muted-foreground">
            <CalendarPlus className="size-4 shrink-0" />
            <span className="truncate">No session planned yet</span>
          </div>
        )}
      </div>

      <div className="mt-auto flex items-center justify-between gap-3 pt-4">
        <span className="flex items-center gap-2.5">
          <AvatarStack users={members.map((m) => users[m.userId])} size="xs" max={5} />
          <span className="text-sm font-medium text-muted-foreground">
            {members.length} of {group.maxSize}
          </span>
        </span>
        {isOwner && <span className="text-xs font-semibold text-subtle-foreground">You organise this</span>}
      </div>
    </Link>
  );
}
