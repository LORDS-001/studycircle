"use client";

import * as React from "react";
import { Check, LoaderCircle } from "lucide-react";
import { Textarea } from "@/components/ui/field";
import { useStore } from "@/lib/store";
import type { Session, User } from "@/lib/types";
import { cn, firstName, formatRelative } from "@/lib/utils";

type NoteKey = "summary" | "openQuestions" | "actionItems";

const SECTIONS: { key: NoteKey; label: string; hint: string; placeholder: string; rows: number }[] = [
  {
    key: "summary",
    label: "Summary",
    hint: "What did we cover?",
    placeholder: "Covered BFS and DFS. Everyone could explain when to use a queue vs a stack.",
    rows: 4,
  },
  {
    key: "openQuestions",
    label: "Open questions",
    hint: "What's still unclear?",
    placeholder: "Why does DFS find cycles but BFS doesn't?",
    rows: 3,
  },
  {
    key: "actionItems",
    label: "Action items",
    hint: "Who follows up on what?",
    placeholder: "Tunde: add 3 graph questions to the bank",
    rows: 3,
  },
];

type SaveState = "idle" | "saving" | "saved";

/**
 * The shared session note. Anyone in the group can edit; changes save
 * shortly after you stop typing, and straight away when you leave a field.
 */
export function SessionNotes({
  session,
  scribe,
  className,
}: {
  session: Session;
  scribe?: User;
  className?: string;
}) {
  const updateNotes = useStore((s) => s.updateNotes);
  const [draft, setDraft] = React.useState(() => ({
    summary: session.notes.summary,
    openQuestions: session.notes.openQuestions,
    actionItems: session.notes.actionItems,
  }));
  const [state, setState] = React.useState<SaveState>("idle");
  const draftRef = React.useRef(draft);
  const timer = React.useRef<number | undefined>(undefined);
  const idPrefix = React.useId();

  const commit = React.useCallback(() => {
    window.clearTimeout(timer.current);
    timer.current = undefined;
    const d = draftRef.current;
    const saved = useStore.getState().sessions.find((s) => s.id === session.id)?.notes;
    if (saved && saved.summary === d.summary && saved.openQuestions === d.openQuestions && saved.actionItems === d.actionItems) {
      setState((st) => (st === "saving" ? "saved" : st));
      return;
    }
    updateNotes(session.id, d);
    setState("saved");
  }, [session.id, updateNotes]);

  // Flush pending edits if the page unmounts mid-debounce
  React.useEffect(() => () => {
    if (timer.current !== undefined) commit();
  }, [commit]);

  const onChange = (key: NoteKey, value: string) => {
    const next = { ...draftRef.current, [key]: value };
    draftRef.current = next;
    setDraft(next);
    setState("saving");
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(commit, 900);
  };

  return (
    <section aria-labelledby={`${idPrefix}-title`} className={className}>
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <div className="min-w-0">
          <h2 id={`${idPrefix}-title`} className="text-lg font-bold tracking-tight">
            Session notes
          </h2>
          <p className="text-sm text-muted-foreground">
            {scribe
              ? `Anyone can add to these. The scribe, ${firstName(scribe.name)}, is responsible for notes.`
              : "Anyone in the group can add to these."}
          </p>
        </div>
        <SaveIndicator state={state} updatedAt={session.notes.updatedAt} />
      </div>

      <div className="divide-y divide-border overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface">
        {SECTIONS.map(({ key, label, hint, placeholder, rows }) => {
          const id = `${idPrefix}-${key}`;
          return (
            <div key={key} className="p-4 transition-shadow duration-150 focus-within:shadow-[inset_3px_0_0_var(--ring)] sm:p-5">
              <label htmlFor={id} className="flex flex-wrap items-baseline gap-x-2">
                <span className="text-[0.9375rem] font-bold">{label}</span>
                <span className="text-sm text-subtle-foreground">{hint}</span>
              </label>
              <Textarea
                id={id}
                rows={rows}
                value={draft[key]}
                placeholder={placeholder}
                onChange={(e) => onChange(key, e.target.value)}
                onBlur={() => {
                  if (timer.current !== undefined) commit();
                }}
                className="mt-2 min-h-0 border-transparent bg-transparent px-0 shadow-none hover:border-transparent focus-visible:border-transparent focus-visible:ring-0 focus-visible:outline-none"
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}

function SaveIndicator({ state, updatedAt }: { state: SaveState; updatedAt?: string }) {
  return (
    <p
      aria-live="polite"
      className={cn(
        "inline-flex h-6 items-center gap-1.5 text-sm font-medium text-subtle-foreground transition-opacity duration-200",
        state === "idle" && !updatedAt && "opacity-0",
      )}
    >
      {state === "saving" ? (
        <>
          <LoaderCircle className="size-3.5 animate-spin motion-reduce:animate-none" aria-hidden />
          Saving
        </>
      ) : state === "saved" ? (
        <>
          <Check className="size-3.5" strokeWidth={2.6} aria-hidden />
          Saved
        </>
      ) : updatedAt ? (
        `Edited ${formatRelative(updatedAt)}`
      ) : null}
    </p>
  );
}
