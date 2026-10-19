"use client";

import * as React from "react";
import * as RadioPrimitive from "@radix-ui/react-radio-group";
import { Lock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/controls";
import { Field, Textarea } from "@/components/ui/field";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/overlays";
import { useStore } from "@/lib/store";
import type { Retro, Session } from "@/lib/types";
import { cn } from "@/lib/utils";

export const RATING_LABELS = ["Not useful", "A little", "Okay", "Useful", "Very useful"] as const;

const BALANCE_OPTIONS: { value: Retro["balanced"]; label: string }[] = [
  { value: "yes", label: "Yes" },
  { value: "somewhat", label: "Somewhat" },
  { value: "no", label: "No" },
];

export function RetroDialog({
  session,
  open,
  onOpenChange,
  onDone,
}: {
  session: Session;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onDone?: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title="How did it go?"
        description={`Two minutes on “${session.title}” helps the group plan the next one.`}
        size="md"
      >
        {/* Content unmounts when closed, so the form starts fresh each time it opens */}
        <RetroForm
          session={session}
          onCancel={() => onOpenChange(false)}
          onSent={() => {
            onOpenChange(false);
            onDone?.();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

function RetroForm({ session, onCancel, onSent }: { session: Session; onCancel: () => void; onSent: () => void }) {
  const submitRetro = useStore((s) => s.submitRetro);
  const existing = useStore((s) => s.retros.find((r) => r.sessionId === session.id && r.userId === s.currentUserId));
  const [rating, setRating] = React.useState<number | null>(existing?.rating ?? null);
  const [helped, setHelped] = React.useState(existing?.helped ?? "");
  const [change, setChange] = React.useState(existing?.change ?? "");
  const [balanced, setBalanced] = React.useState<Retro["balanced"]>(existing?.balanced ?? "yes");
  const [error, setError] = React.useState(false);
  const ratingId = React.useId();

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) {
      setError(true);
      return;
    }
    submitRetro({ sessionId: session.id, rating, helped: helped.trim(), change: change.trim(), balanced });
    toast.success("Thanks! Your group will see a combined summary.");
    onSent();
  };

  return (
    <form onSubmit={send} className="space-y-6">
      <fieldset className="space-y-2.5">
        <legend id={ratingId} className="text-sm font-semibold">
          How useful was this session?
        </legend>
        <RadioPrimitive.Root
          aria-labelledby={ratingId}
          aria-describedby={error ? `${ratingId}-err` : undefined}
          value={rating ? String(rating) : ""}
          onValueChange={(v) => {
            setRating(Number(v));
            setError(false);
          }}
          orientation="horizontal"
          className="grid grid-cols-5 gap-1.5 sm:gap-2"
        >
          {RATING_LABELS.map((label, i) => {
            const value = i + 1;
            return (
              <RadioPrimitive.Item
                key={value}
                value={String(value)}
                aria-label={`${value}, ${label}`}
                className={cn(
                  "pressable flex min-h-[76px] flex-col items-center justify-center gap-1 rounded-2xl border border-border-strong bg-surface px-1 py-2 text-center hover:border-foreground/35",
                  "data-[state=checked]:border-teal data-[state=checked]:bg-teal-soft data-[state=checked]:shadow-[0_0_0_1px_var(--teal)]",
                  error && "border-destructive/60",
                )}
              >
                <span className="text-xl font-bold leading-none tracking-tight">{value}</span>
                <span className="text-[11px] font-semibold leading-tight text-muted-foreground sm:text-xs">{label}</span>
              </RadioPrimitive.Item>
            );
          })}
        </RadioPrimitive.Root>
        {error && (
          <p id={`${ratingId}-err`} role="alert" className="text-sm font-medium text-destructive">
            Pick a number first. It&rsquo;s the one bit we need.
          </p>
        )}
      </fieldset>

      <Field label="What helped?" htmlFor="retro-helped" optional>
        <Textarea
          id="retro-helped"
          rows={2}
          className="min-h-0"
          value={helped}
          onChange={(e) => setHelped(e.target.value)}
          placeholder="Explaining heapify out loud made it click"
        />
      </Field>

      <Field label="What should we change next time?" htmlFor="retro-change" optional>
        <Textarea
          id="retro-change"
          rows={2}
          className="min-h-0"
          value={change}
          onChange={(e) => setChange(e.target.value)}
          placeholder="Share questions the day before"
        />
      </Field>

      <div className="space-y-2">
        <p id="retro-balanced" className="text-sm font-semibold">
          Did everyone get a chance to contribute?
        </p>
        <Segmented
          aria-label="Did everyone get a chance to contribute?"
          value={balanced}
          onValueChange={setBalanced}
          options={BALANCE_OPTIONS}
          className="flex w-full"
        />
      </div>

      <p className="flex items-start gap-2 rounded-xl bg-surface-2 px-3.5 py-3 text-sm leading-5 text-muted-foreground">
        <Lock className="mt-0.5 size-4 shrink-0" />
        Your written answers are shared without your name.
      </p>

      <DialogFooter className="mt-2">
        <Button variant="ghost" onClick={onCancel}>
          Not now
        </Button>
        <Button type="submit">{existing ? "Update retro" : "Send retro"}</Button>
      </DialogFooter>
    </form>
  );
}
