"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { addDays, format, setHours, setMinutes, startOfDay } from "date-fns";
import { CalendarDays, ChevronLeft, Clock, MapPin, Plus, Repeat, Sparkles, Video, X } from "lucide-react";
import { toast } from "sonner";
import { DURATIONS } from "@/components/app/session-edit-dialog";
import { RECURRENCE_LABEL, START_TIMES, seriesDates, timeRange } from "@/components/app/session-helpers";
import { StepsTimeline } from "@/components/app/session-plan";
import { TEMPLATE_ICON, TemplateBadge } from "@/components/app/session-bits";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ChoiceCards, Segmented, Select } from "@/components/ui/controls";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Panel } from "@/components/ui/surface";
import { useCurrentGroup } from "@/lib/group-context";
import { activeMembers, useUserMap } from "@/lib/queries";
import { useStore } from "@/lib/store";
import { supabaseEnabled } from "@/lib/supabase/client";
import { createSessionInSupabase } from "@/lib/supabase/data";
import { TEMPLATES, stepsFor } from "@/lib/templates";
import type { Recurrence, SessionTemplate } from "@/lib/types";
import { SLOT_COUNT, SLOT_START_HOUR, cn, firstName, formatDay, formatDuration, plural } from "@/lib/utils";

const TITLE_PLACEHOLDER: Record<SessionTemplate, string> = {
  retrieval: "Graphs: BFS and DFS",
  jigsaw: "Shortest paths",
  cowork: "Past paper: 2023",
};

const PREP_SUGGESTIONS: Record<SessionTemplate, string[]> = {
  retrieval: ["Bring 2 questions from Chapter 4", "Skim the lecture slides"],
  jigsaw: ["Prepare your 10-minute explanation", "Bring one diagram for your subtopic"],
  cowork: ["Pick one goal for the session", "Print the past paper"],
};

const TOPIC_PLACEHOLDERS = ["Dijkstra", "Bellman-Ford", "Floyd-Warshall", "Topological sort", "Minimum spanning trees", "A* search"];

/** ?day=<0-6, Mon first>&slot=<0-31> from the availability heatmap → the next matching date and time */
function initialWhen(day: string | null, slot: string | null) {
  const now = new Date();
  const d = Number(day);
  const sl = Number(slot);
  if (day !== null && slot !== null && Number.isInteger(d) && d >= 0 && d <= 6 && Number.isInteger(sl) && sl >= 0 && sl < SLOT_COUNT) {
    const mins = SLOT_START_HOUR * 60 + sl * 30;
    const jsDay = (d + 1) % 7;
    let at = setMinutes(setHours(startOfDay(addDays(now, (jsDay - now.getDay() + 7) % 7)), Math.floor(mins / 60)), mins % 60);
    if (at <= now) at = addDays(at, 7);
    return { date: format(at, "yyyy-MM-dd"), time: format(at, "HH:mm"), suggested: true };
  }
  const tomorrow = setHours(startOfDay(addDays(now, 1)), 18);
  return { date: format(tomorrow, "yyyy-MM-dd"), time: "18:00", suggested: false };
}

export default function NewSessionPage() {
  return (
    <React.Suspense fallback={null}>
      <NewSessionForm />
    </React.Suspense>
  );
}

function NewSessionForm() {
  const group = useCurrentGroup();
  const users = useUserMap();
  const router = useRouter();
  const params = useSearchParams();
  const createSession = useStore((s) => s.createSession);
  const base = `/groups/${group.id}`;
  const members = activeMembers(group).map((m) => users[m.userId]).filter(Boolean);

  const [suggestion] = React.useState(() => initialWhen(params.get("day"), params.get("slot")));
  const [template, setTemplate] = React.useState<SessionTemplate>("retrieval");
  const [title, setTitle] = React.useState("");
  const [date, setDate] = React.useState(suggestion.date);
  const [time, setTime] = React.useState(suggestion.time);
  const [duration, setDuration] = React.useState(TEMPLATES.retrieval.defaultDuration);
  const [locationType, setLocationType] = React.useState<"video" | "place">("video");
  const [place, setPlace] = React.useState("");
  const [recurrence, setRecurrence] = React.useState<Recurrence>("none");
  const [agenda, setAgenda] = React.useState("");
  const [prep, setPrep] = React.useState<string[]>([]);
  const [prepDraft, setPrepDraft] = React.useState("");
  const [topics, setTopics] = React.useState<Record<string, string>>({});
  const [submitted, setSubmitted] = React.useState(false);
  const [now] = React.useState(() => Date.now());
  const titleRef = React.useRef<HTMLInputElement>(null);
  const dateRef = React.useRef<HTMLInputElement>(null);

  const start = date && time ? new Date(`${date}T${time}`) : null;
  const validStart = start && !Number.isNaN(+start) ? start : null;
  const exam = group.examDate ? new Date(group.examDate) : undefined;
  const dates = validStart ? seriesDates(validStart, recurrence, exam) : [];
  const isSuggested = suggestion.suggested && date === suggestion.date && time === suggestion.time;

  const errors = {
    title: !title.trim() ? "Give the session a short title." : undefined,
    date: !validStart
      ? "Pick a date."
      : +validStart < now
        ? "That time has already passed. Pick a later one."
        : recurrence !== "none" && dates.length === 0
          ? `That's after the exam on ${format(exam!, "EEE d MMM")}. Pick an earlier date, or make it a one-off.`
          : undefined,
  };

  const teachers = template === "jigsaw"
    ? members.filter((u) => topics[u.id]?.trim()).map((u) => ({ name: u.name, topic: topics[u.id].trim() }))
    : [];
  const steps = stepsFor(template, duration, teachers);

  const chooseTemplate = (t: SessionTemplate) => {
    setTemplate(t);
    setDuration(TEMPLATES[t].defaultDuration);
  };

  const addPrep = (text: string) => {
    const t = text.trim();
    if (!t || prep.some((p) => p.toLowerCase() === t.toLowerCase())) return;
    setPrep((p) => [...p, t]);
    setPrepDraft("");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (errors.title) return titleRef.current?.focus();
    if (errors.date || !validStart) return dateRef.current?.focus();

    const input = {
      groupId: group.id,
      title: title.trim(),
      template,
      startsAt: validStart.toISOString(),
      durationMin: duration,
      locationType,
      place: place.trim(),
      recurrence,
      agenda: agenda.trim(),
      prep,
      jigsawTopics:
        template === "jigsaw"
          ? Object.fromEntries(Object.entries(topics).map(([k, v]) => [k, v.trim()]).filter(([, v]) => v))
          : {},
    };
    let id: string;
    try {
      id = supabaseEnabled ? await createSessionInSupabase(input) : createSession(input);
    } catch {
      return;
    }
    toast.success("Session scheduled. Members will get an email.", {
      description: dates.length > 1 ? `${dates.length} sessions are on the calendar.` : undefined,
    });
    router.push(`/sessions/${id}`);
  };

  const suggestions = PREP_SUGGESTIONS[template].filter((s) => !prep.includes(s));
  const placeLabel = locationType === "video" ? "Video call" : place.trim() || "Place to be decided";

  return (
    <div className="stagger">
      <div className="mb-8">
        <Link
          href={`${base}/sessions`}
          className="mb-3 inline-flex items-center gap-1 rounded-md text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Sessions
        </Link>
        <h2 className="text-h2">Schedule a session</h2>
        <p className="mt-1 text-[0.9375rem] text-muted-foreground">Pick a format and a time. Everyone in {group.name} gets the details.</p>
      </div>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-12">
        <form onSubmit={submit} noValidate className="min-w-0 max-w-[640px] space-y-10">
          <FormSection id="sec-format" title="Format" description="Each format is built on how people actually remember things.">
            <ChoiceCards
              aria-label="Session format"
              value={template}
              onValueChange={chooseTemplate}
              options={(Object.keys(TEMPLATES) as SessionTemplate[]).map((t) => {
                const def = TEMPLATES[t];
                const Icon = TEMPLATE_ICON[t];
                return {
                  value: t,
                  title: (
                    <span className="inline-flex items-center gap-2">
                      <Icon className="size-4 text-teal-text" strokeWidth={2.2} aria-hidden />
                      {def.name}
                    </span>
                  ),
                  description: (
                    <>
                      {def.short}
                      <span className="mt-1 block text-xs text-subtle-foreground">Based on {def.research}</span>
                    </>
                  ),
                  aside: <span className="text-sm font-medium text-muted-foreground">{def.defaultDuration} min</span>,
                };
              })}
            />
            <Field label="Title" htmlFor="ns-title" error={submitted ? errors.title : undefined}>
              <Input
                ref={titleRef}
                id="ns-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={`e.g. ${TITLE_PLACEHOLDER[template]}`}
                aria-invalid={submitted && !!errors.title}
                autoComplete="off"
              />
            </Field>
          </FormSection>

          <FormSection id="sec-when" title="When">
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Date" htmlFor="ns-date">
                  <Input
                    ref={dateRef}
                    id="ns-date"
                    type="date"
                    value={date}
                    min={format(now, "yyyy-MM-dd")}
                    onChange={(e) => setDate(e.target.value)}
                    aria-invalid={submitted && !!errors.date}
                    aria-describedby={submitted && errors.date ? "ns-date-error" : undefined}
                  />
                </Field>
                <Field label="Start time" htmlFor="ns-time">
                  <Select id="ns-time" value={time} onValueChange={setTime} options={START_TIMES} />
                </Field>
              </div>
              {submitted && errors.date ? (
                <p id="ns-date-error" role="alert" className="text-sm font-medium text-destructive">
                  {errors.date}
                </p>
              ) : isSuggested ? (
                <p className="flex items-center gap-1.5 text-small text-teal-text">
                  <Sparkles className="size-4 shrink-0" aria-hidden />
                  Suggested time: everyone&rsquo;s free
                </p>
              ) : null}
            </div>
            <Field label="Duration, in minutes" hint={`${TEMPLATES[template].name} usually runs ${TEMPLATES[template].defaultDuration} min.`}>
              <Segmented
                aria-label="Duration in minutes"
                value={String(duration)}
                onValueChange={(v) => setDuration(Number(v))}
                options={DURATIONS.map((d) => ({ value: String(d), label: String(d) }))}
                className="flex w-full"
              />
            </Field>
            <Field label="Repeat">
              <Segmented
                aria-label="Repeat"
                value={recurrence}
                onValueChange={setRecurrence}
                options={(["none", "weekly", "twice-weekly"] as Recurrence[]).map((r) => ({ value: r, label: RECURRENCE_LABEL[r] }))}
                className="flex w-full"
              />
              {validStart && recurrence !== "none" && dates.length > 0 && (
                <p className="mt-1 flex items-start gap-2 text-sm leading-5 text-muted-foreground">
                  <Repeat className="mt-0.5 size-4 shrink-0" aria-hidden />
                  <span>
                    {recurrence === "twice-weekly"
                      ? `Every ${format(validStart, "EEEE")} and ${format(addDays(validStart, 3), "EEEE")}. `
                      : `Every ${format(validStart, "EEEE")}. `}
                    <span className="font-semibold text-foreground">
                      Creates {plural(dates.length, "session")}
                      {exam ? ` until the exam on ${format(exam, "EEE d MMM")}` : " over the next 6 weeks"}.
                    </span>
                    {!exam && " Add an exam date to the charter to run right up to it."}
                  </span>
                </p>
              )}
            </Field>
          </FormSection>

          <FormSection id="sec-where" title="Where">
            <Segmented
              aria-label="Location"
              value={locationType}
              onValueChange={setLocationType}
              options={[
                { value: "video", label: "Video call", icon: <Video /> },
                { value: "place", label: "In person", icon: <MapPin /> },
              ]}
              className="flex w-full"
            />
            {locationType === "video" ? (
              <p className="text-sm leading-5 text-muted-foreground">
                We&rsquo;ll create a Jitsi video link for you. No accounts or downloads, and anyone in the group can join from the session page.
              </p>
            ) : (
              <Field label="Place" htmlFor="ns-place" hint="Building and room, so nobody gets lost.">
                <Input id="ns-place" value={place} onChange={(e) => setPlace(e.target.value)} placeholder="e.g. Main Library, 2nd floor" />
              </Field>
            )}
          </FormSection>

          {template === "jigsaw" && (
            <FormSection
              id="sec-topics"
              title="Who teaches what"
              description="Each person prepares one subtopic and teaches it for about 10 minutes."
            >
              <ul className="divide-y divide-border rounded-[var(--radius-card)] border border-border bg-surface">
                {members.map((u, i) => (
                  <li key={u.id} className="flex items-center gap-3 px-3.5 py-2.5 sm:px-4">
                    <Avatar user={u} size="sm" />
                    <label htmlFor={`ns-topic-${u.id}`} className="w-20 shrink-0 truncate text-[0.9375rem] font-semibold sm:w-28">
                      {firstName(u.name)}
                    </label>
                    <Input
                      id={`ns-topic-${u.id}`}
                      value={topics[u.id] ?? ""}
                      onChange={(e) => setTopics((t) => ({ ...t, [u.id]: e.target.value }))}
                      placeholder={TOPIC_PLACEHOLDERS[i % TOPIC_PLACEHOLDERS.length]}
                      className="min-w-0"
                    />
                  </li>
                ))}
              </ul>
            </FormSection>
          )}

          <FormSection id="sec-plan" title="Plan">
            <Field label="Agenda" htmlFor="ns-agenda" optional hint="What you'll cover, so people can come ready.">
              <Textarea
                id="ns-agenda"
                rows={3}
                value={agenda}
                onChange={(e) => setAgenda(e.target.value)}
                placeholder="Graph representations, BFS and DFS. Then the hardest tree questions from the bank."
              />
            </Field>

            <div className="space-y-3">
              <div className="flex items-baseline justify-between gap-3">
                <label htmlFor="ns-prep" className="text-sm font-semibold">
                  Prep checklist
                </label>
                <span className="text-xs font-medium text-subtle-foreground">Optional</span>
              </div>
              {prep.length > 0 && (
                <ul className="divide-y divide-border rounded-[var(--radius-card)] border border-border bg-surface">
                  {prep.map((p) => (
                    <li key={p} className="animate-fade-in flex items-center gap-3 py-0.5 pl-4 pr-1">
                      <span className="size-[18px] shrink-0 rounded-[6px] border-[1.5px] border-border-strong" aria-hidden />
                      <span className="min-w-0 flex-1 text-[0.9375rem]">{p}</span>
                      <Button
                        variant="subtle"
                        size="icon"
                        className="size-11"
                        aria-label={`Remove “${p}”`}
                        onClick={() => setPrep((list) => list.filter((x) => x !== p))}
                      >
                        <X />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="flex gap-2">
                <Input
                  id="ns-prep"
                  value={prepDraft}
                  onChange={(e) => setPrepDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addPrep(prepDraft);
                    }
                  }}
                  placeholder="Something everyone does before the session"
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="size-11"
                  onClick={() => addPrep(prepDraft)}
                  disabled={!prepDraft.trim()}
                  aria-label="Add prep item"
                >
                  <Plus />
                </Button>
              </div>
              {suggestions.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => addPrep(s)}
                      className="pressable inline-flex min-h-10 items-center gap-1.5 rounded-full border border-dashed border-border-strong px-3.5 text-sm font-medium text-muted-foreground hover:border-foreground/40 hover:text-foreground"
                    >
                      <Plus className="size-3.5" aria-hidden />
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </FormSection>

          <div className="flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:items-center">
            <Button asChild variant="ghost" size="lg">
              <Link href={`${base}/sessions`}>Cancel</Link>
            </Button>
            <p className="text-sm text-muted-foreground sm:ml-auto">
              {dates.length > 1 ? `${plural(dates.length, "session")}, one email.` : "Everyone gets an email."}
            </p>
            <Button type="submit" size="lg">
              <CalendarDays /> Schedule session
            </Button>
          </div>
        </form>

        {/* What members will see */}
        <aside aria-label="Preview" className="hidden lg:block">
          <div className="sticky top-20">
            <p className="mb-3 text-sm font-semibold text-muted-foreground">What members will see</p>
            <Panel className="overflow-hidden">
              <div className="p-5">
                <TemplateBadge template={template} />
                <h3 className={cn("mt-2 text-h3", !title.trim() && "text-subtle-foreground")}>
                  {title.trim() || "Untitled session"}
                </h3>
                <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CalendarDays className="size-4 shrink-0" aria-hidden />
                    {validStart ? `${formatDay(validStart)}, ${timeRange({ startsAt: validStart.toISOString(), durationMin: duration })}` : "Pick a date"}
                  </li>
                  <li className="flex items-center gap-2">
                    <Clock className="size-4 shrink-0" aria-hidden />
                    {formatDuration(duration)}
                  </li>
                  <li className="flex min-w-0 items-center gap-2">
                    {locationType === "video" ? <Video className="size-4 shrink-0" aria-hidden /> : <MapPin className="size-4 shrink-0" aria-hidden />}
                    <span className="truncate">{placeLabel}</span>
                  </li>
                  {recurrence !== "none" && (
                    <li className="flex items-center gap-2">
                      <Repeat className="size-4 shrink-0" aria-hidden />
                      {RECURRENCE_LABEL[recurrence]}, {plural(dates.length, "session")}
                    </li>
                  )}
                </ul>
                {prep.length > 0 && (
                  <p className="mt-3 text-sm font-medium">
                    {plural(prep.length, "thing")} to do before
                  </p>
                )}
              </div>
              <div className="border-t border-border bg-surface-2/50 p-5">
                <p className="mb-3 text-sm font-semibold">How it runs</p>
                <StepsTimeline steps={steps} />
              </div>
            </Panel>
          </div>
        </aside>
      </div>
    </div>
  );
}

function FormSection({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="border-t border-border pt-8 first:border-t-0 first:pt-0">
      <h3 id={id} className="text-h3">
        {title}
      </h3>
      {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
      <div className="mt-5 space-y-5">{children}</div>
    </section>
  );
}
