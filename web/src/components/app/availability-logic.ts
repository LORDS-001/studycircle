import { format } from "date-fns";
import type { Availability, ID } from "@/lib/types";
import { SLOT_COUNT, SLOT_START_HOUR, WEEKDAYS_LONG } from "@/lib/utils";

/*
 * Pure helpers for the availability grid and the suggested-times ranking.
 * Slot keys follow the store format: "weekday:slot" (0 = Mon, slot 0 = 07:00).
 */

export const DAY_COUNT = 7;

export const slotKey = (day: number, slot: number) => `${day}:${slot}`;

function slotDate(slot: number) {
  const mins = SLOT_START_HOUR * 60 + slot * 30;
  return new Date(2000, 0, 1, Math.floor(mins / 60), mins % 60);
}

/** "7:00 pm" (always with minutes, for accessible names) */
export function slotTime(slot: number) {
  return format(slotDate(slot), "h:mm a").toLowerCase();
}

/** Grid gutter label: "7 am", "12 pm" */
export function hourLabel(slot: number) {
  return format(slotDate(slot), "h a").toLowerCase();
}

/** "6:00–8:00 pm" or "11:30 am–1:00 pm". `end` is exclusive (slot after the block). */
export function rangeLabel(start: number, end: number) {
  const a = slotDate(start);
  const b = slotDate(end);
  const sameMeridiem = format(a, "a") === format(b, "a");
  const from = format(a, sameMeridiem ? "h:mm" : "h:mm a").toLowerCase();
  return `${from}–${format(b, "h:mm a").toLowerCase()}`;
}

export function durationLabel(slots: number) {
  const mins = slots * 30;
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

/** Cells inside the rectangle spanned by two corners */
export function rectKeys(a: { day: number; slot: number }, b: { day: number; slot: number }) {
  const keys: string[] = [];
  for (let d = Math.min(a.day, b.day); d <= Math.max(a.day, b.day); d++) {
    for (let s = Math.min(a.slot, b.slot); s <= Math.max(a.slot, b.slot); s++) keys.push(slotKey(d, s));
  }
  return keys;
}

export function sameSet(a: Set<string>, b: Set<string>) {
  if (a.size !== b.size) return false;
  for (const k of a) if (!b.has(k)) return false;
  return true;
}

/** Contiguous free blocks per day, in week order: for the "Your week" summary */
export function blocksOf(slots: Set<string>) {
  const out: { day: number; start: number; end: number }[] = [];
  for (let day = 0; day < DAY_COUNT; day++) {
    let start = -1;
    for (let s = 0; s <= SLOT_COUNT; s++) {
      const on = s < SLOT_COUNT && slots.has(slotKey(day, s));
      if (on && start < 0) start = s;
      if (!on && start >= 0) {
        out.push({ day, start, end: s });
        start = -1;
      }
    }
  }
  return out;
}

export interface Heatmap {
  /** Members who have saved availability for this group */
  responded: ID[];
  /** Active members with no saved availability */
  missing: ID[];
  /** key → member ids free in that slot, in member order */
  free: Map<string, ID[]>;
  max: number;
}

export function buildHeatmap(memberIds: ID[], availability: Availability[], groupId: ID): Heatmap {
  const byUser = new Map<ID, Set<string>>();
  for (const a of availability) {
    if (a.groupId === groupId && memberIds.includes(a.userId)) byUser.set(a.userId, new Set(a.slots));
  }
  const free = new Map<string, ID[]>();
  let max = 0;
  for (let day = 0; day < DAY_COUNT; day++) {
    for (let s = 0; s < SLOT_COUNT; s++) {
      const key = slotKey(day, s);
      const who = memberIds.filter((id) => byUser.get(id)?.has(key));
      if (who.length) free.set(key, who);
      max = Math.max(max, who.length);
    }
  }
  return {
    responded: memberIds.filter((id) => byUser.has(id)),
    missing: memberIds.filter((id) => !byUser.has(id)),
    free,
    max,
  };
}

export interface Suggestion {
  rank: number;
  day: number;
  start: number;
  /** exclusive */
  end: number;
  people: ID[];
}

/**
 * Top suggested times. A candidate is a maximal run of slots on one day where
 * exactly the same people are free. Ranked by people free, then block length,
 * then earliest in the week. Candidates touching a better pick on the same day
 * are skipped so the three options are genuinely different.
 */
export function suggestTimes(heat: Heatmap, limit = 3): Suggestion[] {
  const minPeople = heat.responded.length >= 2 ? 2 : 1;
  const candidates: Omit<Suggestion, "rank">[] = [];
  for (let day = 0; day < DAY_COUNT; day++) {
    let s = 0;
    while (s < SLOT_COUNT) {
      const who = heat.free.get(slotKey(day, s)) ?? [];
      const sig = who.join(",");
      let e = s + 1;
      while (e < SLOT_COUNT && (heat.free.get(slotKey(day, e)) ?? []).join(",") === sig) e++;
      if (who.length >= minPeople) candidates.push({ day, start: s, end: e, people: who });
      s = e;
    }
  }
  candidates.sort(
    (a, b) =>
      b.people.length - a.people.length ||
      b.end - b.start - (a.end - a.start) ||
      a.day - b.day ||
      a.start - b.start,
  );
  const picks: Suggestion[] = [];
  for (const c of candidates) {
    if (picks.length >= limit) break;
    const touches = picks.some((p) => p.day === c.day && c.start <= p.end && c.end >= p.start);
    if (!touches) picks.push({ ...c, rank: picks.length + 1 });
  }
  return picks;
}

export function suggestionTitle(s: Suggestion) {
  return `${WEEKDAYS_LONG[s.day]}, ${rangeLabel(s.start, s.end)}`;
}
