"use client";

import * as React from "react";
import Link from "next/link";
import { CircleCheck, Ellipsis, LibraryBig, Pencil, Plus, RotateCcw, Search, SearchX, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AnswerReveal } from "@/components/app/question-answer";
import { QuestionDialog } from "@/components/app/question-dialog";
import { topicCounts, topicProgress, useGroupQuestions, useMyResults } from "@/components/app/question-logic";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/controls";
import { Input } from "@/components/ui/field";
import {
  ConfirmDialog,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/overlays";
import { EmptyState, Panel, Progress } from "@/components/ui/surface";
import { useCurrentGroup } from "@/lib/group-context";
import { activeMembers, useMe, useUserMap } from "@/lib/queries";
import { useStore } from "@/lib/store";
import type { ID, Question, User } from "@/lib/types";
import { cn, firstName, formatRelative, plural } from "@/lib/utils";

export default function QuestionsPage() {
  const group = useCurrentGroup();
  const me = useMe();
  const users = useUserMap();
  const questions = useGroupQuestions(group.id);
  const results = useMyResults(me.id);
  const deleteQuestion = useStore((s) => s.deleteQuestion);

  const [topic, setTopic] = React.useState<string | null>(null);
  const [author, setAuthor] = React.useState("anyone");
  const [query, setQuery] = React.useState("");
  const [editing, setEditing] = React.useState<{ open: boolean; question?: Question }>({ open: false });
  const [toDelete, setToDelete] = React.useState<Question | null>(null);

  const topics = React.useMemo(() => topicCounts(questions), [questions]);
  // A deleted topic falls back to "All"
  const activeTopic = topic && topics.some((t) => t.topic === topic) ? topic : null;
  const base = `/groups/${group.id}`;

  const authors = React.useMemo(() => {
    const ids = new Set<ID>(activeMembers(group).map((m) => m.userId));
    for (const q of questions) ids.add(q.createdBy);
    ids.delete(me.id);
    return Array.from(ids)
      .map((id) => users[id])
      .filter((u): u is User => Boolean(u))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [group, questions, users, me.id]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return questions.filter(
      (x) =>
        (!activeTopic || x.topic === activeTopic) &&
        (author === "anyone" || (author === "me" ? x.createdBy === me.id : x.createdBy === author)) &&
        (!q || x.prompt.toLowerCase().includes(q) || x.topic.toLowerCase().includes(q)),
    );
  }, [questions, activeTopic, author, query, me.id]);

  const filtering = Boolean(activeTopic || author !== "anyone" || query.trim());
  const clearFilters = () => {
    setTopic(null);
    setAuthor("anyone");
    setQuery("");
  };

  const openAdd = () => setEditing({ open: true });

  return (
    <div className="stagger space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-h2">Question bank</h2>
          <p className="mt-1 text-[0.9375rem] leading-6 text-muted-foreground">
            {questions.length
              ? `${plural(questions.length, "question")} across ${plural(topics.length, "topic")}, written by your group.`
              : "Questions your group writes for each other."}
          </p>
        </div>
        <div className="grid shrink-0 grid-cols-2 gap-2 sm:flex">
          <Button asChild>
            <Link href={`${base}/questions/quiz`}>
              <Sparkles /> Quiz me
            </Link>
          </Button>
          <Button variant="outline" onClick={openAdd}>
            <Plus /> Add question
          </Button>
        </div>
      </div>

      {questions.length === 0 ? (
        <EmptyState
          icon={<LibraryBig />}
          title="Start your question bank"
          description="Add a question from this week's reading. Writing questions is one of the best ways to learn, and it gives everyone something to quiz on."
          action={
            <Button onClick={openAdd}>
              <Plus /> Add the first question
            </Button>
          }
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
          <div className="min-w-0 space-y-4">
            {/* Filters */}
            <div
              role="group"
              aria-label="Filter by topic"
              className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 py-1 sm:mx-0 sm:flex-wrap sm:px-0"
            >
              <TopicChip label="All" count={questions.length} pressed={!activeTopic} onClick={() => setTopic(null)} />
              {topics.map((t) => (
                <TopicChip
                  key={t.topic}
                  label={t.topic}
                  count={t.count}
                  pressed={activeTopic === t.topic}
                  onClick={() => setTopic(activeTopic === t.topic ? null : t.topic)}
                />
              ))}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-subtle-foreground" />
                <Input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search questions"
                  aria-label="Search questions"
                  className="pl-10"
                />
              </div>
              <Select
                aria-label="Written by"
                value={author}
                onValueChange={setAuthor}
                className="sm:w-52"
                options={[
                  { value: "anyone", label: "Written by anyone" },
                  { value: "me", label: "Written by me" },
                  ...authors.map((u) => ({ value: u.id, label: u.name })),
                ]}
              />
            </div>

            <div className="flex min-h-6 items-center justify-between gap-3 text-sm" aria-live="polite">
              <span className="text-muted-foreground">
                {filtering
                  ? `Showing ${filtered.length} of ${plural(questions.length, "question")}`
                  : plural(questions.length, "question")}
              </span>
              {filtering && (
                <Button variant="link" className="h-11 sm:h-6" onClick={clearFilters}>
                  Clear filters
                </Button>
              )}
            </div>

            {filtered.length ? (
              <Panel as="ul" className="divide-y divide-border">
                {filtered.map((q) => (
                  <QuestionItem
                    key={q.id}
                    question={q}
                    author={users[q.createdBy]}
                    mine={q.createdBy === me.id}
                    result={results.get(q.id)}
                    onEdit={() => setEditing({ open: true, question: q })}
                    onDelete={() => setToDelete(q)}
                  />
                ))}
              </Panel>
            ) : (
              <EmptyState
                icon={<SearchX />}
                title="No questions match"
                description="Try another topic, author or search term."
                action={
                  <Button variant="outline" onClick={clearFilters}>
                    Clear filters
                  </Button>
                }
              />
            )}
          </div>

          <ProgressPanel questions={questions} results={results} base={base} />
        </div>
      )}

      <QuestionDialog
        open={editing.open}
        onOpenChange={(open) => setEditing((s) => ({ ...s, open }))}
        groupId={group.id}
        topics={topics.map((t) => t.topic)}
        question={editing.question}
        defaultTopic={activeTopic ?? undefined}
      />
      <ConfirmDialog
        open={Boolean(toDelete)}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Delete this question?"
        description="It will be removed from the bank and from everyone's quizzes. This can't be undone."
        confirmLabel="Delete question"
        destructive
        onConfirm={() => {
          if (!toDelete) return;
          deleteQuestion(toDelete.id);
          setToDelete(null);
          toast("Question deleted");
        }}
      />
    </div>
  );
}

function TopicChip({
  label,
  count,
  pressed,
  onClick,
}: {
  label: string;
  count: number;
  pressed: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        "pressable relative inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-sm font-semibold",
        "before:absolute before:-inset-y-1 before:inset-x-0",
        pressed
          ? "border-foreground bg-foreground text-background"
          : "border-border-strong bg-surface text-muted-foreground hover:border-foreground/40 hover:text-foreground",
      )}
    >
      {label}
      <span className={cn("tabular-nums", pressed ? "opacity-75" : "text-subtle-foreground")}>{count}</span>
    </button>
  );
}

function QuestionItem({
  question: q,
  author,
  mine,
  result,
  onEdit,
  onDelete,
}: {
  question: Question;
  author?: User;
  mine: boolean;
  result?: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <li className="px-4 py-4 sm:px-5">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <Badge variant="neutral">{q.topic}</Badge>
            {result === true && (
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-teal-text">
                <CircleCheck className="size-4" /> Got it
              </span>
            )}
            {result === false && (
              <span className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground">
                <RotateCcw className="size-3.5" /> Not yet
              </span>
            )}
          </div>
          <h3 className="mt-2 whitespace-pre-line text-[1.0625rem] font-semibold leading-7 tracking-[-0.01em]">{q.prompt}</h3>
        </div>
        {mine && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="subtle" size="icon" className="-mr-2 -mt-1 size-11 sm:size-9" aria-label="Question options">
                <Ellipsis />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onSelect={onEdit}>
                <Pencil /> Edit question
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem destructive onSelect={onDelete}>
                <Trash2 /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      <AnswerReveal
        question={q}
        className="mt-1"
        aside={
          <span className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
            <Avatar user={author} size="xs" />
            <span className="truncate">
              <span className="font-semibold text-foreground">{mine ? "You" : firstName(author?.name ?? "A member")}</span>
              <span className="hidden sm:inline"> · {formatRelative(q.createdAt)}</span>
            </span>
          </span>
        }
      />
    </li>
  );
}

function ProgressPanel({
  questions,
  results,
  base,
}: {
  questions: Question[];
  results: Map<ID, boolean>;
  base: string;
}) {
  const rows = topicProgress(questions, results);
  const gotIt = rows.reduce((n, r) => n + r.gotIt, 0);
  const tried = rows.reduce((n, r) => n + r.tried, 0);
  const remaining = questions.length - gotIt;

  return (
    <aside className="lg:sticky lg:top-[73px]">
      <Panel className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-h3">Your progress</h3>
            <p className="mt-0.5 text-sm leading-5 text-muted-foreground">
              {remaining === 0
                ? "You've got every question. Brilliant."
                : tried
                  ? `You've got ${gotIt} of ${questions.length} so far. Every “Not yet” is just next on the list.`
                  : "Take a quiz to see what's sticking. Only you see this."}
            </p>
          </div>
          {remaining === 0 && (
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-gold text-gold-foreground" aria-hidden>
              <Sparkles className="size-[18px]" />
            </span>
          )}
        </div>
        <ul className="mt-5 space-y-4">
          {rows.map((r) => (
            <li key={r.topic}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="min-w-0 truncate font-semibold">{r.topic}</span>
                <span className="shrink-0 text-muted-foreground">
                  {r.gotIt} of {r.total} got it
                </span>
              </div>
              <Progress
                value={(r.gotIt / r.total) * 100}
                label={`${r.topic}: ${r.gotIt} of ${r.total} got it`}
                className="mt-1.5"
              />
            </li>
          ))}
        </ul>
        {remaining > 0 && (
          <Button asChild variant="teal" className="mt-6 w-full">
            <Link href={`${base}/questions/quiz?only=new`}>
              {tried ? `Practise the ${remaining} left` : "Start a quiz"}
            </Link>
          </Button>
        )}
      </Panel>
    </aside>
  );
}
