"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { CalendarClock, Check, ChevronLeft, Copy, Plus, Repeat, Share2, Target } from "lucide-react";
import { toast } from "sonner";
import { Page, PageHeader } from "@/components/app/app-shell";
import { CreateCourseDialog } from "@/components/app/courses-bits";
import { CADENCES } from "@/components/app/edit-group-dialog";
import { NormsInput, VisibilityBadge, examCountdown } from "@/components/app/group-bits";
import { InviteDialog } from "@/components/app/invite-dialog";
import { StepProgress } from "@/components/app/onboarding-steps";
import { SeatRing } from "@/components/brand/rings";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChoiceCards, Segmented, Select } from "@/components/ui/controls";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Panel } from "@/components/ui/surface";
import { useGroup, useMe, useMyCourses } from "@/lib/queries";
import { useStore } from "@/lib/store";
import { supabaseEnabled } from "@/lib/supabase/client";
import { createGroupInSupabase } from "@/lib/supabase/data";
import { GOALS } from "@/lib/templates";
import type { Course, Group, GroupGoal, Visibility } from "@/lib/types";
import { cn, plural } from "@/lib/utils";

const STEPS = ["The group", "The charter"];
const NAME_MAX = 60;
const DESC_MAX = 280;

const GOAL_OPTIONS: { value: GroupGoal; title: string; description: string }[] = [
  { value: "pass", title: GOALS.pass, description: "Get through the exam with confidence." },
  { value: "b-plus", title: GOALS["b-plus"], description: "A solid grade and a real grip on the material." },
  { value: "a", title: GOALS.a, description: "Go deep. Past papers, hard questions, no shortcuts." },
  { value: "mastery", title: GOALS.mastery, description: "Understand it fully, beyond what the exam asks." },
];

interface FormState {
  courseId: string;
  name: string;
  description: string;
  maxSize: number;
  visibility: Visibility;
  goal: GroupGoal;
  norms: string[];
  cadence: string;
  examDate: string;
}

type Errors = Partial<Record<keyof FormState, string>>;

export default function NewGroupPage() {
  return (
    <React.Suspense fallback={null}>
      <NewGroup />
    </React.Suspense>
  );
}

function NewGroup() {
  const params = useSearchParams();
  const preselect = params.get("course");
  const myCourses = useMyCourses();
  const allCourses = useStore((s) => s.courses);
  const createGroup = useStore((s) => s.createGroup);
  const [step, setStep] = React.useState(0);
  const [errors, setErrors] = React.useState<Errors>({});
  const [createdId, setCreatedId] = React.useState<string | null>(null);
  const headingRef = React.useRef<HTMLHeadingElement>(null);
  const firstRender = React.useRef(true);

  const [form, setForm] = React.useState<FormState>(() => ({
    courseId:
      preselect && allCourses.some((c) => c.id === preselect)
        ? preselect
        : myCourses.length === 1
          ? myCourses[0].id
          : "",
    name: "",
    description: "",
    maxSize: 5,
    visibility: "public",
    goal: "b-plus",
    norms: [],
    cadence: "Weekly",
    examDate: "",
  }));

  // A course linked from ?course= is offered even before you've joined it; creating the group joins you.
  const courseOptions = React.useMemo(() => {
    const list = [...myCourses];
    const extra = allCourses.find((c) => c.id === form.courseId);
    if (extra && !list.some((c) => c.id === extra.id)) list.unshift(extra);
    return list;
  }, [myCourses, allCourses, form.courseId]);

  const course = allCourses.find((c) => c.id === form.courseId);

  React.useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus();
    window.scrollTo({ top: 0 });
  }, [step, createdId]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const validateGroup = (): Errors => {
    const e: Errors = {};
    if (!form.courseId) e.courseId = "Pick the course this group is for.";
    if (!form.name.trim()) e.name = "Give your group a name classmates will recognise.";
    else if (form.name.trim().length > NAME_MAX) e.name = `Keep the name under ${NAME_MAX} characters.`;
    if (form.description.length > DESC_MAX) e.description = `Keep the description under ${DESC_MAX} characters.`;
    return e;
  };

  const validateCharter = (): Errors => {
    const e: Errors = {};
    if (form.examDate) {
      const exam = new Date(`${form.examDate}T23:59`);
      if (Number.isNaN(+exam)) e.examDate = "That date doesn't look right. Pick it from the calendar.";
      else if (exam < new Date()) e.examDate = "Pick a date in the future, or leave it empty.";
    }
    return e;
  };

  const next = (e: React.FormEvent) => {
    e.preventDefault();
    const found = validateGroup();
    setErrors(found);
    if (Object.keys(found).length) return;
    setStep(1);
  };

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    const found = validateCharter();
    setErrors(found);
    if (Object.keys(found).length) return;
    const input = {
      courseId: form.courseId,
      name: form.name.trim(),
      description: form.description.trim(),
      maxSize: form.maxSize,
      visibility: form.visibility,
      goal: form.goal,
      norms: form.norms,
      cadence: form.cadence,
      examDate: form.examDate ? new Date(`${form.examDate}T09:00`).toISOString() : undefined,
    };
    if (supabaseEnabled) {
      try { setCreatedId(await createGroupInSupabase(input)); } catch { /* Error is shown by the data layer. */ }
    } else setCreatedId(createGroup(input));
  };

  if (createdId) return <CreatedScreen groupId={createdId} headingRef={headingRef} />;

  return (
    <Page>
      <PageHeader
        back={
          course && preselect === course.id
            ? { href: `/courses/${course.id}`, label: course.code }
            : { href: "/groups", label: "Your groups" }
        }
        title="Create a group"
        description="Two short steps. You can change any of this later."
      />

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-14">
        <div className="min-w-0 max-w-[600px]">
          <StepProgress steps={STEPS} current={step} showName={false} className="mb-8" />

          {step === 0 ? (
            <form noValidate onSubmit={next} className="space-y-6">
              <h2 ref={headingRef} tabIndex={-1} className="text-h2 outline-none">
                The group
              </h2>

              <div className="relative">
                <Field
                  label="Course"
                  htmlFor="ng-course"
                  error={errors.courseId}
                  hint="The group lives inside this course."
                >
                  {courseOptions.length > 0 ? (
                    <Select
                      id="ng-course"
                      value={form.courseId}
                      onValueChange={(v) => set("courseId", v)}
                      placeholder="Choose a course"
                      options={courseOptions.map((c) => ({ value: c.id, label: `${c.code} · ${c.title}` }))}
                    />
                  ) : (
                    <div className="rounded-[var(--radius-control)] border border-dashed border-border-strong px-4 py-3 text-[0.9375rem] text-muted-foreground">
                      You haven&rsquo;t joined a course yet.{" "}
                      <Link href="/courses" className="font-semibold text-teal-text underline-offset-4 hover:underline">
                        Find your courses
                      </Link>{" "}
                      or add a new one.
                    </div>
                  )}
                </Field>
                <CreateCourseDialog onCreated={(id) => set("courseId", id)}>
                  <button
                    type="button"
                    className="absolute -top-3 right-0 inline-flex h-11 items-center gap-1 rounded-lg px-1 text-sm font-semibold text-teal-text underline-offset-4 hover:underline"
                  >
                    <Plus className="size-4" />
                    Add a course
                  </button>
                </CreateCourseDialog>
              </div>

              <Field
                label="Group name"
                htmlFor="ng-name"
                error={errors.name}
                hint="Short and friendly works best, like “Trees and Graphs Crew”."
              >
                <Input
                  id="ng-name"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  maxLength={NAME_MAX + 20}
                  autoComplete="off"
                  aria-invalid={!!errors.name}
                />
              </Field>

              <Field
                label="Description"
                htmlFor="ng-desc"
                optional
                error={errors.description}
                hint={`Who it's for and how you'll work. ${form.description.length}/${DESC_MAX}`}
              >
                <Textarea
                  id="ng-desc"
                  rows={3}
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  placeholder="Second-years working one chapter a week, with a mock exam before the real one."
                  aria-invalid={!!errors.description}
                />
              </Field>

              <Field
                label="Size limit"
                htmlFor="ng-size"
                hint="Small groups participate more. Everyone gets a turn to talk."
              >
                <Segmented
                  aria-label="Size limit"
                  value={String(form.maxSize)}
                  onValueChange={(v) => set("maxSize", Number(v))}
                  options={[3, 4, 5, 6].map((n) => ({ value: String(n), label: String(n) }))}
                  className="w-full sm:w-80"
                />
              </Field>

              <fieldset>
                <legend className="mb-1.5 text-sm font-semibold">Who can join</legend>
                <ChoiceCards
                  aria-label="Who can join"
                  value={form.visibility}
                  onValueChange={(v) => set("visibility", v)}
                  className="sm:grid-cols-2"
                  options={[
                    { value: "public", title: "Public", description: "Anyone in the course can join instantly." },
                    { value: "private", title: "Private", description: "You approve each request." },
                  ]}
                />
              </fieldset>

              <div className="flex justify-end border-t border-border pt-6">
                <Button type="submit" size="lg" className="w-full sm:w-auto">
                  Continue
                </Button>
              </div>
            </form>
          ) : (
            <form noValidate onSubmit={create} className="space-y-6">
              <h2 ref={headingRef} tabIndex={-1} className="text-h2 outline-none">
                The charter
              </h2>
              <p className="-mt-3 text-[0.9375rem] leading-6 text-muted-foreground">
                What the group is aiming for and how you&rsquo;ll work together. Everyone sees it before they join.
              </p>

              <fieldset>
                <legend className="mb-1.5 text-sm font-semibold">Goal</legend>
                <ChoiceCards
                  aria-label="Goal"
                  value={form.goal}
                  onValueChange={(v) => set("goal", v)}
                  className="sm:grid-cols-2"
                  options={GOAL_OPTIONS}
                />
              </fieldset>

              <Field
                label="Norms"
                htmlFor="ng-norms"
                optional
                hint="A few short promises the group makes to each other."
              >
                <NormsInput id="ng-norms" value={form.norms} onChange={(v) => set("norms", v)} />
              </Field>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="How often you'll meet" htmlFor="ng-cadence">
                  <Select
                    id="ng-cadence"
                    value={form.cadence}
                    onValueChange={(v) => set("cadence", v)}
                    options={CADENCES.map((c) => ({ value: c, label: c }))}
                  />
                </Field>
                <Field
                  label="Exam date"
                  htmlFor="ng-exam"
                  optional
                  error={errors.examDate}
                  hint="Sessions can repeat up to this date."
                >
                  <Input
                    id="ng-exam"
                    type="date"
                    value={form.examDate}
                    min={format(new Date(), "yyyy-MM-dd")}
                    onChange={(e) => set("examDate", e.target.value)}
                    aria-invalid={!!errors.examDate}
                  />
                </Field>
              </div>

              <div className="flex flex-col-reverse gap-2 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
                <Button variant="ghost" onClick={() => setStep(0)} className="sm:-ml-3">
                  <ChevronLeft />
                  Back
                </Button>
                <Button type="submit" size="lg" className="w-full sm:w-auto">
                  Create group
                </Button>
              </div>
            </form>
          )}
        </div>

        <aside className="hidden lg:block" aria-label="Preview">
          <div className="sticky top-10">
            <p className="mb-3 text-sm font-semibold text-muted-foreground">How classmates will see it</p>
            <GroupPreviewCard form={form} course={course} />
          </div>
        </aside>
      </div>
    </Page>
  );
}

/* ---------- Live preview ---------- */

function GroupPreviewCard({ form, course }: { form: FormState; course?: Course }) {
  const me = useMe();
  const countdown = examCountdown(form.examDate ? new Date(`${form.examDate}T09:00`).toISOString() : undefined);
  const facts = [
    { icon: Target, label: "Goal", value: GOALS[form.goal] },
    { icon: Repeat, label: "Cadence", value: form.cadence },
    { icon: CalendarClock, label: "Exam", value: countdown ?? "No exam date" },
  ];

  return (
    <Panel className="overflow-hidden shadow-raised">
      <div className="p-5">
        <div className="flex items-start gap-4">
          <SeatRing filled={1} total={form.maxSize} size={56} />
          <div className="min-w-0 flex-1 pt-0.5">
            <div className="truncate text-sm font-semibold text-teal-text">
              {course ? course.code : "Choose a course"}
            </div>
            <div className={cn("text-h3 [overflow-wrap:anywhere]", !form.name.trim() && "text-subtle-foreground")}>
              {form.name.trim() || "Your group name"}
            </div>
          </div>
        </div>
        <p
          className={cn(
            "mt-3 line-clamp-3 text-sm leading-5 [overflow-wrap:anywhere]",
            form.description.trim() ? "text-muted-foreground" : "text-subtle-foreground",
          )}
        >
          {form.description.trim() || "A line about who it's for and how you'll work."}
        </p>
        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="flex items-center gap-2">
            <Avatar user={me} size="xs" />
            <span className="text-xs font-medium text-muted-foreground">
              1 of {form.maxSize} · {plural(form.maxSize - 1, "seat")} open
            </span>
          </span>
          <VisibilityBadge visibility={form.visibility} />
        </div>
      </div>
      <dl className="space-y-2.5 border-t border-border bg-surface-2/60 px-5 py-4">
        {facts.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-center gap-3 text-sm">
            <dt className="flex w-20 shrink-0 items-center gap-2 text-muted-foreground">
              <Icon className="size-4" aria-hidden />
              {label}
            </dt>
            <dd className="min-w-0 truncate font-semibold">{value}</dd>
          </div>
        ))}
        {form.norms.length > 0 && (
          <div className="pt-1.5">
            <dt className="sr-only">Norms</dt>
            <dd className="flex flex-wrap gap-1.5">
              {form.norms.map((n) => (
                <span key={n} className="rounded-full border border-border-strong px-2.5 py-0.5 text-xs font-medium">
                  {n}
                </span>
              ))}
            </dd>
          </div>
        )}
      </dl>
    </Panel>
  );
}

/* ---------- Success ---------- */

function CreatedScreen({
  groupId,
  headingRef,
}: {
  groupId: string;
  headingRef: React.RefObject<HTMLHeadingElement | null>;
}) {
  const group = useGroup(groupId);
  const course = useStore((s) => s.courses.find((c) => c.id === group?.courseId));
  if (!group) return null;
  const seatsLeft = group.maxSize - 1;

  return (
    <Page width="narrow">
      <div className="stagger mx-auto flex max-w-[560px] flex-col items-center pt-4 text-center sm:pt-10">
        <SeatRing filled={1} total={group.maxSize} size={96} />
        <Badge variant="gold" size="md" className="mt-6">
          You&rsquo;re the organiser
        </Badge>
        <div>
          <h1 ref={headingRef} tabIndex={-1} className="mt-3 text-h1 outline-none">
            Your group is ready
          </h1>
          <p className="mt-2 text-body text-muted-foreground">
            <span className="font-semibold text-foreground">{group.name}</span>
            {course ? ` is set up in ${course.code}` : " is set up"}. Invite classmates to fill the other{" "}
            {plural(seatsLeft, "seat")}.
          </p>
        </div>

        <InviteLinkBox group={group} />

        <div className="mt-8 flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Button asChild size="lg">
            <Link href={`/groups/${group.id}/availability`}>Add your availability</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href={`/groups/${group.id}`}>Open group</Link>
          </Button>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          Once a few people add their times, we&rsquo;ll suggest when to meet.
        </p>
      </div>
    </Page>
  );
}

function InviteLinkBox({ group }: { group: Group }) {
  const [copied, setCopied] = React.useState(false);
  // This screen only renders after the store hydrates on the client, so window is available.
  const link = `${window.location.origin}/invite/${group.inviteCode}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success("Invite link copied", { description: "Paste it in your class chat." });
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Couldn't copy. Select the link and copy it manually.");
    }
  };

  return (
    <div className="mt-8 w-full rounded-[var(--radius-card)] border border-border bg-surface p-4 text-left sm:p-5">
      <label htmlFor="ng-invite-link" className="text-sm font-semibold">
        Invite link
      </label>
      <div className="mt-1.5 flex flex-col gap-2 sm:flex-row">
        <Input
          id="ng-invite-link"
          readOnly
          value={link.replace(/^https?:\/\//, "")}
          onFocus={(e) => e.currentTarget.select()}
          className="min-w-0 bg-surface-2 text-[0.9375rem] text-muted-foreground sm:flex-1"
        />
        <Button onClick={copy} className="sm:w-32" aria-live="polite">
          {copied ? <Check /> : <Copy />}
          {copied ? "Copied" : "Copy link"}
        </Button>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Or share the code{" "}
          <span className="font-mono font-bold tracking-[0.08em] text-foreground">{group.inviteCode}</span>
        </p>
        <InviteDialog group={group}>
          <Button variant="ghost" size="sm" className="h-11 sm:h-9">
            <Share2 />
            More ways to share
          </Button>
        </InviteDialog>
      </div>
    </div>
  );
}
