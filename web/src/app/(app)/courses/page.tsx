"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, Check, ChevronRight, Plus, Search, Ticket } from "lucide-react";
import { toast } from "sonner";
import { Page, PageHeader } from "@/components/app/app-shell";
import { CourseCodeTile, CreateCourseDialog, byCode, matchesCourse, sameSchool } from "@/components/app/courses-bits";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { EmptyState, Panel, SectionTitle } from "@/components/ui/surface";
import { activeMembers, useMe } from "@/lib/queries";
import { useStore } from "@/lib/store";
import type { Course } from "@/lib/types";
import { plural } from "@/lib/utils";

export default function CoursesPage() {
  const me = useMe();
  const router = useRouter();
  const courses = useStore((s) => s.courses);
  const courseMembers = useStore((s) => s.courseMembers);
  const groups = useStore((s) => s.groups);
  const joinCourse = useStore((s) => s.joinCourse);
  const [query, setQuery] = React.useState("");

  const isJoined = React.useCallback(
    (c: Course) => (courseMembers[c.id] ?? []).includes(me.id),
    [courseMembers, me.id],
  );

  const stats = React.useMemo(() => {
    const out: Record<string, { groups: number; mine: number }> = {};
    for (const g of groups) {
      const s = (out[g.courseId] ??= { groups: 0, mine: 0 });
      s.groups++;
      if (activeMembers(g).some((m) => m.userId === me.id)) s.mine++;
    }
    return out;
  }, [groups, me.id]);

  const mine = React.useMemo(() => courses.filter(isJoined).sort(byCode), [courses, isJoined]);

  const results = React.useMemo(() => {
    const q = query.trim();
    if (q) {
      return courses
        .filter((c) => matchesCourse(c, q))
        .sort(
          (a, b) => Number(sameSchool(b.school, me.school)) - Number(sameSchool(a.school, me.school)) || byCode(a, b),
        )
        .slice(0, 20);
    }
    return courses.filter((c) => !isJoined(c) && sameSchool(c.school, me.school)).sort(byCode);
  }, [courses, query, isJoined, me.school]);

  const join = (c: Course) => {
    joinCourse(c.id);
    toast.success(`Joined ${c.code}`, {
      description: "Find a group inside it, or start one.",
      action: { label: "Open", onClick: () => router.push(`/courses/${c.id}`) },
    });
  };

  return (
    <Page>
      <PageHeader
        title="Courses"
        description="Your classes, and the study groups inside them."
        actions={
          <CreateCourseDialog onCreated={(id) => router.push(`/courses/${id}`)}>
            <Button variant="outline">
              <Plus />
              Create course
            </Button>
          </CreateCourseDialog>
        }
      />

      <div className="stagger grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-12">
        <div className="min-w-0 space-y-10">
          {/* Your courses */}
          <section aria-labelledby="your-courses">
            <SectionTitle id="your-courses">Your courses</SectionTitle>
            {mine.length > 0 ? (
              <ul className="divide-y divide-border overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface">
                {mine.map((c) => {
                  const s = stats[c.id] ?? { groups: 0, mine: 0 };
                  return (
                    <li key={c.id}>
                      <Link
                        href={`/courses/${c.id}`}
                        className="group flex min-h-[76px] items-center gap-4 px-4 py-3.5 transition-colors hover:bg-surface-2/70 sm:px-5"
                      >
                        <CourseCodeTile code={c.code} />
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-bold">{c.title}</div>
                          <div className="truncate text-sm text-muted-foreground">
                            <span className="font-semibold text-foreground/85">{c.code}</span> · {c.school}
                          </div>
                          <div className="mt-0.5 text-sm text-muted-foreground sm:hidden">
                            {plural(s.groups, "group")}
                            {s.mine > 0 && (
                              <span className="font-semibold text-foreground"> · You&rsquo;re in {s.mine}</span>
                            )}
                          </div>
                        </div>
                        <div className="hidden shrink-0 text-right text-sm sm:block">
                          <div className="font-semibold">{plural(s.groups, "group")}</div>
                          <div className="text-muted-foreground">
                            {s.mine > 0 ? `You're in ${s.mine}` : s.groups > 0 ? "None joined yet" : "Start the first"}
                          </div>
                        </div>
                        <ChevronRight className="size-5 shrink-0 text-subtle-foreground transition-transform duration-200 ease-[var(--ease-out)] group-hover:translate-x-0.5" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <EmptyState
                icon={<BookOpen />}
                title="No courses yet"
                description="Search for the courses you're taking below. Study groups live inside each one."
              />
            )}
          </section>

          {/* Find a course */}
          <section aria-labelledby="find-course">
            <SectionTitle id="find-course">Find a course</SectionTitle>
            <Field label="Search by code or title" htmlFor="course-search">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-subtle-foreground" />
                <Input
                  id="course-search"
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="CSC 201 or Data Structures"
                  autoComplete="off"
                  className="pl-10"
                />
              </div>
            </Field>

            <p className="mb-2 mt-4 px-1 text-sm text-muted-foreground" aria-live="polite">
              {query.trim()
                ? results.length
                  ? plural(results.length, "match", "matches")
                  : ""
                : results.length
                  ? `More at ${me.school}`
                  : `You've joined every course at ${me.school} so far.`}
            </p>

            {results.length > 0 && (
              <ul className="divide-y divide-border overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface">
                {results.map((c) => {
                  const joined = isJoined(c);
                  const count = (courseMembers[c.id] ?? []).length;
                  const s = stats[c.id] ?? { groups: 0, mine: 0 };
                  return (
                    <li key={c.id} className="flex min-h-[76px] items-center gap-4 px-4 py-3 sm:px-5">
                      <CourseCodeTile code={c.code} />
                      <div className="min-w-0 flex-1">
                        <Link href={`/courses/${c.id}`} className="block truncate font-bold hover:underline">
                          {c.title}
                        </Link>
                        <div className="truncate text-sm text-muted-foreground">
                          <span className="font-semibold text-foreground/85">{c.code}</span> ·{" "}
                          {sameSchool(c.school, me.school) ? "" : `${c.school} · `}
                          {plural(count, "student")} · {plural(s.groups, "group")}
                        </div>
                      </div>
                      {joined ? (
                        <span className="inline-flex h-11 shrink-0 items-center gap-1.5 px-2 text-sm font-semibold text-teal-text">
                          <Check className="size-4" strokeWidth={2.6} />
                          Joined
                        </span>
                      ) : (
                        <Button variant="outline" onClick={() => join(c)} aria-label={`Join ${c.code} ${c.title}`}>
                          Join
                        </Button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}

            {query.trim() && results.length === 0 && (
              <div className="rounded-[var(--radius-card)] border border-dashed border-border-strong px-5 py-8 text-center">
                <p className="font-semibold">No course matches &ldquo;{query.trim()}&rdquo;</p>
                <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                  Check the code on your timetable. If it&rsquo;s right, create the course so classmates can find it.
                </p>
                <CreateCourseDialog
                  initialCode={/\d/.test(query) ? query.trim() : ""}
                  onCreated={(id) => router.push(`/courses/${id}`)}
                >
                  <Button variant="primary" className="mt-5">
                    <Plus />
                    Create course
                  </Button>
                </CreateCourseDialog>
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-10 lg:self-start">
          <InviteCodeForm />
          <div className="px-1 text-sm leading-6 text-muted-foreground">
            <p className="font-semibold text-foreground">Course not listed?</p>
            <p>Anyone can add a course. Use the code from your timetable so classmates find the same one.</p>
          </div>
        </aside>
      </div>
    </Page>
  );
}

function InviteCodeForm() {
  const router = useRouter();
  const [code, setCode] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = code.trim().replace(/\s+/g, "");
    if (!value) return setError("Enter the code from your invite, like TREE-4KX9.");
    router.push(`/invite/${encodeURIComponent(value.toUpperCase())}`);
  };

  return (
    <Panel className="p-5">
      <form noValidate onSubmit={submit}>
        <div className="mb-4 flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-xl bg-surface-2 text-muted-foreground">
            <Ticket className="size-[18px]" />
          </span>
          <h2 className="text-h3">Have an invite code?</h2>
        </div>
        <Field label="Invite code" htmlFor="invite-code" error={error ?? undefined}>
          <Input
            id="invite-code"
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              if (error) setError(null);
            }}
            placeholder="TREE-4KX9"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            className="font-mono uppercase tracking-[0.08em] placeholder:normal-case placeholder:tracking-normal"
            aria-invalid={!!error}
          />
        </Field>
        <Button type="submit" variant="secondary" className="mt-3 w-full">
          Open invite
        </Button>
      </form>
    </Panel>
  );
}
