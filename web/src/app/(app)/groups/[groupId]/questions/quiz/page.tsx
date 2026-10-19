"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Check, Eye, LibraryBig, Play, RotateCcw, Sparkles, X } from "lucide-react";
import { AnswerReveal, KeyHint } from "@/components/app/question-answer";
import { shuffle, topicCounts, useGroupQuestions, useMyResults } from "@/components/app/question-logic";
import { QuizScoreRing } from "@/components/app/quiz-score-ring";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Segmented, Switch } from "@/components/ui/controls";
import { Label, Textarea } from "@/components/ui/field";
import { EmptyState, Panel, Progress } from "@/components/ui/surface";
import { useCurrentGroup } from "@/lib/group-context";
import { useMe, useUserMap } from "@/lib/queries";
import { useStore } from "@/lib/store";
import type { ID, Question } from "@/lib/types";
import { cn, firstName, plural } from "@/lib/utils";

type Phase = "setup" | "play" | "done";
type Count = "5" | "10" | "20" | "all";
type Graded = { id: ID; correct: boolean };

export default function QuizPage() {
  return (
    <React.Suspense fallback={null}>
      <Quiz />
    </React.Suspense>
  );
}

function Quiz() {
  const group = useCurrentGroup();
  const me = useMe();
  const users = useUserMap();
  const params = useSearchParams();
  const questions = useGroupQuestions(group.id);
  const results = useMyResults(me.id);
  const recordAttempt = useStore((s) => s.recordAttempt);
  const backHref = `/groups/${group.id}/questions`;

  const [phase, setPhase] = React.useState<Phase>("setup");
  const [deck, setDeck] = React.useState<Question[]>([]);
  const [index, setIndex] = React.useState(0);
  const [revealed, setRevealed] = React.useState(false);
  const [typed, setTyped] = React.useState("");
  const [graded, setGraded] = React.useState<Graded[]>([]);
  // Pointer-driven steps get a short transition; keyboard steps swap instantly.
  const [motion, setMotion] = React.useState(false);

  const focusNext = React.useRef<"prompt" | "answer" | "results" | null>(null);
  const promptRef = React.useRef<HTMLHeadingElement>(null);
  const answerRef = React.useRef<HTMLDivElement>(null);
  const resultsRef = React.useRef<HTMLHeadingElement>(null);

  const current = deck[index];

  const start = (qs: Question[]) => {
    setDeck(qs);
    setIndex(0);
    setRevealed(false);
    setTyped("");
    setGraded([]);
    setMotion(false);
    setPhase("play");
    focusNext.current = "prompt";
    window.scrollTo({ top: 0 });
  };

  const reveal = (withMotion: boolean) => {
    if (phase !== "play" || revealed) return;
    setRevealed(true);
    setMotion(withMotion);
    focusNext.current = "answer";
  };

  const grade = (correct: boolean, withMotion: boolean) => {
    if (phase !== "play" || !revealed || !current) return;
    recordAttempt(current.id, correct);
    setGraded((g) => [...g, { id: current.id, correct }]);
    setMotion(withMotion);
    if (index + 1 >= deck.length) {
      setPhase("done");
      focusNext.current = "results";
    } else {
      setIndex(index + 1);
      setRevealed(false);
      setTyped("");
      focusNext.current = "prompt";
    }
    window.scrollTo({ top: 0 });
  };

  // Move focus where the person's attention goes next
  React.useEffect(() => {
    const target = focusNext.current;
    if (!target) return;
    focusNext.current = null;
    const el = target === "prompt" ? promptRef.current : target === "answer" ? answerRef.current : resultsRef.current;
    el?.focus({ preventScroll: target !== "answer" });
  }, [phase, index, revealed]);

  const onKey = React.useEffectEvent((e: KeyboardEvent) => {
    if (e.defaultPrevented || e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
    const t = e.target as HTMLElement | null;
    if (t?.closest("input, textarea, select, [contenteditable='true'], [role='dialog'], [role='menu']")) return;
    if (!revealed) {
      // Let a focused button handle its own Space/Enter
      if ((e.key === " " || e.key === "Enter") && !t?.closest("button, a")) {
        e.preventDefault();
        reveal(false);
      }
    } else if (e.key === "1" || e.key === "2") {
      e.preventDefault();
      grade(e.key === "2", false);
    }
  });

  React.useEffect(() => {
    if (phase !== "play") return;
    const handler = (e: KeyboardEvent) => onKey(e);
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [phase]);

  const answered = graded.length;

  return (
    <div className="flex min-h-[calc(100dvh-3.5rem)] flex-col lg:min-h-dvh">
      <header className="sticky top-14 z-20 border-b border-border bg-background/90 backdrop-blur-md lg:top-0">
        <div className="mx-auto flex h-14 w-full max-w-2xl items-center gap-2 px-4">
          <Button asChild variant="subtle" size="icon" className="-ml-3 size-11">
            <Link href={backHref} aria-label="Exit quiz, back to questions">
              <X />
            </Link>
          </Button>
          <p className="min-w-0 flex-1 truncate text-[0.9375rem] font-bold">
            Quiz <span className="font-medium text-muted-foreground">· {group.name}</span>
          </p>
          {phase === "play" && (
            <p className="shrink-0 text-sm font-semibold tabular-nums">
              {index + 1} of {deck.length}
            </p>
          )}
        </div>
        {phase === "play" && (
          <div
            role="progressbar"
            aria-label="Quiz progress"
            aria-valuemin={0}
            aria-valuemax={deck.length}
            aria-valuenow={answered}
            aria-valuetext={`${answered} of ${deck.length} answered`}
            className="h-[3px]"
          >
            <div
              className="h-full rounded-r-full bg-teal transition-[width] duration-[250ms] ease-[var(--ease-out)]"
              style={{ width: `${(answered / Math.max(1, deck.length)) * 100}%` }}
            />
          </div>
        )}
      </header>

      {phase === "setup" && (
        <Setup
          questions={questions}
          results={results}
          initialTopic={params.get("topic")}
          initialOnlyNew={params.get("only") === "new"}
          backHref={backHref}
          onStart={start}
        />
      )}

      {phase === "play" && current && (
        <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:py-14">
          <article
            key={index}
            aria-labelledby="quiz-prompt"
            className={cn(motion && !revealed && "animate-[rise_220ms_var(--ease-out)_both]")}
          >
            <div className="flex items-center justify-between gap-3">
              <Badge variant="neutral" size="md">
                {current.topic}
              </Badge>
              <span className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
                <Avatar user={users[current.createdBy]} size="xs" />
                <span className="truncate">
                  From {current.createdBy === me.id ? "you" : firstName(users[current.createdBy]?.name ?? "a member")}
                </span>
              </span>
            </div>
            <h2
              id="quiz-prompt"
              ref={promptRef}
              tabIndex={-1}
              className="mt-6 whitespace-pre-line text-[1.5rem] font-bold leading-8 tracking-[-0.02em] outline-none sm:text-[1.875rem] sm:leading-10"
            >
              {current.prompt}
            </h2>

            {!revealed ? (
              <div className="mt-8">
                <Label htmlFor="quiz-typed" className="sr-only">
                  Your answer, optional
                </Label>
                <Textarea
                  id="quiz-typed"
                  rows={3}
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault();
                      reveal(false);
                    } else if (e.key === "Escape") {
                      e.currentTarget.blur();
                    }
                  }}
                  placeholder="Type your answer (optional), or just think it"
                />
                <Button size="lg" className="mt-4 h-14 w-full text-base" onClick={(e) => reveal(e.detail > 0)}>
                  <Eye /> Reveal answer <KeyHint>Space</KeyHint>
                </Button>
              </div>
            ) : (
              <div className={cn("mt-8", motion && "animate-[fade-in_180ms_var(--ease-out)]")}>
                {typed.trim() && (
                  <div className="mb-3 rounded-2xl border border-dashed border-border-strong px-5 py-3.5">
                    <p className="text-xs font-semibold text-muted-foreground">You wrote</p>
                    <p className="mt-0.5 whitespace-pre-line text-[0.9375rem] leading-6">{typed.trim()}</p>
                  </div>
                )}
                <div ref={answerRef} tabIndex={-1} className="rounded-2xl bg-teal-soft px-5 py-4 outline-none">
                  <p className="text-sm font-bold text-teal-text">Answer</p>
                  <p className="mt-1 whitespace-pre-line text-lg font-semibold leading-7">{current.answer}</p>
                  {current.explanation && (
                    <p className="mt-3 whitespace-pre-line text-[0.9375rem] leading-6 text-muted-foreground">
                      {current.explanation}
                    </p>
                  )}
                </div>
                <p id="grade-label" className="mt-8 text-center text-sm font-semibold text-muted-foreground">
                  How did it go?
                </p>
                <div role="group" aria-labelledby="grade-label" className="mt-3 grid grid-cols-2 gap-3">
                  <Button variant="outline" size="lg" className="h-14 text-base" onClick={(e) => grade(false, e.detail > 0)}>
                    <RotateCcw /> Not yet <KeyHint>1</KeyHint>
                  </Button>
                  <Button variant="teal" size="lg" className="h-14 text-base" onClick={(e) => grade(true, e.detail > 0)}>
                    <Check /> Got it <KeyHint>2</KeyHint>
                  </Button>
                </div>
              </div>
            )}
          </article>
        </div>
      )}

      {phase === "done" && (
        <Results
          deck={deck}
          graded={graded}
          headingRef={resultsRef}
          backHref={backHref}
          onRetry={(missed) => start(shuffle(missed))}
          onNew={() => {
            setPhase("setup");
            window.scrollTo({ top: 0 });
          }}
        />
      )}
    </div>
  );
}

/* ------------------------------------ Setup ------------------------------------ */

function Setup({
  questions,
  results,
  initialTopic,
  initialOnlyNew,
  backHref,
  onStart,
}: {
  questions: Question[];
  results: Map<ID, boolean>;
  initialTopic: string | null;
  initialOnlyNew: boolean;
  backHref: string;
  onStart: (qs: Question[]) => void;
}) {
  const topics = React.useMemo(() => topicCounts(questions), [questions]);
  const [selected, setSelected] = React.useState<Set<string>>(() =>
    initialTopic && topics.some((t) => t.topic === initialTopic)
      ? new Set([initialTopic])
      : new Set(topics.map((t) => t.topic)),
  );
  const [count, setCount] = React.useState<Count>("10");
  const [onlyNew, setOnlyNew] = React.useState(initialOnlyNew);

  if (!questions.length) {
    return (
      <div className="mx-auto w-full max-w-xl px-4 py-12">
        <EmptyState
          icon={<LibraryBig />}
          title="Nothing to quiz on yet"
          description="Add a few questions to the bank first. Writing them is great practice too."
          action={
            <Button asChild>
              <Link href={backHref}>Go to the question bank</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const inTopics = questions.filter((q) => selected.has(q.topic));
  const notYet = inTopics.filter((q) => results.get(q.id) !== true);
  const pool = onlyNew ? notYet : inTopics;
  const n = count === "all" ? pool.length : Math.min(Number(count), pool.length);
  const allSelected = selected.size === topics.length;

  const toggle = (t: string) =>
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });

  let summary: string;
  if (!selected.size) summary = "Pick at least one topic.";
  else if (!pool.length)
    summary = onlyNew
      ? "You've got every question in these topics. Turn off the filter to go again."
      : "No questions in these topics yet.";
  else if (count !== "all" && pool.length < Number(count))
    summary = `Only ${pool.length} match, so you'll get all of them.`;
  else summary = `${plural(n, "question")}, in a random order.`;

  return (
    <div className="stagger mx-auto w-full max-w-xl px-4 py-8 sm:py-14">
      <div>
        <h1 className="text-h1">Quiz yourself</h1>
        <p className="mt-2 text-body text-muted-foreground">
          Try to answer before you look. Pulling it from memory is what makes it stick.
        </p>
      </div>

      <section className="mt-9" aria-labelledby="quiz-topics">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="quiz-topics" className="text-[0.9375rem] font-bold">
            Topics
          </h2>
          {!allSelected && (
            <Button variant="link" className="h-11 text-sm sm:h-6" onClick={() => setSelected(new Set(topics.map((t) => t.topic)))}>
              Select all
            </Button>
          )}
        </div>
        <div role="group" aria-labelledby="quiz-topics" className="mt-3 flex flex-wrap gap-2">
          {topics.map((t) => {
            const on = selected.has(t.topic);
            return (
              <button
                key={t.topic}
                type="button"
                aria-pressed={on}
                onClick={() => toggle(t.topic)}
                className={cn(
                  "pressable inline-flex h-11 items-center gap-2 rounded-full border px-4 text-[0.9375rem] font-semibold",
                  on
                    ? "border-foreground bg-foreground text-background"
                    : "border-border-strong bg-surface text-muted-foreground hover:border-foreground/40 hover:text-foreground",
                )}
              >
                {on && <Check className="size-4" strokeWidth={2.6} />}
                {t.topic}
                <span className={cn("tabular-nums", on ? "opacity-70" : "text-subtle-foreground")}>{t.count}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-[0.9375rem] font-bold">How many questions</h2>
        <Segmented<Count>
          aria-label="How many questions"
          value={count}
          onValueChange={setCount}
          className="mt-3 flex w-full"
          options={[
            { value: "5", label: "5" },
            { value: "10", label: "10" },
            { value: "20", label: "20" },
            { value: "all", label: "All" },
          ]}
        />
      </section>

      <label
        htmlFor="quiz-only-new"
        className="mt-8 flex cursor-pointer items-center gap-4 rounded-2xl border border-border bg-surface p-4"
      >
        <span className="min-w-0 flex-1">
          <span className="block font-semibold">Only ones I haven&rsquo;t got yet</span>
          <span className="mt-0.5 block text-sm text-muted-foreground">
            {notYet.length
              ? `${plural(notYet.length, "question")} in these topics`
              : "You've got them all. Nice."}
          </span>
        </span>
        <Switch id="quiz-only-new" checked={onlyNew} onCheckedChange={setOnlyNew} />
      </label>

      <div className="mt-9">
        <Button
          size="lg"
          className="h-14 w-full text-base"
          disabled={!n}
          onClick={() => onStart(shuffle(pool).slice(0, n))}
        >
          <Play /> Start quiz
        </Button>
        <p className="mt-3 text-center text-sm text-muted-foreground" aria-live="polite">
          {summary}
        </p>
      </div>
    </div>
  );
}

/* ----------------------------------- Results ----------------------------------- */

function scoreCopy(correct: number, total: number) {
  const r = total ? correct / total : 0;
  if (correct === total) return { headline: `You got all ${total}. Brilliant work.`, sub: "That's really sticking. Come back in a few days to keep it fresh." };
  if (r >= 0.8) return { headline: `You got ${correct} of ${total}. Brilliant work.`, sub: "Almost all of it is sticking. A quick look at the rest and you're there." };
  if (r >= 0.5) return { headline: `You got ${correct} of ${total}. Nice work.`, sub: "The ones marked Not yet are your next steps. A second pass usually makes them click." };
  if (correct > 0) return { headline: `You got ${correct} of ${total}. Good start.`, sub: "Now you know exactly what to review. Go over the answers below, then try them again." };
  return { headline: `You've found what to focus on.`, sub: "Not yet just means not yet. Read through the answers below, then give them another go." };
}

function Results({
  deck,
  graded,
  headingRef,
  backHref,
  onRetry,
  onNew,
}: {
  deck: Question[];
  graded: Graded[];
  headingRef: React.Ref<HTMLHeadingElement>;
  backHref: string;
  onRetry: (missed: Question[]) => void;
  onNew: () => void;
}) {
  const correctIds = new Set(graded.filter((g) => g.correct).map((g) => g.id));
  const total = deck.length;
  const correct = deck.filter((q) => correctIds.has(q.id)).length;
  const missed = deck.filter((q) => !correctIds.has(q.id));
  const great = total > 0 && correct / total >= 0.8;
  const { headline, sub } = scoreCopy(correct, total);

  const byTopic = topicCounts(deck).map(({ topic, count }) => ({
    topic,
    total: count,
    gotIt: deck.filter((q) => q.topic === topic && correctIds.has(q.id)).length,
  }));

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 px-4 py-8 sm:py-12">
      <section className="flex animate-[pop_240ms_var(--ease-out)] flex-col items-center gap-6 rounded-[1.5rem] bg-brand-blue px-6 py-8 text-center text-brand-cream sm:flex-row sm:gap-8 sm:p-8 sm:text-left">
        <QuizScoreRing correct={correct} total={total} celebrate={great} size={152}>
          <span className="block text-[2.5rem] font-bold leading-none tracking-tight">{correct}</span>
          <span className="mt-1 block text-sm font-semibold text-brand-cream/70">of {total}</span>
        </QuizScoreRing>
        <div className="min-w-0">
          {great && (
            <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-brand-gold px-3 py-1 text-xs font-bold text-brand-blue">
              <Sparkles className="size-3.5" /> Great session
            </span>
          )}
          <h1 ref={headingRef} tabIndex={-1} className="text-h1 outline-none">
            {headline}
          </h1>
          <p className="mt-2 text-[0.9375rem] leading-6 text-brand-cream/80">{sub}</p>
        </div>
      </section>

      <div className="flex flex-col gap-2 sm:flex-row">
        {missed.length > 0 && (
          <Button size="lg" variant="teal" className="sm:flex-1" onClick={() => onRetry(missed)}>
            <RotateCcw /> Quiz the ones I missed
          </Button>
        )}
        <Button asChild size="lg" variant={missed.length ? "outline" : "primary"} className="sm:flex-1">
          <Link href={backHref}>Back to questions</Link>
        </Button>
        <Button size="lg" variant="ghost" onClick={onNew}>
          New quiz
        </Button>
      </div>

      {byTopic.length > 1 && (
        <Panel className="p-5 sm:p-6">
          <h2 className="text-h3">By topic</h2>
          <ul className="mt-4 space-y-4">
            {byTopic.map((t) => (
              <li key={t.topic}>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="min-w-0 truncate font-semibold">{t.topic}</span>
                  <span className="shrink-0 text-muted-foreground">
                    {t.gotIt} of {t.total} got it
                  </span>
                </div>
                <Progress value={(t.gotIt / t.total) * 100} label={`${t.topic}: ${t.gotIt} of ${t.total} got it`} className="mt-1.5" />
              </li>
            ))}
          </ul>
        </Panel>
      )}

      {missed.length > 0 && (
        <Panel>
          <div className="px-5 pt-5 sm:px-6">
            <h2 className="text-h3">Worth another look</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {missed.length === 1 ? "The one you marked Not yet." : `The ${missed.length} you marked Not yet.`}
            </p>
          </div>
          <ul className="mt-2 divide-y divide-border">
            {missed.map((q) => (
              <li key={q.id} className="px-5 py-4 sm:px-6">
                <Badge variant="neutral">{q.topic}</Badge>
                <h3 className="mt-2 whitespace-pre-line text-base font-semibold leading-6">{q.prompt}</h3>
                <AnswerReveal question={q} className="mt-1" />
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </div>
  );
}
