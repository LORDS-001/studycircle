import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  differenceInCalendarDays,
  format,
  formatDistanceToNowStrict,
  isToday,
  isTomorrow,
  isYesterday,
} from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** "6:00 pm" — brand style uses lowercase meridiem */
export function formatTime(date: Date | string) {
  return format(new Date(date), "h:mm a").toLowerCase();
}

/** "Today", "Tomorrow", "Thursday", or "Thu 24 Oct" when further out */
export function formatDay(date: Date | string, now = new Date()) {
  const d = new Date(date);
  if (isToday(d)) return "Today";
  if (isTomorrow(d)) return "Tomorrow";
  if (isYesterday(d)) return "Yesterday";
  const diff = differenceInCalendarDays(d, now);
  if (diff > 0 && diff < 7) return format(d, "EEEE");
  return format(d, "EEE d MMM");
}

export function formatWhen(date: Date | string) {
  return `${formatDay(date)}, ${formatTime(date)}`;
}

export function formatRelative(date: Date | string) {
  return formatDistanceToNowStrict(new Date(date), { addSuffix: true });
}

export function formatDuration(min: number) {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

export function firstName(name: string) {
  return name.split(" ")[0];
}

export function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function plural(n: number, one: string, many = `${one}s`) {
  return `${n} ${n === 1 ? one : many}`;
}

/** Availability slot index → "7:00 pm" */
export const SLOT_COUNT = 32;
export const SLOT_START_HOUR = 7;
export function slotLabel(slot: number) {
  const mins = SLOT_START_HOUR * 60 + slot * 30;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const d = new Date(2000, 0, 1, h, m);
  return format(d, m ? "h:mm a" : "h a").toLowerCase();
}
export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const WEEKDAYS_LONG = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
