"use client";

import * as React from "react";
import Link from "next/link";
import { format } from "date-fns";
import { CircleHelp, ListChecks, NotebookPen, Search, TextQuote, X } from "lucide-react";
import { TemplateBadge } from "@/components/app/session-bits";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/surface";
import { useCurrentGroup } from "@/lib/group-context";
import { useGroupSessions, useMe, useUserMap } from "@/lib/queries";
import type { Session, User } from "@/lib/types";
import { cn, firstName, formatDay, formatRelative, formatTime, plural } from "@/lib/utils";

/* ---------- Parsing the scribe's free text into readable pieces ---------- */

function lines(text: string) {
  return text
    .split(/\n+/)
    .map((l) => l.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "").trim())
    .filter(Boolean);
}

/** "Why O(n)? What is balanced?" reads better as two questions. */
function questionsOf(text: string) {
  return lines(text).flatMap((l) => l.split(/(?<=\?)\s+(?=\S)/));
}

/** "Tunde: add 3 questions" → owner + task, so the owner can be set in bold. */
function actionOf(line: string) {
  const m = line.match(/^([A-Z][\p{L}'-]*(?: [A-Z][\p{L}'-]*)?):\s+(.+)$/u);
  return m ? { who: m[1], task: m[2] } : { who: null, task: line };
}

function scribeOf(session: Session) {
  return Object.entries(session.roles).find(([, r]) => r === "scribe")?.[0];
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;
  const parts = text.split(new RegExp(`(${escapeRegExp(query)})`, "gi"));
  return (
    <>
      {parts.map((p, i) =>
        i % 2 === 1 ? (
          <mark key={i} className="rounded-[4px] bg-gold-soft px-0.5 text-gold-foreground dark:bg-teal-soft dark:text-foreground">
            {p}
          </mark>
        ) : (
          <React.Fragment key={i}>{p}</React.Fragment>
        ),
      )}
    </>
  );
}

/* ---------- Page ---------- */

export default function GroupNotesPage() {
  const group = useCurrentGroup();
  const users = useUserMap();
  const me = useMe();
  const { past } = useGroupSessions(group.id);
  const [query, setQuery] = React.useState("");
  const [openOnly, setOpenOnly] = React.useState(false);
  const deferred = React.useDeferredValue(query.trim());

  // Newest first: `past` is already reversed chronologically.
  const ended = React.useMemo(() => past.filter((s) => s.status === "ended"), [past]);
  const withOpen = ended.filter((s) => questionsOf(s.notes.openQuestions).length > 0).length;

  const results = React.useMemo(() => {
    const q = deferred.toLowerCase();
    return ended.filter((s) => {
      if (openOnly && questionsOf(s.notes.openQuestions).length === 0) return false;
      if (!q) return true;
      const scribe = users[scribeOf(s) ?? ""]?.name ?? "";
      return [s.title, s.notes.summary, s.notes.openQuestions, s.notes.actionItems, scribe]
        .join("\n")
        .toLowerCase()
        .includes(q);
    });
  }, [ended, deferred, openOnly, users]);

  if (ended.length === 0) {
    return (
      <EmptyState
        icon={<NotebookPen />}
        title="No notes yet"
        description="Notes from your sessions collect here. The scribe takes them during Session Mode."
        action={
          <Button asChild variant="outline">
            <Link href={`/groups/${group.id}/sessions`}>See sessions</Link>
          </Button>
        }
      />
    );
  }

  const filtering = Boolean(deferred) || openOnly;

  return (
    <div className="stagger">
      <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-lg font-bold tracking-tight">Session notes</h2>
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {filtering
              ? `${plural(results.length, "note")} of ${ended.length}`
              : `${plural(ended.length, "session")}, written up by your scribes`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2" role="search">
          <div className="relative min-w-0 basis-full sm:basis-auto sm:flex-1 md:w-72 md:flex-none">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-subtle-foreground" aria-hidden />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search notes"
              aria-label="Search notes"
              className="pl-10 [&::-webkit-search-cancel-button]:hidden"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="pressable absolute right-1 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-[10px] text-muted-foreground hover:bg-surface-2 hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
          <button
            type="button"
            aria-pressed={openOnly}
            onClick={() => setOpenOnly((v) => !v)}
            className={cn(
              "pressable inline-flex h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-semibold",
              openOnly
                ? "border-foreground bg-foreground text-background"
                : "border-border-strong bg-surface text-foreground hover:border-foreground/40",
            )}
          >
            <CircleHelp className="size-4" strokeWidth={2.2} />
            Has open questions
            <span
              className={cn(
                "grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-xs font-bold",
                openOnly ? "bg-background/20" : "bg-surface-2 text-muted-foreground",
              )}
            >
              {withOpen}
            </span>
          </button>
        </div>
      </div>

      {results.length === 0 ? (
        <EmptyState
          className="mt-6"
          icon={<Search />}
          title={deferred ? `Nothing matches “${deferred}”` : "No open questions"}
          description={
            deferred
              ? "Try a topic, a name, or a word from the summary."
              : "Every question from your sessions has been answered. Nice work, all of you."
          }
          action={
            <Button
              variant="outline"
              onClick={() => {
                setQuery("");
                setOpenOnly(false);
              }}
            >
              Show all notes
            </Button>
          }
        />
      ) : (
        <div>
          {results.map((s) => (
            <NoteEntry key={s.id} session={s} scribe={users[scribeOf(s) ?? ""]} meId={me.id} query={deferred} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- One archive entry ---------- */

function SectionHeading({ icon: Icon, children }: { icon: typeof ListChecks; children: React.ReactNode }) {
  return (
    <h4 className="mb-2.5 flex items-center gap-2 text-sm font-bold">
      <Icon className="size-4 text-muted-foreground" strokeWidth={2.2} aria-hidden />
      {children}
    </h4>
  );
}

function NoteEntry({
  session,
  scribe,
  meId,
  query,
}: {
  session: Session;
  scribe?: User;
  meId: string;
  query: string;
}) {
  const d = new Date(session.startsAt);
  const { summary, openQuestions, actionItems, updatedAt } = session.notes;
  const questions = questionsOf(openQuestions);
  const actions = lines(actionItems).map(actionOf);
  const empty = !summary.trim() && questions.length === 0 && actions.length === 0;
  const href = `/sessions/${session.id}`;
  const titleId = `note-${session.id}`;

  return (
    <article
      aria-labelledby={titleId}
      className="grid gap-x-12 gap-y-3 border-t border-border py-8 first:border-t-0 lg:grid-cols-[8.5rem_minmax(0,1fr)] lg:py-10"
    >
      {/* Date column: sticky beside the note on desktop, one line above it on phones */}
      <div className="lg:sticky lg:top-20 lg:self-start">
        <time dateTime={session.startsAt} className="hidden lg:block">
          <span className="block text-[2.75rem] font-bold leading-none tracking-[-0.04em] tabular-nums">{format(d, "d")}</span>
          <span className="mt-2 block text-[0.9375rem] font-bold">{format(d, "EEEE")}</span>
          <span className="block text-sm text-muted-foreground">{format(d, "MMMM yyyy")}</span>
          <span className="mt-1 block text-xs font-medium text-subtle-foreground">{formatRelative(session.startsAt)}</span>
        </time>
        <time dateTime={session.startsAt} className="text-sm font-semibold text-muted-foreground lg:hidden">
          {format(d, "EEEE d MMMM")}
          <span className="font-medium text-subtle-foreground"> · {formatRelative(session.startsAt)}</span>
        </time>
      </div>

      <div className="min-w-0 max-w-[68ch]">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <TemplateBadge template={session.template} />
          <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            {scribe ? (
              <>
                <Avatar user={scribe} size="xs" />
                <span>
                  Notes by{" "}
                  <span className="font-semibold text-foreground">
                    {scribe.id === meId ? "you" : <Highlight text={firstName(scribe.name)} query={query} />}
                  </span>
                </span>
              </>
            ) : (
              "No scribe this time"
            )}
          </span>
        </div>

        <h3 id={titleId} className="mt-2 text-h2">
          <Link
            href={href}
            className="rounded-md decoration-border-strong decoration-2 underline-offset-[6px] hover:underline"
          >
            <Highlight text={session.title} query={query} />
          </Link>
        </h3>

        {empty ? (
          <p className="mt-4 text-[0.9375rem] text-muted-foreground">No notes were taken for this one.</p>
        ) : (
          <div className="mt-5 space-y-7">
            {summary.trim() && (
              <section>
                <SectionHeading icon={TextQuote}>Summary</SectionHeading>
                <p className="whitespace-pre-line text-[1.0625rem] leading-7">
                  <Highlight text={summary.trim()} query={query} />
                </p>
              </section>
            )}

            {questions.length > 0 && (
              <section>
                <SectionHeading icon={CircleHelp}>Open questions</SectionHeading>
                <ul className="space-y-2">
                  {questions.map((q, i) => (
                    <li key={i} className="flex gap-3 border-l-[2.5px] border-teal pl-3.5 text-[0.9375rem] leading-6">
                      <Highlight text={q} query={query} />
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {actions.length > 0 && (
              <section>
                <SectionHeading icon={ListChecks}>Action items</SectionHeading>
                <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
                  {actions.map((a, i) => (
                    <li key={i} className="flex items-start gap-3 px-4 py-3 text-[0.9375rem] leading-6">
                      <span
                        aria-hidden
                        className="mt-[3px] size-[18px] shrink-0 rounded-[6px] border-[1.5px] border-border-strong bg-background"
                      />
                      <span className="min-w-0">
                        {a.who && (
                          <span className="font-bold">
                            <Highlight text={a.who} query={query} />
                            :{" "}
                          </span>
                        )}
                        <Highlight text={a.task} query={query} />
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
          <Link
            href={href}
            className="inline-flex h-11 items-center rounded-md font-semibold text-foreground underline decoration-border-strong decoration-2 underline-offset-4 hover:decoration-foreground"
          >
            Open the session
          </Link>
          {updatedAt && (
            <span className="text-subtle-foreground">
              Last edited {formatDay(updatedAt)}, {formatTime(updatedAt)}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
