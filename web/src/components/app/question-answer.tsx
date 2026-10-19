"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Question } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Answers stay hidden until the person asks. Retrieval first, then check. */
export function AnswerReveal({
  question,
  aside,
  className,
}: {
  question: Pick<Question, "answer" | "explanation">;
  aside?: React.ReactNode;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const id = React.useId();
  return (
    <div className={className}>
      <div className="flex items-center justify-between gap-3">
        <Button
          variant="subtle"
          size="sm"
          className="-ml-3 h-11 text-foreground sm:h-9"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <EyeOff /> : <Eye />}
          {open ? "Hide answer" : "Show answer"}
        </Button>
        {aside}
      </div>
      <div
        id={id}
        hidden={!open}
        className="mt-2 animate-[fade-in_180ms_var(--ease-out)] rounded-xl border-l-[3px] border-teal bg-surface-2 py-3 pl-4 pr-4"
      >
        <p className="text-xs font-semibold text-muted-foreground">Answer</p>
        <p className="mt-0.5 whitespace-pre-line text-[0.9375rem] font-semibold leading-6">{question.answer}</p>
        {question.explanation && (
          <p className="mt-2 whitespace-pre-line text-sm leading-6 text-muted-foreground">{question.explanation}</p>
        )}
      </div>
    </div>
  );
}

/** Small keyboard hint inside a button. Inherits the button's colour; hidden on touch screens. */
export function KeyHint({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <kbd
      aria-hidden
      className={cn(
        "ml-1 hidden h-5 min-w-5 items-center justify-center rounded-md border border-current/30 bg-current/10 px-1 font-sans text-[11px] font-semibold opacity-80 pointer-fine:inline-flex",
        className,
      )}
    >
      {children}
    </kbd>
  );
}
