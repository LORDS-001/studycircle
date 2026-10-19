"use client";

import * as React from "react";
import { format, isSameYear, isToday, isYesterday } from "date-fns";
import { Copy, Ellipsis, Pin, PinOff } from "lucide-react";
import { toast } from "sonner";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/overlays";
import type { ID, Message, User } from "@/lib/types";
import { cn, formatTime } from "@/lib/utils";

/* ---------- Thread shaping ---------- */

const RUN_GAP_MS = 5 * 60_000;

export interface ChatRun {
  key: string;
  userId: ID;
  messages: Message[];
}

export interface ChatDay {
  key: string;
  label: string;
  runs: ChatRun[];
}

export function chatDayLabel(date: Date) {
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, isSameYear(date, new Date()) ? "EEE d MMM" : "EEE d MMM yyyy");
}

/** Days → runs of consecutive messages from one sender, each within 5 minutes of the last. */
export function shapeThread(messages: Message[]): ChatDay[] {
  const days: ChatDay[] = [];
  let prev: Message | undefined;
  for (const m of messages) {
    const d = new Date(m.createdAt);
    const key = format(d, "yyyy-MM-dd");
    let day = days[days.length - 1];
    if (!day || day.key !== key) {
      day = { key, label: chatDayLabel(d), runs: [] };
      days.push(day);
      prev = undefined;
    }
    const run = day.runs[day.runs.length - 1];
    const sameRun = run && prev && prev.userId === m.userId && +d - +new Date(prev.createdAt) <= RUN_GAP_MS;
    if (sameRun) run.messages.push(m);
    else day.runs.push({ key: m.id, userId: m.userId, messages: [m] });
    prev = m;
  }
  return days;
}

/* ---------- Safe auto-linking ---------- */

const URL_RE = /\bhttps?:\/\/[^\s<>"'`]+/gi;
const TRAILING = /[.,!?;:)\]}]+$/;

export function Linkified({ text, mine }: { text: string; mine: boolean }) {
  const out: React.ReactNode[] = [];
  let cursor = 0;
  for (const match of text.matchAll(URL_RE)) {
    const start = match.index ?? 0;
    const url = match[0].replace(TRAILING, "");
    if (start > cursor) out.push(text.slice(cursor, start));
    out.push(
      <a
        key={start}
        href={url}
        target="_blank"
        rel="noreferrer noopener"
        className={cn(
          "font-semibold underline decoration-[1.5px] underline-offset-2 wrap-anywhere",
          mine ? "text-primary-foreground decoration-primary-foreground/50 hover:decoration-primary-foreground" : "text-teal-text decoration-teal-text/40 hover:decoration-teal-text",
        )}
      >
        {url.replace(/^https?:\/\//, "")}
      </a>,
    );
    cursor = start + url.length;
  }
  if (cursor < text.length) out.push(text.slice(cursor));
  return <>{out}</>;
}

/* ---------- A run of messages from one person ---------- */

function cornerClass(mine: boolean, index: number, count: number) {
  if (count === 1) return "";
  const first = index === 0;
  const last = index === count - 1;
  if (mine) return cn(!first && "rounded-tr-md", !last && "rounded-br-md");
  return cn(!first && "rounded-tl-md", !last && "rounded-bl-md");
}

export function ChatRunView({
  run,
  user,
  mine,
  canPin,
  pinnedBody,
  initialIds,
  onPin,
}: {
  run: ChatRun;
  user?: User;
  mine: boolean;
  canPin: boolean;
  pinnedBody?: string;
  /** Messages present when the page loaded; anything newer gets a small entrance */
  initialIds: Set<ID>;
  onPin: (body: string | undefined) => void;
}) {
  const name = mine ? "You" : (user?.name ?? "Former member");
  // On touch screens there's no hover: tapping a bubble reveals its menu
  const [active, setActive] = React.useState<ID | null>(null);
  const first = run.messages[0];

  return (
    <div className={cn("flex gap-2.5 pt-4", mine && "justify-end")}>
      {!mine && <Avatar user={user} size="sm" className="mt-0.5" />}
      <div className={cn("flex min-w-0 max-w-[min(85%,34rem)] flex-col", mine ? "items-end" : "items-start")}>
        <div aria-hidden className={cn("mb-1 flex items-baseline gap-2 px-1 text-xs", mine && "flex-row-reverse")}>
          {!mine && <span className="font-bold text-foreground">{name}</span>}
          <span className="font-medium text-subtle-foreground">{formatTime(first.createdAt)}</span>
        </div>
        <div className={cn("flex w-full flex-col gap-[3px]", mine ? "items-end" : "items-start")}>
          {run.messages.map((m, i) => {
            const pinned = pinnedBody === m.body;
            return (
              <div key={m.id} className={cn("group/msg flex max-w-full items-center gap-1.5", mine && "flex-row-reverse")}>
                <div
                  onClick={canPin ? () => setActive((a) => (a === m.id ? null : m.id)) : undefined}
                  className={cn(
                    "min-w-0 whitespace-pre-wrap rounded-[1.125rem] px-3.5 py-2 text-[0.9375rem] leading-6 wrap-anywhere",
                    mine
                      ? "origin-bottom-right bg-primary text-primary-foreground"
                      : "origin-bottom-left border border-border bg-surface lg:border-transparent lg:bg-surface-2",
                    cornerClass(mine, i, run.messages.length),
                    !initialIds.has(m.id) && "animate-pop",
                  )}
                >
                  <span className="sr-only">
                    {name} at {formatTime(m.createdAt)}:{" "}
                  </span>
                  <Linkified text={m.body} mine={mine} />
                </div>
                {i > 0 && (
                  <time
                    dateTime={m.createdAt}
                    aria-hidden
                    className="hidden shrink-0 text-[11px] font-medium text-subtle-foreground opacity-0 transition-opacity duration-150 group-hover/msg:opacity-100 [@media(hover:hover)]:inline"
                  >
                    {formatTime(m.createdAt)}
                  </time>
                )}
                {pinned && <Pin className="size-3.5 shrink-0 rotate-45 text-subtle-foreground" aria-label="Pinned" />}
                {canPin && <MessageMenu body={m.body} pinned={pinned} onPin={onPin} revealed={active === m.id} />}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function MessageMenu({
  body,
  pinned,
  onPin,
  revealed,
}: {
  body: string;
  pinned: boolean;
  onPin: (body: string | undefined) => void;
  revealed: boolean;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="subtle"
          size="icon-sm"
          aria-label="Message options"
          className={cn(
            "size-9 shrink-0 rounded-full focus-visible:opacity-100 group-hover/msg:opacity-100 data-[state=open]:opacity-100",
            revealed ? "opacity-100" : "opacity-0",
          )}
        >
          <Ellipsis />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center">
        {pinned ? (
          <DropdownMenuItem onSelect={() => onPin(undefined)}>
            <PinOff /> Unpin from the top
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onSelect={() => onPin(body)}>
            <Pin /> Pin to the top
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          onSelect={async () => {
            try {
              await navigator.clipboard.writeText(body);
              toast.success("Copied to clipboard");
            } catch {
              toast.error("Couldn't copy. Select the text and copy it manually.");
            }
          }}
        >
          <Copy /> Copy text
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
