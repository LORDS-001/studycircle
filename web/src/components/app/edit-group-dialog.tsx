"use client";

import * as React from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { NormsInput } from "@/components/app/group-bits";
import { Button } from "@/components/ui/button";
import { Segmented, Select } from "@/components/ui/controls";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/overlays";
import { activeMembers } from "@/lib/queries";
import { useStore } from "@/lib/store";
import { GOALS } from "@/lib/templates";
import type { Group, GroupGoal, Visibility } from "@/lib/types";

export const CADENCES = ["Weekly", "Twice weekly", "Three times a week", "Before each test"];

export function EditGroupDialog({
  group,
  open,
  onOpenChange,
}: {
  group: Group;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="Edit group and charter" description="Everyone in the group can see the charter." size="lg">
        {/* Radix unmounts the content when closed, so the form starts fresh on every open */}
        <EditGroupForm group={group} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function EditGroupForm({ group, onDone }: { group: Group; onDone: () => void }) {
  const updateGroup = useStore((s) => s.updateGroup);
  const [form, setForm] = React.useState(() => toForm(group));
  const [error, setError] = React.useState<string | null>(null);
  const memberCount = activeMembers(group).length;

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return setError("Give the group a name.");
    if (form.maxSize < memberCount) return setError(`The group already has ${memberCount} members.`);
    updateGroup(group.id, {
      name: form.name.trim(),
      description: form.description.trim(),
      maxSize: form.maxSize,
      visibility: form.visibility,
      goal: form.goal,
      norms: form.norms,
      cadence: form.cadence,
      examDate: form.examDate ? new Date(`${form.examDate}T09:00`).toISOString() : undefined,
    });
    toast.success("Charter saved");
    onDone();
  };

  return (
    <form onSubmit={save} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Group name" htmlFor="eg-name" error={error && !form.name.trim() ? error : undefined} className="sm:col-span-2">
          <Input id="eg-name" value={form.name} onChange={(e) => set("name", e.target.value)} />
        </Field>
        <Field label="Description" htmlFor="eg-desc" optional className="sm:col-span-2">
          <Textarea id="eg-desc" rows={2} value={form.description} onChange={(e) => set("description", e.target.value)} />
        </Field>
        <Field label="Goal" htmlFor="eg-goal">
          <Select
            id="eg-goal"
            value={form.goal}
            onValueChange={(v) => set("goal", v as GroupGoal)}
            options={Object.entries(GOALS).map(([value, label]) => ({ value, label }))}
          />
        </Field>
        <Field label="Cadence" htmlFor="eg-cadence">
          <Select
            id="eg-cadence"
            value={form.cadence}
            onValueChange={(v) => set("cadence", v)}
            options={CADENCES.map((c) => ({ value: c, label: c }))}
          />
        </Field>
        <Field label="Exam date" htmlFor="eg-exam" optional>
          <Input id="eg-exam" type="date" value={form.examDate} onChange={(e) => set("examDate", e.target.value)} />
        </Field>
        <Field
          label="Size limit"
          htmlFor="eg-size"
          error={error && form.maxSize < memberCount ? error : undefined}
          hint="Small groups participate more. 3 to 6."
        >
          <Segmented
            aria-label="Size limit"
            value={String(form.maxSize)}
            onValueChange={(v) => set("maxSize", Number(v))}
            options={[3, 4, 5, 6].map((n) => ({ value: String(n), label: String(n) }))}
            className="w-full"
          />
        </Field>
      </div>
      <Field label="Who can join" htmlFor="eg-vis">
        <Segmented
          aria-label="Who can join"
          value={form.visibility}
          onValueChange={(v) => set("visibility", v as Visibility)}
          options={[
            { value: "public", label: "Anyone in the course" },
            { value: "private", label: "Only people I approve" },
          ]}
          className="w-full"
        />
      </Field>
      <Field label="Norms" htmlFor="eg-norms" hint="A few short promises the group makes to each other.">
        <NormsInput id="eg-norms" value={form.norms} onChange={(v) => set("norms", v)} />
      </Field>
      <DialogFooter>
        <Button variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit">Save charter</Button>
      </DialogFooter>
    </form>
  );
}

function toForm(g: Group) {
  return {
    name: g.name,
    description: g.description,
    maxSize: g.maxSize,
    visibility: g.visibility,
    goal: g.goal,
    norms: g.norms,
    cadence: g.cadence,
    examDate: g.examDate ? format(new Date(g.examDate), "yyyy-MM-dd") : "",
  };
}
