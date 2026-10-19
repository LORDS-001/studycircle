"use client";

import * as React from "react";
import { format } from "date-fns";
import { Info } from "lucide-react";
import { toast } from "sonner";
import { START_TIMES } from "@/components/app/session-helpers";
import { Button } from "@/components/ui/button";
import { Segmented, Select } from "@/components/ui/controls";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/overlays";
import { useStore } from "@/lib/store";
import type { Session } from "@/lib/types";

export const DURATIONS = [30, 45, 60, 75, 90, 120];

/** Edits one occurrence. Other sessions in the series are left alone. */
export function SessionEditDialog({
  session,
  open,
  onOpenChange,
}: {
  session: Session;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="Edit session" description="Change the details for this session." size="md">
        <EditForm session={session} onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function EditForm({ session, onClose }: { session: Session; onClose: () => void }) {
  const updateSession = useStore((s) => s.updateSession);
  const start = new Date(session.startsAt);
  const initialTime = format(start, "HH:mm");
  const [title, setTitle] = React.useState(session.title);
  const [date, setDate] = React.useState(format(start, "yyyy-MM-dd"));
  const [time, setTime] = React.useState(initialTime);
  const [duration, setDuration] = React.useState(String(session.durationMin));
  const [place, setPlace] = React.useState(session.location);
  const [agenda, setAgenda] = React.useState(session.agenda);
  const [error, setError] = React.useState<string | null>(null);
  const inPerson = !session.videoUrl;

  // Keep a non-standard start time selectable
  const times = START_TIMES.some((t) => t.value === initialTime)
    ? START_TIMES
    : [...START_TIMES, { value: initialTime, label: format(start, "h:mm a").toLowerCase() }].sort((a, b) => a.value.localeCompare(b.value));
  const durations = DURATIONS.includes(session.durationMin) ? DURATIONS : [...DURATIONS, session.durationMin].sort((a, b) => a - b);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return setError("Give the session a title.");
    if (!date) return setError("Pick a date.");
    updateSession(session.id, {
      title: title.trim(),
      startsAt: new Date(`${date}T${time}`).toISOString(),
      durationMin: Number(duration),
      agenda: agenda.trim(),
      ...(inPerson ? { location: place.trim() || "To be decided" } : {}),
    });
    toast.success("Session updated");
    onClose();
  };

  return (
    <form onSubmit={save} className="space-y-5">
      <Field label="Title" htmlFor="es-title" error={error && !title.trim() ? error : undefined}>
        <Input id="es-title" value={title} onChange={(e) => setTitle(e.target.value)} aria-invalid={!!error && !title.trim()} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Date" htmlFor="es-date" error={error && !date ? error : undefined}>
          <Input id="es-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="Start time" htmlFor="es-time">
          <Select id="es-time" value={time} onValueChange={setTime} options={times} />
        </Field>
      </div>
      <Field label="Duration, in minutes" htmlFor="es-duration">
        <Segmented
          aria-label="Duration in minutes"
          value={duration}
          onValueChange={setDuration}
          options={durations.map((d) => ({ value: String(d), label: String(d) }))}
          className="flex w-full"
          size="sm"
        />
      </Field>
      {inPerson && (
        <Field label="Place" htmlFor="es-place">
          <Input id="es-place" value={place} onChange={(e) => setPlace(e.target.value)} />
        </Field>
      )}
      <Field label="Agenda" htmlFor="es-agenda" optional>
        <Textarea id="es-agenda" rows={3} value={agenda} onChange={(e) => setAgenda(e.target.value)} />
      </Field>
      {session.seriesId && (
        <p className="flex items-start gap-2 rounded-xl bg-surface-2 px-3.5 py-3 text-sm leading-5 text-muted-foreground">
          <Info className="mt-0.5 size-4 shrink-0" />
          This changes this session only. The rest of the series stays as it is.
        </p>
      )}
      <DialogFooter>
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit">Save changes</Button>
      </DialogFooter>
    </form>
  );
}
