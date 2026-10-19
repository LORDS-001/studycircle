"use client";

import * as React from "react";
import { format } from "date-fns";
import { createEvent } from "ics";
import type { Group, Recurrence, Session } from "@/lib/types";
import { formatDay, formatTime } from "@/lib/utils";
import { occurrences } from "@/lib/store";

/** Wall-clock time that re-renders every `intervalMs`. Keeps Date.now() out of render. */
export function useNow(intervalMs = 30_000) {
  const [now, setNow] = React.useState(() => Date.now());
  React.useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}

/** How many sessions a series will create, before it's created. Same logic as the store. */
export function seriesDates(start: Date, recurrence: Recurrence, until?: Date): Date[] {
  return occurrences(start, recurrence, until);
}

export const RECURRENCE_LABEL: Record<Recurrence, string> = {
  none: "One-off",
  weekly: "Weekly",
  "twice-weekly": "Twice a week",
};

/** 30-minute start times from 7:00 am to 10:30 pm, matching the availability grid. */
export const START_TIMES = Array.from({ length: 32 }, (_, i) => {
  const mins = 7 * 60 + i * 30;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const value = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  return { value, label: formatTime(new Date(2000, 0, 1, h, m)) };
});

export function sessionEnd(s: Pick<Session, "startsAt" | "durationMin">) {
  return new Date(+new Date(s.startsAt) + s.durationMin * 60_000);
}

/** "6:00 – 7:00 pm" */
export function timeRange(s: Pick<Session, "startsAt" | "durationMin">) {
  const start = formatTime(s.startsAt);
  const end = formatTime(sessionEnd(s));
  const [sTime, sMer] = start.split(" ");
  const [, eMer] = end.split(" ");
  return sMer === eMer ? `${sTime} – ${end}` : `${start} – ${end}`;
}

function slug(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48);
}

/** Builds an .ics for one session and hands it to the browser. Returns false if it couldn't. */
export function downloadSessionIcs(session: Session, group?: Group) {
  const description = [
    session.agenda,
    session.videoUrl ? `Video call: ${session.videoUrl}` : "",
    group ? `StudyCircle group: ${group.name}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  const { error, value } = createEvent({
    uid: `${session.id}@studycircle.app`,
    start: +new Date(session.startsAt),
    startInputType: "utc",
    startOutputType: "utc",
    duration: { minutes: session.durationMin },
    title: group ? `${session.title} · ${group.name}` : session.title,
    description,
    location: session.videoUrl ?? session.location,
    url: session.videoUrl,
    status: "CONFIRMED",
    busyStatus: "BUSY",
    productId: "studycircle/sessions",
    alarms: [{ action: "display", description: "Study session soon", trigger: { hours: 1, before: true } }],
  });
  if (error || !value) return false;

  const blob = new Blob([value], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${slug(session.title) || "session"}-${format(new Date(session.startsAt), "yyyy-MM-dd")}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  return true;
}

/** Names joined for a sentence: "Kemi", "Kemi and Ife", "Kemi, Ife and Tunde" */
export function listNames(names: string[]) {
  if (names.length <= 1) return names[0] ?? "";
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

/** "today", "tomorrow", "Thursday", "on Thu 24 Oct" — reads naturally mid-sentence */
export function dayPhrase(date: string | Date) {
  const d = formatDay(date);
  if (d === "Today" || d === "Tomorrow" || d === "Yesterday") return d.toLowerCase();
  return /^[A-Z][a-z]+day$/.test(d) ? d : `on ${d}`;
}
