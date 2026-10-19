"use client";

import * as React from "react";
import Link from "next/link";
import { BellRing, CalendarPlus, Check, CopyPlus, Eraser, Paintbrush, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { AvailabilityGrid, HeatLegend } from "@/components/app/availability-grid";
import {
  blocksOf,
  buildHeatmap,
  durationLabel,
  rangeLabel,
  sameSet,
  slotKey,
  suggestTimes,
  type Heatmap,
  type Suggestion,
} from "@/components/app/availability-logic";
import { Avatar, AvatarStack } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/controls";
import { Kbd, Panel } from "@/components/ui/surface";
import { useCurrentGroup } from "@/lib/group-context";
import { activeMembers, useMe, useUserMap } from "@/lib/queries";
import { useStore } from "@/lib/store";
import type { User } from "@/lib/types";
import { cn, firstName, SLOT_COUNT, WEEKDAYS, WEEKDAYS_LONG } from "@/lib/utils";

type View = "mine" | "group";

export default function AvailabilityPage() {
  const group = useCurrentGroup();
  const me = useMe();
  const users = useUserMap();
  const availability = useStore((s) => s.availability);
  const saveAvailability = useStore((s) => s.saveAvailability);

  const mine = React.useMemo(
    () => availability.find((a) => a.groupId === group.id && a.userId === me.id),
    [availability, group.id, me.id],
  );
  const saved = React.useMemo(() => new Set(mine?.slots ?? []), [mine]);
  const [draft, setDraft] = React.useState<Set<string> | null>(null);
  const value = draft ?? saved;
  const dirty = draft !== null && !sameSet(draft, saved);
  const [view, setView] = React.useState<View>(() => (mine ? "group" : "mine"));

  const members = React.useMemo(
    () => activeMembers(group).map((m) => users[m.userId]).filter((u): u is User => Boolean(u)),
    [group, users],
  );
  const heat = React.useMemo(
    () => buildHeatmap(members.map((m) => m.id), availability, group.id),
    [members, availability, group.id],
  );
  const suggestions = React.useMemo(() => suggestTimes(heat), [heat]);

  // Warn before leaving the page with unsaved paint
  React.useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const save = () => {
    const slots = Array.from(value).sort((a, b) => {
      const [da, sa] = a.split(":").map(Number);
      const [db, sb] = b.split(":").map(Number);
      return da - db || sa - sb;
    });
    saveAvailability(group.id, slots);
    setDraft(null);
    toast.success("Availability saved. The heatmap is updated.", {
      action: view === "mine" ? { label: "See heatmap", onClick: () => setView("group") } : undefined,
    });
  };

  return (
    <div className="stagger space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-h2">{view === "mine" ? "When are you free?" : "When the group is free"}</h2>
          <p className="mt-1 max-w-xl text-[0.9375rem] leading-6 text-muted-foreground">
            {view === "mine"
              ? "Paint the times you can usually study each week. Your group sees everyone's free time together."
              : "Darker teal means more of you are free. The outlined blocks are the best fits."}
          </p>
        </div>
        <Segmented<View>
          aria-label="Availability view"
          value={view}
          onValueChange={setView}
          className="w-full shrink-0 sm:w-auto"
          options={[
            { value: "mine", label: "Your week", icon: <Paintbrush /> },
            { value: "group", label: "Group heatmap", icon: <UsersRound /> },
          ]}
        />
      </div>

      {view === "mine" ? (
        <YourWeek
          value={value}
          onChange={setDraft}
          dirty={dirty}
          onSave={save}
          onDiscard={() => setDraft(null)}
          hasSaved={Boolean(mine)}
        />
      ) : (
        <GroupHeatmap
          groupId={group.id}
          meId={me.id}
          members={members}
          heat={heat}
          suggestions={suggestions}
          dirty={dirty}
          onEditMine={() => setView("mine")}
        />
      )}
    </div>
  );
}

/* ---------------------------------- Your week ---------------------------------- */

function YourWeek({
  value,
  onChange,
  dirty,
  onSave,
  onDiscard,
  hasSaved,
}: {
  value: Set<string>;
  onChange: (next: Set<string>) => void;
  dirty: boolean;
  onSave: () => void;
  onDiscard: () => void;
  hasSaved: boolean;
}) {
  const blocks = React.useMemo(() => blocksOf(value), [value]);
  const mondaySlots = React.useMemo(
    () => Array.from({ length: SLOT_COUNT }, (_, s) => s).filter((s) => value.has(slotKey(0, s))),
    [value],
  );

  const withUndo = (next: Set<string>, message: string) => {
    const prev = value;
    onChange(next);
    toast(message, { action: { label: "Undo", onClick: () => onChange(prev) } });
  };

  const copyMonday = () => {
    const next = new Set(Array.from(value).filter((k) => {
      const d = Number(k.split(":")[0]);
      return d === 0 || d > 4;
    }));
    for (let d = 1; d <= 4; d++) for (const s of mondaySlots) next.add(slotKey(d, s));
    withUndo(next, "Copied Monday to Tuesday through Friday");
  };

  const clearAll = () => withUndo(new Set(), "Cleared your week");

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_17.5rem] lg:items-start">
      <div className="min-w-0">
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p id="paint-hint" className="text-sm text-muted-foreground">
            Drag to paint. Start on a teal block to erase.
            <span className="sm:hidden"> Scroll with the time column.</span>
          </p>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-11 flex-1 sm:h-9 sm:flex-none"
              onClick={copyMonday}
              disabled={mondaySlots.length === 0}
            >
              <CopyPlus /> Copy Monday to weekdays
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-11 sm:h-9"
              onClick={clearAll}
              disabled={value.size === 0}
            >
              <Eraser /> Clear all
            </Button>
          </div>
        </div>

        <AvailabilityGrid mode="paint" value={value} onChange={onChange} aria-describedby="paint-hint" />

        {dirty && (
          <div className="sticky bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-20 mt-4 lg:bottom-6">
            <div
              role="region"
              aria-label="Unsaved changes"
              className="flex animate-[rise_220ms_var(--ease-out)_both] items-center gap-2 rounded-2xl border border-border bg-surface/95 p-2 pl-4 shadow-float backdrop-blur-md sm:ml-auto sm:w-fit sm:gap-3"
            >
              <span className="size-2 shrink-0 rounded-full bg-teal" aria-hidden />
              <p className="min-w-0 flex-1 truncate text-sm font-semibold">Unsaved changes</p>
              <Button variant="ghost" size="sm" className="h-11 sm:h-10" onClick={onDiscard}>
                Discard
              </Button>
              <Button size="sm" className="h-11 sm:h-10" onClick={onSave}>
                <span className="sm:hidden">Save</span>
                <span className="hidden sm:inline">Save availability</span>
              </Button>
            </div>
          </div>
        )}
      </div>

      <aside className="space-y-4 lg:sticky lg:top-[73px]">
        <Panel className="p-5">
          <h3 className="text-h3">Your free time</h3>
          {value.size ? (
            <>
              <p className="mt-0.5 text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{durationLabel(value.size)}</span> a week, in{" "}
                {blocks.length === 1 ? "1 block" : `${blocks.length} blocks`}
              </p>
              <dl className="mt-4 space-y-2.5">
                {Array.from(new Set(blocks.map((b) => b.day))).map((day) => (
                  <div key={day} className="flex gap-3 text-sm">
                    <dt className="w-9 shrink-0 font-bold">
                      <abbr title={WEEKDAYS_LONG[day]} className="no-underline">
                        {WEEKDAYS[day]}
                      </abbr>
                    </dt>
                    <dd className="min-w-0 space-y-0.5 text-muted-foreground">
                      {blocks
                        .filter((b) => b.day === day)
                        .map((b) => (
                          <span key={b.start} className="block">
                            {rangeLabel(b.start, b.end)}
                          </span>
                        ))}
                    </dd>
                  </div>
                ))}
              </dl>
            </>
          ) : (
            <p className="mt-1 text-sm leading-5 text-muted-foreground">
              {hasSaved
                ? "Nothing painted. Save to let the group know you're busy this week."
                : "Nothing yet. Drag down a day to add your first block. Rough is fine, you can change it any time."}
            </p>
          )}
        </Panel>

        <div className="hidden rounded-[var(--radius-card)] border border-dashed border-border-strong p-4 text-sm text-muted-foreground lg:block">
          <p className="font-semibold text-foreground">Keyboard</p>
          <ul className="mt-2 space-y-1.5">
            <li className="flex items-center gap-2">
              <span className="flex gap-1">
                <Kbd>←</Kbd>
                <Kbd>↑</Kbd>
                <Kbd>↓</Kbd>
                <Kbd>→</Kbd>
              </span>
              Move
            </li>
            <li className="flex items-center gap-2">
              <Kbd>Space</Kbd> Toggle a slot
            </li>
            <li className="flex items-center gap-2">
              <Kbd>Shift</Kbd>+ arrows to paint
            </li>
          </ul>
        </div>
      </aside>
    </div>
  );
}

/* -------------------------------- Group heatmap -------------------------------- */

function GroupHeatmap({
  groupId,
  meId,
  members,
  heat,
  suggestions,
  dirty,
  onEditMine,
}: {
  groupId: string;
  meId: string;
  members: User[];
  heat: Heatmap;
  suggestions: Suggestion[];
  dirty: boolean;
  onEditMine: () => void;
}) {
  const [nudged, setNudged] = React.useState<Set<string>>(() => new Set());
  const missing = members.filter((m) => heat.missing.includes(m.id));
  const meMissing = missing.some((m) => m.id === meId);
  const others = missing.filter((m) => m.id !== meId);

  const nudge = (u: User) => {
    setNudged((s) => new Set(s).add(u.id));
    toast.success(`Nudge sent to ${firstName(u.name)}`, {
      description: "We'll remind them to add their free times.",
    });
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
      <aside className="space-y-4 lg:sticky lg:top-[73px] lg:col-start-2 lg:row-start-1">
        <Panel>
          <div className="px-5 pb-1 pt-5">
            <h3 className="text-h3">Best times to meet</h3>
            <p className="mt-0.5 text-sm text-muted-foreground">
              From {heat.responded.length} of {members.length} members&rsquo; availability
            </p>
          </div>
          {suggestions.length ? (
            <ol className="divide-y divide-border">
              {suggestions.map((s) => (
                <SuggestionRow key={`${s.day}:${s.start}`} s={s} total={members.length} members={members} groupId={groupId} />
              ))}
            </ol>
          ) : (
            <p className="px-5 pb-5 pt-2 text-sm leading-5 text-muted-foreground">
              No overlap yet. Once two or more people add their free times, the best slots show up here.
            </p>
          )}
        </Panel>

        {(meMissing || others.length > 0) && (
          <Panel className="space-y-3 p-4">
            {meMissing && (
              <div className="flex items-center gap-3">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-teal-soft text-teal-text">
                  <Paintbrush className="size-4" />
                </span>
                <p className="min-w-0 flex-1 text-sm font-medium">You haven&rsquo;t added yours yet.</p>
                <Button size="sm" variant="outline" className="h-11 sm:h-9" onClick={onEditMine}>
                  Add yours
                </Button>
              </div>
            )}
            {others.map((u) => {
              const done = nudged.has(u.id);
              return (
                <div key={u.id} className="flex items-center gap-3">
                  <Avatar user={u} size="sm" />
                  <p className="min-w-0 flex-1 text-sm leading-5">
                    <span className="font-semibold">{firstName(u.name)}</span> hasn&rsquo;t added availability yet.
                  </p>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-11 sm:h-9"
                    onClick={() => nudge(u)}
                    disabled={done}
                    aria-label={done ? `Nudged ${firstName(u.name)}` : `Send ${firstName(u.name)} a nudge`}
                  >
                    {done ? <Check /> : <BellRing />}
                    {done ? "Nudged" : "Nudge"}
                  </Button>
                </div>
              );
            })}
          </Panel>
        )}
      </aside>

      <div className="min-w-0 lg:col-start-1 lg:row-start-1">
        {dirty && (
          <div className="mb-3 flex items-center gap-3 rounded-2xl bg-surface-2 py-2 pl-4 pr-2 text-sm">
            <p className="min-w-0 flex-1">You have unsaved changes. This shows your saved times.</p>
            <Button variant="ghost" size="sm" className="h-11 sm:h-9" onClick={onEditMine}>
              Review
            </Button>
          </div>
        )}
        <div className="mb-3 flex flex-wrap items-center justify-between gap-x-5 gap-y-2">
          <HeatLegend total={members.length} />
          <span className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <span aria-hidden className="relative h-3.5 w-5 rounded-[4px] border-2 border-foreground">
              <span className="absolute -left-1.5 -top-1.5 grid size-3 place-items-center rounded-full bg-foreground text-[8px] font-bold leading-none text-background">
                1
              </span>
            </span>
            Suggested times
          </span>
        </div>
        <AvailabilityGrid mode="heat" heat={heat} members={members} suggestions={suggestions} />
        <p className="mt-3 text-xs text-muted-foreground">Hover or focus a slot to see who&rsquo;s free.</p>
      </div>
    </div>
  );
}

function SuggestionRow({
  s,
  total,
  members,
  groupId,
}: {
  s: Suggestion;
  total: number;
  members: User[];
  groupId: string;
}) {
  const people = members.filter((m) => s.people.includes(m.id));
  const all = people.length === total;
  return (
    <li className="px-5 py-4">
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className={cn(
            "grid size-7 shrink-0 place-items-center rounded-full text-sm font-bold",
            s.rank === 1 ? "bg-foreground text-background" : "border-2 border-foreground text-foreground",
          )}
        >
          {s.rank}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-bold leading-6">
            <span className="sr-only">Option {s.rank}: </span>
            {WEEKDAYS_LONG[s.day]}, {rangeLabel(s.start, s.end)}
          </p>
          <p className="text-sm text-muted-foreground">
            <span className={cn(all && "font-semibold text-teal-text")}>
              {all ? `All ${total} free` : `${people.length} of ${total} free`}
            </span>
            {" · "}
            {durationLabel(s.end - s.start)}
          </p>
          <div className="mt-2.5 flex items-center justify-between gap-3">
            <AvatarStack users={people} size="xs" max={5} className="min-w-0" />
            <Button
              asChild
              variant={s.rank === 1 ? "primary" : "outline"}
              size="sm"
              className="h-11 sm:h-9"
            >
              <Link
                href={`/groups/${groupId}/sessions/new?day=${s.day}&slot=${s.start}`}
                aria-label={`Schedule a session ${WEEKDAYS_LONG[s.day]}, ${rangeLabel(s.start, s.end)}`}
              >
                <CalendarPlus /> Schedule this
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </li>
  );
}
