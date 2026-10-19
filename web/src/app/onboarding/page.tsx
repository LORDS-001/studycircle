"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, Check, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { AuthGate } from "@/components/app/app-shell";
import { CourseCodeTile, CreateCourseForm, byCode, matchesCourse, sameSchool } from "@/components/app/courses-bits";
import { StepProgress } from "@/components/app/onboarding-steps";
import { Logo } from "@/components/brand/logo";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { useMe } from "@/lib/queries";
import { useStore } from "@/lib/store";
import { cn, firstName, plural } from "@/lib/utils";

const STEPS = ["Your profile", "Your courses"];

function safeNext(raw: string | null) {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/onboarding")) return "/dashboard";
  return raw;
}

export default function OnboardingPage() {
  return (
    <AuthGate requireOnboarded={false}>
      <React.Suspense fallback={null}>
        <Onboarding />
      </React.Suspense>
    </AuthGate>
  );
}

function Onboarding() {
  const me = useMe();
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"));
  const updateProfile = useStore((s) => s.updateProfile);
  const completeOnboarding = useStore((s) => s.completeOnboarding);
  const [step, setStep] = React.useState(0);
  const headingRef = React.useRef<HTMLHeadingElement>(null);
  const firstRender = React.useRef(true);

  React.useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus();
    window.scrollTo({ top: 0 });
  }, [step]);

  const finish = () => {
    completeOnboarding();
    toast.success(`You're all set, ${firstName(me.name)}`);
    router.replace(next);
  };

  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex h-16 max-w-[640px] items-center px-4 sm:px-6">
        <Logo size={24} />
      </header>
      <main className="mx-auto w-full max-w-[640px] px-4 pb-16 pt-4 sm:px-6 sm:pt-10">
        <StepProgress steps={STEPS} current={step} className="mb-10" />
        {step === 0 ? (
          <ProfileStep
            headingRef={headingRef}
            onContinue={(profile) => {
              updateProfile(profile);
              setStep(1);
            }}
          />
        ) : (
          <CoursesStep headingRef={headingRef} onBack={() => setStep(0)} onFinish={finish} />
        )}
      </main>
    </div>
  );
}

/* ---------- Step 1 ---------- */

function ProfileStep({
  headingRef,
  onContinue,
}: {
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  onContinue: (p: { name: string; school: string }) => void;
}) {
  const me = useMe();
  const [name, setName] = React.useState(me.name);
  const [school, setSchool] = React.useState(me.school);
  const [errors, setErrors] = React.useState<{ name?: string; school?: string }>({});

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (!name.trim()) next.name = "Add your name so your group knows who you are.";
    if (!school.trim()) next.school = "Add your school so we can show you its courses.";
    setErrors(next);
    if (Object.keys(next).length) return;
    onContinue({ name: name.trim(), school: school.trim() });
  };

  return (
    <form noValidate onSubmit={submit} className="stagger">
      <div>
        <h1 ref={headingRef} tabIndex={-1} className="text-h1 outline-none">
          First, a little about you
        </h1>
        <p className="mt-2 text-body text-muted-foreground">This is what classmates see when you join a group.</p>
      </div>

      <div className="mt-8 flex items-center gap-4 rounded-[var(--radius-card)] border border-border bg-surface p-4 sm:p-5">
        <Avatar user={{ ...me, name: name.trim() || me.name }} size="lg" />
        <div className="min-w-0">
          <div className="truncate font-bold">{name.trim() || "Your name"}</div>
          <div className="truncate text-sm text-muted-foreground">{school.trim() || "Your school"}</div>
        </div>
      </div>

      <div className="mt-6 space-y-5">
        <Field label="Your name" htmlFor="ob-name" error={errors.name}>
          <Input
            id="ob-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            aria-invalid={!!errors.name}
          />
        </Field>
        <Field
          label="School"
          htmlFor="ob-school"
          error={errors.school}
          hint="We use this to show you courses at your school first."
        >
          <Input
            id="ob-school"
            value={school}
            onChange={(e) => setSchool(e.target.value)}
            autoComplete="organization"
            aria-invalid={!!errors.school}
          />
        </Field>
      </div>

      <div className="mt-10 flex justify-end">
        <Button type="submit" size="lg" className="w-full sm:w-auto">
          Continue
        </Button>
      </div>
    </form>
  );
}

/* ---------- Step 2 ---------- */

function CoursesStep({
  headingRef,
  onBack,
  onFinish,
}: {
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  onBack: () => void;
  onFinish: () => void;
}) {
  const me = useMe();
  const courses = useStore((s) => s.courses);
  const courseMembers = useStore((s) => s.courseMembers);
  const joinCourse = useStore((s) => s.joinCourse);
  const leaveCourse = useStore((s) => s.leaveCourse);
  const [query, setQuery] = React.useState("");
  const [creating, setCreating] = React.useState(false);

  const isJoined = (id: string) => (courseMembers[id] ?? []).includes(me.id);
  const joinedCount = courses.filter((c) => isJoined(c.id)).length;

  const results = React.useMemo(() => {
    const q = query.trim();
    const pool = q
      ? courses.filter((c) => matchesCourse(c, q))
      : courses.filter((c) => sameSchool(c.school, me.school));
    // Your school first, then by code
    return [...pool]
      .sort((a, b) => Number(sameSchool(b.school, me.school)) - Number(sameSchool(a.school, me.school)) || byCode(a, b))
      .slice(0, 12);
  }, [courses, query, me.school]);

  const looksLikeCode = /\d/.test(query);

  return (
    <div className="stagger">
      <div>
        <h1 ref={headingRef} tabIndex={-1} className="text-h1 outline-none">
          Add your courses
        </h1>
        <p className="mt-2 text-body text-muted-foreground">
          Join the courses you&rsquo;re taking this term. Study groups live inside each one.
        </p>
      </div>

      <div className="mt-8">
        <Field label="Find a course" htmlFor="ob-search">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-subtle-foreground" />
            <Input
              id="ob-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Course code or title, like CSC 201"
              autoComplete="off"
              className="pl-10"
            />
          </div>
        </Field>

        <div className="mt-3 flex items-baseline justify-between gap-3 px-1">
          <p className="text-sm text-muted-foreground">
            {query.trim() ? `${plural(results.length, "match", "matches")}` : `Courses at ${me.school}`}
          </p>
          <p className="text-sm font-semibold" aria-live="polite">
            {joinedCount > 0 ? `${joinedCount} joined` : ""}
          </p>
        </div>

        {results.length > 0 ? (
          <ul className="mt-2 divide-y divide-border overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface">
            {results.map((c) => {
              const joined = isJoined(c.id);
              const count = (courseMembers[c.id] ?? []).length;
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    aria-pressed={joined}
                    aria-label={`${c.code} ${c.title}, ${c.school}`}
                    onClick={() => (joined ? leaveCourse(c.id) : joinCourse(c.id))}
                    className="group flex min-h-[72px] w-full items-center gap-3.5 px-4 py-3 text-left transition-colors hover:bg-surface-2/70"
                  >
                    <CourseCodeTile code={c.code} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-bold">{c.title}</span>
                      <span className="block truncate text-sm text-muted-foreground">
                        <span className="font-semibold text-foreground/85">{c.code}</span> ·{" "}
                        {sameSchool(c.school, me.school) ? plural(count, "classmate") : c.school}
                      </span>
                    </span>
                    <span
                      aria-hidden
                      className={cn(
                        "pressable inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-sm font-semibold group-active:scale-[0.96]",
                        joined ? "bg-teal text-teal-foreground" : "border border-border-strong text-foreground",
                      )}
                    >
                      {joined ? <Check className="size-4" strokeWidth={2.6} /> : <Plus className="size-4" />}
                      {joined ? "Joined" : "Join"}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="mt-2 rounded-[var(--radius-card)] border border-dashed border-border-strong px-5 py-8 text-center">
            <p className="font-semibold">No course matches &ldquo;{query.trim()}&rdquo;</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Check the code, or create the course so classmates can find it.
            </p>
          </div>
        )}

        <div className="mt-4">
          {creating ? (
            <div className="rounded-[var(--radius-card)] border border-border bg-surface p-4 sm:p-5">
              <h2 className="mb-4 text-h3">Create a course</h2>
              <CreateCourseForm
                key={looksLikeCode ? query : ""}
                initialCode={looksLikeCode ? query.trim() : ""}
                autoFocus
                onCancel={() => setCreating(false)}
                onDone={() => {
                  setCreating(false);
                  setQuery("");
                }}
              />
            </div>
          ) : (
            <Button variant="ghost" onClick={() => setCreating(true)} className="-ml-1 px-3">
              <Plus />
              Can&rsquo;t find it? Create a course
            </Button>
          )}
        </div>
      </div>

      <div className="mt-12 flex flex-col-reverse gap-2 border-t border-border pt-6 sm:flex-row sm:items-center">
        <Button variant="ghost" onClick={onBack} className="sm:-ml-3">
          <ChevronLeft />
          Back
        </Button>
        <div className="sm:ml-auto">
          {joinedCount === 0 ? (
            <Button variant="outline" size="lg" onClick={onFinish} className="w-full sm:w-auto">
              Skip for now
            </Button>
          ) : (
            <Button size="lg" onClick={onFinish} className="w-full sm:w-auto">
              Finish setup
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
