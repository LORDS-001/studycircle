"use client";

import * as React from "react";
import { AvatarStack } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/controls";
import { useStore } from "@/lib/store";
import type { Session, User } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Prep checklist: tick your own items, see how many others have done each. */
export function PrepChecklist({
  session,
  members,
  meId,
  className,
}: {
  session: Session;
  members: User[];
  meId: string;
  className?: string;
}) {
  const togglePrep = useStore((s) => s.togglePrep);
  const id = React.useId();
  const memberIds = new Set(members.map((u) => u.id));
  const mineDone = session.prep.filter((p) => p.doneBy.includes(meId)).length;

  return (
    <section aria-labelledby={id} className={className}>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 id={id} className="text-lg font-bold tracking-tight">
          Before the session
        </h2>
        <span className="text-sm font-medium text-muted-foreground">
          {mineDone === session.prep.length ? "You're all set" : `${mineDone} of ${session.prep.length} done`}
        </span>
      </div>
      <ul className="divide-y divide-border rounded-[var(--radius-card)] border border-border bg-surface">
        {session.prep.map((p) => {
          const done = p.doneBy.includes(meId);
          const doneBy = members.filter((u) => p.doneBy.includes(u.id));
          const count = p.doneBy.filter((u) => memberIds.has(u)).length;
          const cid = `${id}-${p.id}`;
          return (
            <li key={p.id} className="flex min-h-14 items-center gap-3 px-4 py-2.5">
              <Checkbox id={cid} checked={done} onCheckedChange={() => togglePrep(session.id, p.id)} />
              <label
                htmlFor={cid}
                className={cn(
                  "min-w-0 flex-1 py-1 text-[0.9375rem] font-medium transition-colors",
                  done && "text-muted-foreground line-through decoration-1",
                )}
              >
                {p.text}
              </label>
              <div className="flex shrink-0 items-center gap-2">
                {doneBy.length > 0 && <AvatarStack users={doneBy} size="xs" max={3} className="hidden sm:flex" />}
                <span className="text-sm tabular-nums text-muted-foreground" aria-label={`${count} of ${members.length} members done`}>
                  {count}/{members.length}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
