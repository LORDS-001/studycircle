"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowDown, CalendarDays, ChevronRight, MessagesSquare, Pin, SendHorizontal, X } from "lucide-react";
import { toast } from "sonner";
import { ChatRunView, shapeThread } from "@/components/app/chat-thread";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useCurrentGroup } from "@/lib/group-context";
import { activeMembers, useGroupSessions, useMe, useUserMap } from "@/lib/queries";
import { useStore } from "@/lib/store";
import type { ID, Session } from "@/lib/types";
import { cn, firstName, formatDay, formatTime } from "@/lib/utils";

const MAX_LENGTH = 2000;
const COUNTER_FROM = 1800;
const NEAR_BOTTOM_PX = 120;

/* ---------- Scrolling: the panel scrolls on desktop, the page scrolls on phones ---------- */

const DESKTOP_QUERY = "(min-width: 64rem)";
function subscribeDesktop(cb: () => void) {
  const mq = window.matchMedia(DESKTOP_QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}
function useIsDesktop() {
  return React.useSyncExternalStore(
    subscribeDesktop,
    () => window.matchMedia(DESKTOP_QUERY).matches,
    () => false,
  );
}

function distanceFromBottom(el: HTMLElement | null) {
  if (el) return el.scrollHeight - el.scrollTop - el.clientHeight;
  return document.documentElement.scrollHeight - window.scrollY - window.innerHeight;
}
function scrollToEnd(el: HTMLElement | null, behavior: ScrollBehavior) {
  if (el) el.scrollTo({ top: el.scrollHeight, behavior });
  else window.scrollTo({ top: document.documentElement.scrollHeight, behavior });
}

/* ---------- Demo realtime: a teammate sometimes answers ---------- */

const REPLIES = [
  "Sounds good to me",
  "Nice, thanks for sharing",
  "Makes sense. See you there",
  "Good shout",
  "Agreed, let's do that",
  "Thanks! That helps a lot",
  "On it",
];

const STARTERS = ["Hi all, looking forward to studying together", "What should we cover first?", "When works for everyone this week?"];

export default function GroupChatPage() {
  const group = useCurrentGroup();
  const me = useMe();
  const users = useUserMap();
  const allMessages = useStore((s) => s.messages);
  const sendMessage = useStore((s) => s.sendMessage);
  const updateGroup = useStore((s) => s.updateGroup);
  const { upcoming } = useGroupSessions(group.id);
  const desktop = useIsDesktop();
  const isOwner = group.ownerId === me.id;

  const thread = React.useMemo(
    () =>
      allMessages
        .filter((m) => m.groupId === group.id)
        .sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt)),
    [allMessages, group.id],
  );
  const days = React.useMemo(() => shapeThread(thread), [thread]);
  const last = thread[thread.length - 1];

  const frameRef = React.useRef<HTMLDivElement>(null);
  const scrollerRef = React.useRef<HTMLDivElement>(null);
  const composerRef = React.useRef<HTMLFormElement>(null);
  const spacerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLTextAreaElement>(null);

  const [draft, setDraft] = React.useState("");
  const [initialIds] = React.useState(() => new Set(thread.map((m) => m.id)));
  const [atBottom, setAtBottom] = React.useState(true);
  const [seenId, setSeenId] = React.useState<ID | undefined>(() => last?.id);
  const [typing, setTyping] = React.useState<ID | null>(null);

  const atBottomRef = React.useRef(true);
  const lastIdRef = React.useRef(last?.id);
  const replyTimers = React.useRef<number[]>([]);

  // Desktop: fit the chat panel to the viewport so it feels like an app, not a long page.
  React.useLayoutEffect(() => {
    const el = frameRef.current;
    if (!el || !desktop) return;
    const fit = () => {
      const top = el.getBoundingClientRect().top + window.scrollY;
      el.style.height = `${Math.max(440, window.innerHeight - top - 24)}px`;
    };
    fit();
    window.addEventListener("resize", fit);
    return () => {
      window.removeEventListener("resize", fit);
      el.style.height = "";
    };
  }, [desktop]);

  // Phones: the composer is fixed, so reserve its height at the end of the thread.
  React.useLayoutEffect(() => {
    const composer = composerRef.current;
    const spacer = spacerRef.current;
    if (!composer || !spacer) return;
    const ro = new ResizeObserver(() => {
      spacer.style.height = `${composer.offsetHeight}px`;
    });
    ro.observe(composer);
    return () => ro.disconnect();
  }, []);

  // Track whether the reader is at the latest message
  React.useEffect(() => {
    const el = desktop ? scrollerRef.current : null;
    const target: HTMLElement | Window = el ?? window;
    const onScroll = () => {
      const bottom = distanceFromBottom(el) < NEAR_BOTTOM_PX;
      atBottomRef.current = bottom;
      setAtBottom(bottom);
      if (bottom) setSeenId(lastIdRef.current);
    };
    target.addEventListener("scroll", onScroll, { passive: true });
    return () => target.removeEventListener("scroll", onScroll);
  }, [desktop]);

  // Land on the latest message. After a frame, so the router's own scroll has settled.
  React.useEffect(() => {
    const id = requestAnimationFrame(() => scrollToEnd(desktop ? scrollerRef.current : null, "instant"));
    return () => cancelAnimationFrame(id);
  }, [desktop]);

  // New message: follow it if it's mine or the reader is already at the bottom; otherwise the pill shows.
  React.useLayoutEffect(() => {
    const prev = lastIdRef.current;
    lastIdRef.current = last?.id;
    if (!last || prev === last.id) return;
    if (last.userId === me.id || atBottomRef.current) {
      scrollToEnd(desktop ? scrollerRef.current : null, "smooth");
    }
  }, [last, me.id, desktop]);

  // Keep the typing hint in view when the reader is following along
  React.useLayoutEffect(() => {
    if (typing && atBottomRef.current) scrollToEnd(desktop ? scrollerRef.current : null, "smooth");
  }, [typing, desktop]);

  // Grow the textarea with its content, up to the CSS max height
  React.useLayoutEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight + 2}px`;
  }, [draft]);

  React.useEffect(() => {
    const timers = replyTimers.current;
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, []);

  const maybeReply = () => {
    if (typing || replyTimers.current.length) return;
    const others = activeMembers(group).filter((m) => m.userId !== me.id);
    if (others.length === 0 || Math.random() > 0.4) return;
    const who = others[Math.floor(Math.random() * others.length)].userId;
    const body = REPLIES[Math.floor(Math.random() * REPLIES.length)];
    const delay = 2000 + Math.random() * 2000;
    replyTimers.current.push(
      window.setTimeout(() => setTyping(who), 800),
      window.setTimeout(() => {
        setTyping(null);
        replyTimers.current.length = 0;
        // Demo stand-in for a realtime insert from another member
        useStore.getState().receiveMessage({ groupId: group.id, userId: who, body });
      }, delay),
    );
  };

  const send = (text = draft) => {
    const body = text.trim();
    if (!body) return;
    sendMessage(group.id, body.slice(0, MAX_LENGTH));
    setDraft("");
    inputRef.current?.focus();
    maybeReply();
  };

  const pin = (body: string | undefined) => {
    updateGroup(group.id, { pinnedMessage: body });
    toast(body ? "Pinned for everyone" : "Unpinned");
  };

  const unseenIndex = seenId ? thread.findIndex((m) => m.id === seenId) : -1;
  const unseen = last && last.userId !== me.id && !atBottom && last.id !== seenId ? thread.length - 1 - unseenIndex : 0;
  const typingUser = typing ? users[typing] : undefined;
  const near = draft.length >= COUNTER_FROM;

  return (
    <div
      ref={frameRef}
      className="flex flex-col lg:-mb-16 lg:overflow-hidden lg:rounded-[var(--radius-card)] lg:border lg:border-border lg:bg-surface"
    >
      <PinnedBar
        next={upcoming[0]}
        pinned={group.pinnedMessage}
        canUnpin={isOwner}
        onUnpin={() => pin(undefined)}
      />

      <div className="relative flex min-h-0 flex-1 flex-col">
        <div ref={scrollerRef} className="flex min-h-0 flex-1 flex-col lg:overflow-y-auto lg:overscroll-contain lg:px-5">
          {thread.length === 0 ? (
            <div className="m-auto flex max-w-sm flex-col items-center px-4 py-14 text-center">
              <div className="mb-4 grid size-12 place-items-center rounded-2xl bg-surface-2 text-muted-foreground">
                <MessagesSquare className="size-6" />
              </div>
              <h2 className="text-h3">Start the conversation</h2>
              <p className="mt-1 text-[0.9375rem] leading-6 text-muted-foreground">
                Say hi, share a resource or plan the next session. Only members of {group.name} can read this chat.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {STARTERS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setDraft(s);
                      inputRef.current?.focus();
                    }}
                    className="pressable min-h-11 rounded-full border border-border-strong bg-surface px-4 py-2 text-sm font-medium hover:border-foreground/40"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div
              role="log"
              aria-live="polite"
              aria-relevant="additions"
              aria-label={`Messages in ${group.name}`}
              className="pb-4"
            >
              {days.map((day) => (
                <section key={day.key} aria-label={day.label}>
                  <div className="sticky top-[6.5rem] z-10 flex justify-center pb-1 pt-4 lg:top-0">
                    <span className="rounded-full border border-border bg-surface/95 px-3 py-1 text-xs font-semibold text-muted-foreground shadow-[0_1px_2px_rgb(36_59_107/0.06)] backdrop-blur-sm">
                      {day.label}
                    </span>
                  </div>
                  {day.runs.map((run) => (
                    <ChatRunView
                      key={run.key}
                      run={run}
                      user={users[run.userId]}
                      mine={run.userId === me.id}
                      canPin={isOwner}
                      pinnedBody={group.pinnedMessage}
                      initialIds={initialIds}
                      onPin={pin}
                    />
                  ))}
                </section>
              ))}
            </div>
          )}

          {typingUser && (
            <p className="flex items-center gap-2 pb-4 text-sm text-muted-foreground">
              <Avatar user={typingUser} size="xs" />
              {firstName(typingUser.name)} is typing…
            </p>
          )}
          <div ref={spacerRef} className="shrink-0 lg:hidden" aria-hidden />
        </div>

        {unseen > 0 && (
          <button
            type="button"
            onClick={() => scrollToEnd(desktop ? scrollerRef.current : null, "smooth")}
            className="pressable animate-pop fixed bottom-[calc(9.5rem+env(safe-area-inset-bottom))] left-1/2 z-20 inline-flex h-10 -translate-x-1/2 items-center gap-1.5 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-float lg:absolute lg:bottom-4"
          >
            <ArrowDown className="size-4" strokeWidth={2.4} />
            {unseen === 1 ? "New message" : `${unseen} new messages`}
          </button>
        )}
      </div>

      <form
        ref={composerRef}
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-20 border-t border-border bg-background/90 px-4 py-3 backdrop-blur-md sm:px-6 lg:static lg:bg-surface lg:px-5 lg:py-4 lg:backdrop-blur-none"
      >
        <div className="flex items-end gap-2">
          <label htmlFor="chat-composer" className="sr-only">
            Message {group.name}
          </label>
          <textarea
            id="chat-composer"
            ref={inputRef}
            rows={1}
            value={draft}
            maxLength={MAX_LENGTH}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Message the group"
            aria-describedby="chat-composer-hint chat-composer-count"
            className="block max-h-40 min-h-11 w-full resize-none rounded-[1.375rem] border border-border-strong bg-surface px-4 py-[9px] text-base leading-6 text-foreground transition-[border-color,box-shadow] duration-150 placeholder:text-subtle-foreground hover:border-foreground/35 focus-visible:border-teal focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-teal/20"
          />
          <Button
            type="submit"
            size="icon"
            aria-label="Send message"
            disabled={!draft.trim()}
            className="size-11 rounded-full [&_svg]:size-5"
          >
            <SendHorizontal />
          </Button>
        </div>
        <div className={cn("flex items-center justify-between gap-3 px-1 text-xs", near ? "pt-1.5" : "lg:pt-1.5")}>
          <span id="chat-composer-hint" className="hidden text-subtle-foreground lg:inline">
            Enter to send. Shift + Enter for a new line.
          </span>
          <span
            id="chat-composer-count"
            aria-live="polite"
            className={cn(
              "ml-auto font-semibold tabular-nums",
              near ? "text-muted-foreground" : "sr-only",
              draft.length >= MAX_LENGTH && "text-destructive",
            )}
          >
            {near ? `${MAX_LENGTH - draft.length} characters left` : ""}
          </span>
        </div>
      </form>
    </div>
  );
}

/* ---------- Pinned: the next session, plus the organiser's pinned message ---------- */

function PinnedBar({
  next,
  pinned,
  canUnpin,
  onUnpin,
}: {
  next?: Session;
  pinned?: string;
  canUnpin: boolean;
  onUnpin: () => void;
}) {
  if (!next && !pinned) return null;
  const live = next?.status === "live";
  return (
    <div className="mb-2 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface lg:mb-0 lg:shrink-0 lg:rounded-none lg:border-x-0 lg:border-t-0">
      {next && (
        <Link
          href={live ? `/sessions/${next.id}/live` : `/sessions/${next.id}`}
          className="group flex min-h-14 items-center gap-3 px-4 py-2.5 transition-colors hover:bg-surface-2 focus-visible:-outline-offset-2 lg:px-5"
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-teal-soft text-teal-text">
            <CalendarDays className="size-[18px]" strokeWidth={2.2} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-xs font-semibold text-muted-foreground">{live ? "Happening now" : "Next session"}</span>
            <span className="flex min-w-0 flex-wrap items-baseline gap-x-2 text-sm">
              <span className="truncate font-bold">{next.title}</span>
              <span className="font-medium text-muted-foreground">
                {live ? "Join Session Mode" : `${formatDay(next.startsAt)}, ${formatTime(next.startsAt)}`}
              </span>
            </span>
          </span>
          <ChevronRight className="size-4 shrink-0 text-subtle-foreground transition-transform duration-150 group-hover:translate-x-0.5" />
        </Link>
      )}
      {pinned && (
        <div className="flex min-h-14 items-center gap-3 py-2.5 pl-4 pr-2 lg:pl-5 lg:pr-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-gold-soft text-gold-foreground dark:bg-surface-2 dark:text-foreground">
            <Pin className="size-[18px] rotate-45" strokeWidth={2.2} />
          </span>
          <p className="min-w-0 flex-1 text-sm font-medium leading-5">
            <span className="sr-only">Pinned message: </span>
            <span className="line-clamp-2 wrap-anywhere">{pinned}</span>
          </p>
          {canUnpin && (
            <Button variant="subtle" size="icon" aria-label="Unpin message" onClick={onUnpin} className="size-11 shrink-0">
              <X />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
