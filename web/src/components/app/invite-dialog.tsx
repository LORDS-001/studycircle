"use client";

import * as React from "react";
import { Check, Copy, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/overlays";
import type { Group } from "@/lib/types";

function useCopy() {
  const [copied, setCopied] = React.useState<string | null>(null);
  const copy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied((c) => (c === key ? null : c)), 1800);
    } catch {
      toast.error("Couldn't copy. Select the text and copy it manually.");
    }
  };
  return { copied, copy };
}

export function InviteDialog({ group, children }: { group: Group; children: React.ReactNode }) {
  const { copied, copy } = useCopy();
  const origin = React.useSyncExternalStore(
    () => () => {},
    () => window.location.origin,
    () => "",
  );
  const link = `${origin}/invite/${group.inviteCode}`;
  const seatsLeft = group.maxSize - group.members.filter((m) => m.status === "active").length;
  const whatsapp = `https://wa.me/?text=${encodeURIComponent(`Join ${group.name} on StudyCircle: ${link}`)}`;

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent
        title="Invite classmates"
        description={
          seatsLeft > 0
            ? `${seatsLeft} ${seatsLeft === 1 ? "seat" : "seats"} left. ${group.visibility === "private" ? "You'll approve each request." : "Anyone with the link can join."}`
            : "This group is full. Raise the size limit to invite more people."
        }
      >
        <div className="space-y-5">
          <div>
            <div className="mb-1.5 text-sm font-semibold">Invite link</div>
            <div className="flex gap-2">
              <div className="flex h-11 min-w-0 flex-1 items-center rounded-[var(--radius-control)] border border-border-strong bg-surface-2 px-3.5 text-[0.9375rem] text-muted-foreground">
                <span className="truncate">{link.replace(/^https?:\/\//, "")}</span>
              </div>
              <Button variant="primary" onClick={() => copy("link", link)} className="w-28">
                {copied === "link" ? <Check /> : <Copy />}
                {copied === "link" ? "Copied" : "Copy"}
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-2xl bg-surface-2 p-4">
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold">Or share the code</div>
              <p className="text-sm text-muted-foreground">Classmates enter it from the course page.</p>
            </div>
            <button
              onClick={() => copy("code", group.inviteCode)}
              className="pressable rounded-xl border border-border-strong bg-surface px-3.5 py-2 font-mono text-lg font-bold tracking-[0.12em] hover:border-foreground/40"
              aria-label={`Copy invite code ${group.inviteCode}`}
            >
              {group.inviteCode}
            </button>
          </div>

          <Button asChild variant="teal" size="lg" className="w-full">
            <a href={whatsapp} target="_blank" rel="noreferrer">
              <MessageCircle />
              Share on WhatsApp
            </a>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
