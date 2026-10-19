"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Link2Off, MailOpen } from "lucide-react";
import { AuthGate } from "@/components/app/app-shell";
import { GroupPreview } from "@/components/app/group-preview";
import { Logo } from "@/components/brand/logo";
import { SeatRing } from "@/components/brand/rings";
import { Button } from "@/components/ui/button";
import { EmptyState, Panel } from "@/components/ui/surface";
import { activeMembers, useMe } from "@/lib/queries";
import { useStore } from "@/lib/store";

function safeDecode(s: string) {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

export default function InvitePage() {
  return (
    <AuthGate>
      <div className="min-h-dvh">
        <header className="border-b border-border">
          <div className="mx-auto flex h-16 max-w-[760px] items-center justify-between gap-4 px-4 sm:px-6">
            <Link href="/dashboard" aria-label="StudyCircle home" className="rounded-lg">
              <Logo size={24} />
            </Link>
            <Button asChild variant="ghost">
              <Link href="/groups">Your groups</Link>
            </Button>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[760px] px-4 pb-16 pt-8 sm:px-6 sm:pt-14">
          <React.Suspense fallback={null}>
            <Invite />
          </React.Suspense>
        </main>
      </div>
    </AuthGate>
  );
}

function Invite() {
  const { code: rawCode } = useParams<{ code: string }>();
  const code = safeDecode(rawCode ?? "").trim();
  const me = useMe();
  const group = useStore((s) => s.groups.find((g) => g.inviteCode.toLowerCase() === code.toLowerCase()));
  const course = useStore((s) => s.courses.find((c) => c.id === group?.courseId));

  if (!group) {
    return (
      <EmptyState
        icon={<Link2Off />}
        title="This invite doesn't match a group"
        description={
          <>
            We couldn&rsquo;t find a group with the code{" "}
            <span className="font-mono font-semibold text-foreground">{code.toUpperCase() || "(empty)"}</span>. Check it
            with whoever sent it, or browse the groups in your courses.
          </>
        }
        action={
          <Button asChild>
            <Link href="/courses">Browse courses</Link>
          </Button>
        }
      />
    );
  }

  const membership = group.members.find((m) => m.userId === me.id);

  if (membership?.status === "active") {
    const members = activeMembers(group);
    return (
      <Panel className="stagger flex flex-col items-center px-6 py-10 text-center sm:px-10 sm:py-14">
        <SeatRing filled={members.length} total={group.maxSize} size={80} />
        <h1 className="mt-6 text-h1">You&rsquo;re already in this group</h1>
        <p className="mt-2 max-w-md text-body text-muted-foreground">
          <span className="font-semibold text-foreground">{group.name}</span>
          {course ? ` in ${course.code}` : ""}. Pick up where the group left off.
        </p>
        <Button asChild size="lg" className="mt-8 w-full sm:w-auto">
          <Link href={`/groups/${group.id}`}>Open group</Link>
        </Button>
      </Panel>
    );
  }

  return (
    <>
      <p className="mb-4 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
        <MailOpen className="size-4" />
        You&rsquo;re invited to join a study group
      </p>
      <GroupPreview group={group} />
    </>
  );
}
