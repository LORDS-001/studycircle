"use client";

import * as React from "react";
import { Avatar } from "@/components/ui/avatar";
import type { ID, User } from "@/lib/types";
import { cn, firstName, SLOT_COUNT, WEEKDAYS, WEEKDAYS_LONG } from "@/lib/utils";
import { DAY_COUNT, hourLabel, rectKeys, slotKey, slotTime, type Heatmap, type Suggestion } from "./availability-logic";

/*
 * Weekly availability grid. Mon–Sun columns, 30-minute rows from 07:00 to 23:00.
 *
 * Paint mode: press a cell and drag to paint a rectangle. The first cell decides
 * whether you are adding or erasing. Arrow keys move, Space/Enter toggles,
 * Shift+Arrow paints as you move.
 *
 * Heat mode: read-only. Cell strength = members free; hover or focus a cell to see who.
 */

type PaintProps = {
  mode: "paint";
  value: Set<string>;
  onChange: (next: Set<string>) => void;
};

type HeatProps = {
  mode: "heat";
  heat: Heatmap;
  members: User[];
  suggestions: Suggestion[];
};

type Pos = { day: number; slot: number };

const ROWS = Array.from({ length: SLOT_COUNT }, (_, i) => i);
const DAYS = Array.from({ length: DAY_COUNT }, (_, i) => i);
const COLS = "grid-cols-[2.75rem_repeat(7,minmax(0,1fr))] sm:grid-cols-[3.5rem_repeat(7,minmax(0,1fr))]";

/** Heat strength: a visible floor for 1 person, full teal when everyone is free */
function heatPct(count: number, total: number) {
  return total && count ? Math.round(20 + (80 * count) / total) : 0;
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

function cellFrom(el: Element | null, root: HTMLElement | null): Pos | null {
  const cell = el?.closest<HTMLElement>("[data-cell]");
  if (!cell || !root?.contains(cell)) return null;
  return { day: Number(cell.dataset.day), slot: Number(cell.dataset.slot) };
}

export function AvailabilityGrid(props: (PaintProps | HeatProps) & { className?: string; "aria-describedby"?: string }) {
  const { className } = props;
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const gridRef = React.useRef<HTMLDivElement>(null);
  const [focus, setFocus] = React.useState<Pos>({ day: 0, slot: 22 });
  const drag = React.useRef<{ anchor: Pos; last: string; add: boolean; base: Set<string> } | null>(null);
  const mouseDown = React.useRef(false);

  // Heat tooltip: the mouse-hovered cell wins; otherwise the keyboard/touch-focused one.
  const [hover, setHover] = React.useState<string | null>(null);
  const [focused, setFocused] = React.useState<string | null>(null);
  const [tipPos, setTipPos] = React.useState<{ left: number; top: number; below: boolean } | null>(null);

  const isPaint = props.mode === "paint";

  const focusCell = (p: Pos) => {
    setFocus(p);
    gridRef.current
      ?.querySelector<HTMLElement>(`[data-day="${p.day}"][data-slot="${p.slot}"]`)
      ?.focus({ preventScroll: false });
  };

  const placeTip = (p: Pos) => {
    const wrap = wrapRef.current;
    const cell = gridRef.current?.querySelector<HTMLElement>(`[data-day="${p.day}"][data-slot="${p.slot}"]`);
    if (!wrap || !cell) return;
    const w = wrap.getBoundingClientRect();
    const c = cell.getBoundingClientRect();
    const width = Math.min(240, w.width - 8);
    const left = clamp(c.left + c.width / 2 - w.left - width / 2, 4, w.width - width - 4);
    const below = c.top - w.top < 150;
    setTipPos({ left, top: below ? c.bottom - w.top + 6 : c.top - w.top - 6, below });
  };

  /* ---------- painting ---------- */

  const paintRect = (a: Pos, b: Pos) => {
    if (props.mode !== "paint" || !drag.current) return;
    const next = new Set(drag.current.base);
    for (const k of rectKeys(a, b)) {
      if (drag.current.add) next.add(k);
      else next.delete(k);
    }
    props.onChange(next);
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse") mouseDown.current = true;
    const p = cellFrom(e.target as Element, gridRef.current);
    if (!p) return;
    if (props.mode === "heat") {
      // Touch has no hover: a tap pins the details for that slot
      if (e.pointerType === "touch") {
        setFocused(slotKey(p.day, p.slot));
        placeTip(p);
      }
      return;
    }
    if (e.button !== 0) return;
    e.preventDefault();
    const key = slotKey(p.day, p.slot);
    drag.current = { anchor: p, last: key, add: !props.value.has(key), base: new Set(props.value) };
    e.currentTarget.setPointerCapture(e.pointerId);
    setFocus(p);
    gridRef.current
      ?.querySelector<HTMLElement>(`[data-day="${p.day}"][data-slot="${p.slot}"]`)
      ?.focus({ preventScroll: true });
    paintRect(p, p);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    const p = cellFrom(document.elementFromPoint(e.clientX, e.clientY), gridRef.current);
    if (!p) return;
    const key = slotKey(p.day, p.slot);
    if (key === drag.current.last) return;
    drag.current.last = key;
    paintRect(drag.current.anchor, p);
  };

  const endDrag = () => {
    drag.current = null;
    mouseDown.current = false;
  };

  /* ---------- keyboard ---------- */

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const p = cellFrom(e.target as Element, gridRef.current);
    if (!p) return;
    let next: Pos | null = null;
    switch (e.key) {
      case "ArrowUp":
        next = { ...p, slot: clamp(p.slot - 1, 0, SLOT_COUNT - 1) };
        break;
      case "ArrowDown":
        next = { ...p, slot: clamp(p.slot + 1, 0, SLOT_COUNT - 1) };
        break;
      case "ArrowLeft":
        next = { ...p, day: clamp(p.day - 1, 0, DAY_COUNT - 1) };
        break;
      case "ArrowRight":
        next = { ...p, day: clamp(p.day + 1, 0, DAY_COUNT - 1) };
        break;
      case "Home":
        next = e.ctrlKey ? { day: 0, slot: 0 } : { ...p, day: 0 };
        break;
      case "End":
        next = e.ctrlKey ? { day: DAY_COUNT - 1, slot: SLOT_COUNT - 1 } : { ...p, day: DAY_COUNT - 1 };
        break;
      case "PageUp":
        next = { ...p, slot: clamp(p.slot - 4, 0, SLOT_COUNT - 1) };
        break;
      case "PageDown":
        next = { ...p, slot: clamp(p.slot + 4, 0, SLOT_COUNT - 1) };
        break;
      case " ":
      case "Enter":
        if (props.mode === "paint") {
          e.preventDefault();
          if (e.repeat) return;
          const key = slotKey(p.day, p.slot);
          const out = new Set(props.value);
          if (out.has(key)) out.delete(key);
          else out.add(key);
          props.onChange(out);
        }
        return;
      default:
        return;
    }
    e.preventDefault();
    if (props.mode === "paint" && e.shiftKey && (next.day !== p.day || next.slot !== p.slot)) {
      // Shift+Arrow carries the current cell's state to the next one
      const on = props.value.has(slotKey(p.day, p.slot));
      const out = new Set(props.value);
      if (on) out.add(slotKey(next.day, next.slot));
      else out.delete(slotKey(next.day, next.slot));
      props.onChange(out);
    }
    focusCell(next);
  };

  /* ---------- heat tooltip events ---------- */

  const onPointerOver = (e: React.PointerEvent<HTMLDivElement>) => {
    if (props.mode !== "heat" || e.pointerType === "touch") return;
    const p = cellFrom(e.target as Element, gridRef.current);
    if (!p) return;
    const key = slotKey(p.day, p.slot);
    if (key !== hover) {
      setHover(key);
      placeTip(p);
    }
  };

  const onPointerLeave = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "touch") return;
    setHover(null);
    if (focused) {
      const [d, s] = focused.split(":").map(Number);
      placeTip({ day: d, slot: s });
    }
  };

  const onFocus = (e: React.FocusEvent<HTMLDivElement>) => {
    const p = cellFrom(e.target as Element, gridRef.current);
    if (!p) return;
    setFocus(p);
    if (props.mode !== "heat" || mouseDown.current) return;
    setFocused(slotKey(p.day, p.slot));
    if (!hover) placeTip(p);
  };

  const onBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    if (!gridRef.current?.contains(e.relatedTarget as Node)) setFocused(null);
  };

  /* ---------- render ---------- */

  const tipKey = props.mode === "heat" ? (hover ?? focused) : null;

  const suggestionAt = new Map<string, { s: Suggestion; first: boolean; last: boolean }>();
  if (props.mode === "heat") {
    for (const s of props.suggestions) {
      for (let slot = s.start; slot < s.end; slot++) {
        suggestionAt.set(slotKey(s.day, slot), { s, first: slot === s.start, last: slot === s.end - 1 });
      }
    }
  }

  const total = props.mode === "heat" ? props.members.length : 0;
  const nameOf = (id: ID) => (props.mode === "heat" ? props.members.find((m) => m.id === id)?.name : undefined) ?? "Member";

  return (
    <div ref={wrapRef} className={cn("relative", className)}>
      <div className="overflow-clip rounded-[var(--radius-card)] border border-border bg-surface">
        <div
          ref={gridRef}
          role="grid"
          aria-label={isPaint ? "Your weekly availability" : "Group availability heatmap"}
          aria-describedby={props["aria-describedby"]}
          aria-multiselectable={isPaint || undefined}
          aria-readonly={!isPaint || undefined}
          aria-rowcount={SLOT_COUNT + 1}
          className="select-none"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onLostPointerCapture={endDrag}
          onPointerOver={onPointerOver}
          onPointerLeave={onPointerLeave}
          onKeyDown={onKeyDown}
          onFocus={onFocus}
          onBlur={onBlur}
        >
          {/* Day headers stick under the group tab bar */}
          <div
            role="row"
            className={cn(
              "sticky top-[105px] z-10 grid border-b border-border bg-surface/95 backdrop-blur-md lg:top-[49px]",
              COLS,
            )}
          >
            <div role="columnheader" aria-label="Time" />
            {DAYS.map((d) => (
              <div
                key={d}
                role="columnheader"
                aria-label={WEEKDAYS_LONG[d]}
                className="flex h-10 items-center justify-center border-l border-border text-[0.8125rem] font-bold"
              >
                <span aria-hidden>{WEEKDAYS[d]}</span>
              </div>
            ))}
          </div>

          {ROWS.map((slot) => {
            const hour = slot % 2 === 0;
            return (
              <div key={slot} role="row" className={cn("grid h-6 sm:h-[22px]", COLS)}>
                <div
                  role="rowheader"
                  className={cn(
                    "relative pr-2 text-right text-[11px] font-semibold leading-none text-subtle-foreground",
                    hour && slot > 0 && "border-t border-border",
                  )}
                >
                  {hour ? (
                    <span className="relative top-1">{hourLabel(slot)}</span>
                  ) : (
                    <span className="sr-only">{slotTime(slot)}</span>
                  )}
                </div>
                {DAYS.map((day) => {
                  const key = slotKey(day, slot);
                  const tabbable = focus.day === day && focus.slot === slot;
                  const lineClass = cn(
                    "relative scroll-mb-40 scroll-mt-40 border-l border-border outline-none lg:scroll-mb-24 lg:scroll-mt-24",
                    slot > 0 && (hour ? "border-t border-t-border" : "border-t border-t-border/45 border-dashed"),
                    "focus-visible:z-[3] focus-visible:after:absolute focus-visible:after:inset-0 focus-visible:after:rounded-[4px] focus-visible:after:shadow-[inset_0_0_0_2px_var(--ring)]",
                  );

                  if (props.mode === "paint") {
                    const on = props.value.has(key);
                    const up = on && props.value.has(slotKey(day, slot - 1));
                    const down = on && props.value.has(slotKey(day, slot + 1));
                    return (
                      <div
                        key={day}
                        role="gridcell"
                        data-cell=""
                        data-day={day}
                        data-slot={slot}
                        tabIndex={tabbable ? 0 : -1}
                        aria-selected={on}
                        aria-label={`${WEEKDAYS_LONG[day]} ${slotTime(slot)}, ${on ? "free" : "not free"}`}
                        className={cn(lineClass, "touch-none hover:bg-teal-soft/60")}
                      >
                        {on && (
                          <span
                            aria-hidden
                            className={cn(
                              "pointer-events-none absolute inset-x-[3px] bg-teal",
                              up ? "-top-px" : "top-[2px] rounded-t-[6px]",
                              down ? "bottom-0" : "bottom-[2px] rounded-b-[6px]",
                            )}
                          />
                        )}
                      </div>
                    );
                  }

                  const who = props.heat.free.get(key) ?? [];
                  const count = who.length;
                  const pct = heatPct(count, total);
                  const sug = suggestionAt.get(key);
                  const notFree = props.members.filter((m) => !who.includes(m.id) && props.heat.responded.includes(m.id));
                  const label = [
                    `${WEEKDAYS_LONG[day]} ${slotTime(slot)}, ${count} of ${total} free`,
                    count ? `Free: ${who.map((id) => firstName(nameOf(id))).join(", ")}` : "",
                    notFree.length ? `Not free: ${notFree.map((m) => firstName(m.name)).join(", ")}` : "",
                    sug?.first ? `Suggested time ${sug.s.rank}` : "",
                  ]
                    .filter(Boolean)
                    .join(". ");
                  return (
                    <div
                      key={day}
                      role="gridcell"
                      data-cell=""
                      data-day={day}
                      data-slot={slot}
                      tabIndex={tabbable ? 0 : -1}
                      aria-label={label}
                      className={cn(lineClass, count > 0 && "border-t-transparent")}
                      style={count ? { backgroundColor: `color-mix(in srgb, var(--teal-text) ${pct}%, transparent)` } : undefined}
                    >
                      {sug && (
                        <span
                          aria-hidden
                          className={cn(
                            "pointer-events-none absolute inset-x-0 z-[1] border-x-2 border-foreground",
                            sug.first ? "top-0 rounded-t-[6px] border-t-2" : "-top-px",
                            sug.last ? "bottom-0 rounded-b-[6px] border-b-2" : "bottom-0",
                          )}
                        />
                      )}
                      {sug?.first && (
                        <span
                          aria-hidden
                          className="pointer-events-none absolute left-1 top-1 z-[2] grid size-4 place-items-center rounded-full bg-foreground text-[10px] font-bold leading-none text-background"
                        >
                          {sug.s.rank}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {props.mode === "heat" && tipKey && tipPos && (
        <HeatTip tipKey={tipKey} pos={tipPos} heat={props.heat} members={props.members} />
      )}
    </div>
  );
}

function HeatTip({
  tipKey,
  pos,
  heat,
  members,
}: {
  tipKey: string;
  pos: { left: number; top: number; below: boolean };
  heat: Heatmap;
  members: User[];
}) {
  const [day, slot] = tipKey.split(":").map(Number);
  const who = heat.free.get(tipKey) ?? [];
  const free = members.filter((m) => who.includes(m.id));
  const busy = members.filter((m) => !who.includes(m.id) && heat.responded.includes(m.id));
  const missing = members.filter((m) => heat.missing.includes(m.id));
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute z-30 w-60 max-w-[calc(100%-8px)] animate-[fade-in_120ms_var(--ease-out)] rounded-xl bg-brand-blue px-3 py-2.5 text-white shadow-float dark:bg-brand-cream dark:text-brand-blue"
      style={{ left: pos.left, top: pos.top, transform: pos.below ? undefined : "translateY(-100%)" }}
    >
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[0.8125rem] font-bold">
          {WEEKDAYS_LONG[day]} {slotTime(slot)}
        </span>
        <span className="text-xs font-semibold opacity-80">
          {who.length} of {members.length} free
        </span>
      </div>
      {free.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-x-2.5 gap-y-1.5">
          {free.map((m) => (
            <span key={m.id} className="inline-flex items-center gap-1.5 text-xs font-semibold">
              <Avatar user={m} size="xs" className="size-5 text-[9px]" />
              {firstName(m.name)}
            </span>
          ))}
        </div>
      )}
      {busy.length > 0 && (
        <p className="mt-2 text-xs opacity-80">Not free: {busy.map((m) => firstName(m.name)).join(", ")}</p>
      )}
      {missing.length > 0 && (
        <p className="mt-1 text-xs opacity-80">No availability yet: {missing.map((m) => firstName(m.name)).join(", ")}</p>
      )}
    </div>
  );
}

/** "0 … N free" legend with stepped swatches */
export function HeatLegend({ total, className }: { total: number; className?: string }) {
  const steps = Array.from({ length: total + 1 }, (_, i) => i);
  return (
    <div className={cn("flex items-center gap-2 text-xs font-semibold text-muted-foreground", className)}>
      <span>0</span>
      <span className="flex overflow-hidden rounded-md border border-border" aria-hidden>
        {steps.map((i) => (
          <span
            key={i}
            className="h-3.5 w-5 bg-surface"
            style={i ? { backgroundColor: `color-mix(in srgb, var(--teal-text) ${heatPct(i, total)}%, var(--surface))` } : undefined}
          />
        ))}
      </span>
      <span>{total} free</span>
    </div>
  );
}
