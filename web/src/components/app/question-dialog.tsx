"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/overlays";
import { useStore } from "@/lib/store";
import type { ID, Question } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Add or edit a question. The form remounts every time the dialog opens. */
export function QuestionDialog({
  open,
  onOpenChange,
  groupId,
  topics,
  question,
  defaultTopic,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  groupId: ID;
  topics: string[];
  question?: Question;
  defaultTopic?: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title={question ? "Edit question" : "Add a question"}
        description={
          question ? undefined : "Write it the way you'd ask a friend. Questions you write yourself are the ones that stick."
        }
      >
        <QuestionForm
          groupId={groupId}
          topics={topics}
          question={question}
          defaultTopic={defaultTopic}
          onDone={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

type Errors = Partial<Record<"topic" | "prompt" | "answer", string>>;

function QuestionForm({
  groupId,
  topics,
  question,
  defaultTopic,
  onDone,
}: {
  groupId: ID;
  topics: string[];
  question?: Question;
  defaultTopic?: string;
  onDone: () => void;
}) {
  const addQuestion = useStore((s) => s.addQuestion);
  const updateQuestion = useStore((s) => s.updateQuestion);
  const [form, setForm] = React.useState({
    topic: question?.topic ?? defaultTopic ?? "",
    prompt: question?.prompt ?? "",
    answer: question?.answer ?? "",
    explanation: question?.explanation ?? "",
  });
  const [errors, setErrors] = React.useState<Errors>({});
  const id = React.useId();
  const promptRef = React.useRef<HTMLTextAreaElement>(null);
  const topicRef = React.useRef<HTMLInputElement>(null);
  const answerRef = React.useRef<HTMLTextAreaElement>(null);

  const set = (k: keyof typeof form, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (k in errors) setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const topicRaw = form.topic.trim().replace(/\s+/g, " ");
    // Reuse an existing topic's spelling so "trees" and "Trees" don't split
    const topic = topics.find((t) => t.toLowerCase() === topicRaw.toLowerCase()) ?? topicRaw;
    const next: Errors = {
      topic: topic ? (topic.length > 40 ? "Keep the topic under 40 characters." : undefined) : "Pick or type a topic.",
      prompt: form.prompt.trim() ? undefined : "Write the question.",
      answer: form.answer.trim() ? undefined : "Add the answer, so the quiz can check it.",
    };
    setErrors(next);
    if (next.topic) return topicRef.current?.focus();
    if (next.prompt) return promptRef.current?.focus();
    if (next.answer) return answerRef.current?.focus();

    const payload = {
      topic,
      prompt: form.prompt.trim(),
      answer: form.answer.trim(),
      explanation: form.explanation.trim() || undefined,
    };
    if (question) {
      updateQuestion(question.id, payload);
      toast.success("Question updated");
    } else {
      addQuestion({ groupId, ...payload });
      toast.success("Thanks for adding a question!", { description: "Your group can quiz on it now." });
    }
    onDone();
  };

  const suggestions = topics.filter((t) => t !== form.topic.trim()).slice(0, 8);

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <Field label="Topic" htmlFor={`${id}-topic`} error={errors.topic}>
        <Input
          ref={topicRef}
          id={`${id}-topic`}
          list={`${id}-topics`}
          value={form.topic}
          onChange={(e) => set("topic", e.target.value)}
          placeholder="e.g. Trees"
          autoComplete="off"
          className="[&::-webkit-calendar-picker-indicator]:hidden"
          aria-invalid={Boolean(errors.topic)}
          maxLength={60}
        />
        <datalist id={`${id}-topics`}>
          {topics.map((t) => (
            <option key={t} value={t} />
          ))}
        </datalist>
        {suggestions.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1" role="group" aria-label="Existing topics">
            {suggestions.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => set("topic", t)}
                className={cn(
                  "pressable relative h-8 rounded-full border border-border-strong bg-surface px-3 text-[0.8125rem] font-semibold text-muted-foreground hover:border-foreground/40 hover:text-foreground",
                  "before:absolute before:-inset-y-1.5 before:inset-x-0",
                )}
              >
                {t}
              </button>
            ))}
          </div>
        )}
      </Field>

      <Field label="Question" htmlFor={`${id}-prompt`} error={errors.prompt}>
        <Textarea
          ref={promptRef}
          id={`${id}-prompt`}
          rows={3}
          value={form.prompt}
          onChange={(e) => set("prompt", e.target.value)}
          placeholder="What is the worst-case time to search a BST?"
          aria-invalid={Boolean(errors.prompt)}
          maxLength={600}
        />
      </Field>

      <Field label="Answer" htmlFor={`${id}-answer`} error={errors.answer}>
        <Textarea
          ref={answerRef}
          id={`${id}-answer`}
          rows={2}
          className="min-h-20"
          value={form.answer}
          onChange={(e) => set("answer", e.target.value)}
          placeholder="Short and checkable"
          aria-invalid={Boolean(errors.answer)}
          maxLength={600}
        />
      </Field>

      <Field
        label="Explanation"
        htmlFor={`${id}-explanation`}
        optional
        hint="Why is this the answer? It helps whoever gets it wrong next."
      >
        <Textarea
          id={`${id}-explanation`}
          rows={2}
          className="min-h-20"
          value={form.explanation}
          onChange={(e) => set("explanation", e.target.value)}
          maxLength={1000}
        />
      </Field>

      <DialogFooter>
        <Button variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit">{question ? "Save changes" : "Add question"}</Button>
      </DialogFooter>
    </form>
  );
}
