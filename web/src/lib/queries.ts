"use client";

import { useMemo, useSyncExternalStore } from "react";
import { useShallow } from "zustand/react/shallow";
import { useStore } from "./store";
import type { Group, ID, Session, User } from "./types";

/* A shared clock that ticks every 30 s, so "upcoming" vs "past" stays fresh without impure renders. */
let clockNow = Date.now();
const clockListeners = new Set<() => void>();
let clockTimer: ReturnType<typeof setInterval> | undefined;
function subscribeClock(cb: () => void) {
  clockListeners.add(cb);
  if (!clockTimer) {
    clockTimer = setInterval(() => {
      clockNow = Date.now();
      clockListeners.forEach((l) => l());
    }, 30_000);
  }
  return () => {
    clockListeners.delete(cb);
    if (!clockListeners.size && clockTimer) {
      clearInterval(clockTimer);
      clockTimer = undefined;
    }
  };
}
export function useClock() {
  return useSyncExternalStore(subscribeClock, () => clockNow, () => clockNow);
}

/*
 * Read hooks. These are the seams where Supabase queries + realtime
 * subscriptions will plug in later.
 */

export function useMe(): User {
  return useStore((s) => s.users.find((u) => u.id === s.currentUserId)!);
}

export function useUserMap(): Record<ID, User> {
  const users = useStore((s) => s.users);
  return useMemo(() => Object.fromEntries(users.map((u) => [u.id, u])), [users]);
}

export function useGroup(id: ID): Group | undefined {
  return useStore((s) => s.groups.find((g) => g.id === id));
}

export function activeMembers(group: Group) {
  return group.members.filter((m) => m.status === "active");
}

export function isMember(group: Group, userId: ID) {
  return group.members.some((m) => m.userId === userId && m.status === "active");
}

export function useMyGroups(): Group[] {
  return useStore(
    useShallow((s) =>
      s.groups.filter((g) => g.members.some((m) => m.userId === s.currentUserId && m.status === "active")),
    ),
  );
}

export function useMyCourses() {
  return useStore(
    useShallow((s) => s.courses.filter((c) => (s.courseMembers[c.id] ?? []).includes(s.currentUserId ?? ""))),
  );
}

export function useGroupSessions(groupId: ID) {
  const sessions = useStore((s) => s.sessions);
  const now = useClock();
  return useMemo(() => {
    const list = sessions
      .filter((s) => s.groupId === groupId)
      .sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt));
    const isPast = (s: Session) =>
      s.status === "ended" || (s.status !== "live" && +new Date(s.startsAt) + s.durationMin * 60_000 < now);
    return {
      all: list,
      upcoming: list.filter((s) => !isPast(s)),
      past: list.filter(isPast).reverse(),
    };
  }, [sessions, groupId, now]);
}

/** Upcoming sessions across all of my groups */
export function useMyUpcomingSessions() {
  const groups = useMyGroups();
  const sessions = useStore((s) => s.sessions);
  const now = useClock();
  return useMemo(() => {
    const ids = new Set(groups.map((g) => g.id));
    return sessions
      .filter(
        (s) =>
          ids.has(s.groupId) &&
          (s.status === "live" || (s.status === "scheduled" && +new Date(s.startsAt) + s.durationMin * 60_000 > now)),
      )
      .sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt));
  }, [groups, sessions, now]);
}

/** Ended sessions I attended where I haven't submitted a retro */
export function usePendingRetros() {
  const me = useStore((s) => s.currentUserId);
  const groups = useMyGroups();
  const sessions = useStore((s) => s.sessions);
  const retros = useStore((s) => s.retros);
  return useMemo(() => {
    const ids = new Set(groups.map((g) => g.id));
    return sessions.filter(
      (s) =>
        ids.has(s.groupId) &&
        s.status === "ended" &&
        s.rsvps[me ?? ""] === "yes" &&
        !retros.some((r) => r.sessionId === s.id && r.userId === me),
    );
  }, [groups, sessions, retros, me]);
}

export function useContribution(groupId: ID) {
  const { sessions, questions, retros, groups } = useStore(
    useShallow((s) => ({ sessions: s.sessions, questions: s.questions, retros: s.retros, groups: s.groups })),
  );
  return useMemo(() => {
    const group = groups.find((g) => g.id === groupId);
    if (!group) return {};
    const gs = sessions.filter((s) => s.groupId === groupId);
    const ended = gs.filter((s) => s.status === "ended");
    const result: Record<
      ID,
      { attended: number; scheduled: number; rsvpReliability: number; questions: number; taught: string[]; retros: number }
    > = {};
    for (const m of activeMembers(group)) {
      const attended = ended.filter((s) => s.rsvps[m.userId] === "yes").length;
      const responded = gs.filter((s) => s.rsvps[m.userId]).length;
      result[m.userId] = {
        attended,
        scheduled: ended.length,
        rsvpReliability: gs.length ? Math.round((responded / gs.length) * 100) : 0,
        questions: questions.filter((q) => q.groupId === groupId && q.createdBy === m.userId).length,
        taught: ended.filter((s) => s.template === "jigsaw" && s.jigsawTopics[m.userId]).map((s) => s.jigsawTopics[m.userId]),
        retros: retros.filter((r) => r.userId === m.userId && ended.some((s) => s.id === r.sessionId)).length,
      };
    }
    return result;
  }, [sessions, questions, retros, groups, groupId]);
}
