"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Dialog, DialogContent, DialogFooter, DialogTrigger } from "@/components/ui/overlays";
import { useMe } from "@/lib/queries";
import { useStore } from "@/lib/store";
import { supabaseEnabled } from "@/lib/supabase/client";
import { createCourseInSupabase } from "@/lib/supabase/data";
import type { Course, ID } from "@/lib/types";
import { cn } from "@/lib/utils";

/* ---------- Search helpers ---------- */

const squash = (s: string) => s.toLowerCase().replace(/\s+/g, "");

/** Matches "csc201", "CSC 201", "data struct" against code or title. */
export function matchesCourse(course: Course, query: string) {
  const q = squash(query);
  if (!q) return true;
  return squash(course.code).includes(q) || squash(course.title).includes(q);
}

export function sameSchool(a: string, b: string) {
  return squash(a) === squash(b);
}

export function byCode(a: Course, b: Course) {
  return a.code.localeCompare(b.code, undefined, { numeric: true });
}

/* ---------- Course code tile: department over number, like a book spine ---------- */

export function CourseCodeTile({ code, className }: { code: string; className?: string }) {
  const match = code.trim().match(/^([A-Za-z]+)\s*(.*)$/);
  const dept = (match?.[1] ?? code).toUpperCase();
  const num = match?.[2] ?? "";
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-12 shrink-0 flex-col items-center justify-center rounded-2xl border border-border bg-surface-2 leading-none",
        className,
      )}
    >
      <span className="max-w-[2.75rem] truncate text-[10px] font-bold tracking-[0.08em] text-muted-foreground">
        {dept}
      </span>
      {num && <span className="mt-1 max-w-[2.75rem] truncate text-[0.9375rem] font-bold tracking-tight">{num}</span>}
    </span>
  );
}

/* ---------- Create course ---------- */

type Errors = { code?: string; title?: string; school?: string };

/**
 * Code, title, school. Two courses can't share code + school; when that happens
 * we point at the existing one and offer to join it instead.
 */
export function CreateCourseForm({
  onDone,
  onCancel,
  initialCode = "",
  variant = "inline",
  autoFocus,
}: {
  /** Called with the new (or joined existing) course id */
  onDone?: (courseId: ID) => void;
  onCancel?: () => void;
  initialCode?: string;
  variant?: "inline" | "dialog";
  autoFocus?: boolean;
}) {
  const me = useMe();
  const createCourse = useStore((s) => s.createCourse);
  const joinCourse = useStore((s) => s.joinCourse);
  const id = React.useId();
  const [code, setCode] = React.useState(initialCode);
  const [title, setTitle] = React.useState("");
  const [school, setSchool] = React.useState(me.school);
  const [errors, setErrors] = React.useState<Errors>({});
  const [existing, setExisting] = React.useState<{ course: Course; message: string; alreadyIn: boolean } | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: Errors = {};
    if (!code.trim()) next.code = "Add the course code from your timetable, like CSC 201.";
    else if (code.trim().length > 16) next.code = "Course codes are short. Keep it under 16 characters.";
    if (!title.trim()) next.title = "Add the course title, like Data Structures.";
    if (!school.trim()) next.school = "Add your school so classmates there can find it.";
    setErrors(next);
    setExisting(null);
    if (Object.keys(next).length) return;

    const courseInput = { code: code.trim(), title: title.trim(), school: school.trim() };
    const result = supabaseEnabled ? await createCourseInSupabase(courseInput) : createCourse(courseInput);
    const st = useStore.getState();
    if (!result.ok) {
      const found = st.courses.find((c) => squash(c.code) === squash(code) && sameSchool(c.school, school));
      if (found)
        setExisting({
          course: found,
          message: result.error,
          alreadyIn: (st.courseMembers[found.id] ?? []).includes(me.id),
        });
      else setErrors({ code: result.error });
      return;
    }
    const created = st.courses.find((c) => c.id === result.id);
    toast.success(`${created?.code ?? "Your course"} is ready`, {
      description: "You're in. Classmates can find it by its code.",
    });
    onDone?.(result.id);
  };

  const actions =
    variant === "dialog" ? (
      <DialogFooter>
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant={existing && !existing.alreadyIn ? "outline" : "primary"}>
          Create course
        </Button>
      </DialogFooter>
    ) : (
      <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:items-center">
        <Button type="submit" variant={existing && !existing.alreadyIn ? "outline" : "primary"}>
          Create course
        </Button>
        {onCancel && (
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    );

  return (
    <form noValidate onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <Field label="Course code" htmlFor={`${id}-code`} error={errors.code}>
          <Input
            id={`${id}-code`}
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              setExisting(null);
            }}
            placeholder="CSC 201"
            autoComplete="off"
            autoCapitalize="characters"
            autoFocus={autoFocus}
            aria-invalid={!!errors.code || !!existing}
          />
        </Field>
        <Field label="Course title" htmlFor={`${id}-title`} error={errors.title}>
          <Input
            id={`${id}-title`}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Data Structures"
            autoComplete="off"
            aria-invalid={!!errors.title}
          />
        </Field>
      </div>
      <Field label="School" htmlFor={`${id}-school`} error={errors.school}>
        <Input
          id={`${id}-school`}
          value={school}
          onChange={(e) => {
            setSchool(e.target.value);
            setExisting(null);
          }}
          autoComplete="organization"
          aria-invalid={!!errors.school}
        />
      </Field>

      {existing && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-2xl border border-border-strong bg-surface-2 p-4 sm:flex-row sm:items-center"
        >
          <p className="min-w-0 flex-1 text-[0.9375rem] leading-6">
            {existing.alreadyIn ? (
              <>
                <span className="font-semibold">{existing.course.code}</span> at {existing.course.school} already
                exists, and you&rsquo;re already in it.
              </>
            ) : (
              existing.message
            )}
          </p>
          {!existing.alreadyIn && (
            <Button
              variant="primary"
              onClick={() => {
                joinCourse(existing.course.id);
                toast.success(`Joined ${existing.course.code}`, { description: existing.course.title });
                onDone?.(existing.course.id);
              }}
            >
              <Check />
              Join {existing.course.code}
            </Button>
          )}
        </div>
      )}

      {actions}
    </form>
  );
}

export function CreateCourseDialog({
  children,
  initialCode,
  onCreated,
}: {
  children: React.ReactNode;
  initialCode?: string;
  onCreated?: (courseId: ID) => void;
}) {
  const [open, setOpen] = React.useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent
        title="Create a course"
        description="Add a course so classmates can find it and start study groups inside it."
      >
        <CreateCourseForm
          variant="dialog"
          initialCode={initialCode}
          autoFocus
          onCancel={() => setOpen(false)}
          onDone={(id) => {
            setOpen(false);
            onCreated?.(id);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
