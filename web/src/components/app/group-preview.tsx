"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Clock, Lock } from "lucide-react";
import { toast } from "sonner";
import { CharterCard, VisibilityBadge } from "@/components/app/group-bits";
import { SeatRing } from "@/components/brand/rings";
import { AvatarStack } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/surface";
import { activeMembers, useMe, useUserMap } from "@/lib/queries";
import { useStore } from "@/lib/store";
import type { Group } from "@/lib/types";

/** What a non-member sees: who's in it, the charter, and how to join. */
export function GroupPreview({ group }: { group: Group }) {
  const me = useMe();
  const users = useUserMap();
  const router = useRouter();
  const course = useStore((s) => s.courses.find((c) => c.id === group.courseId));
  const joinGroup = useStore((s) => s.joinGroup);
  const declineMember = useStore((s) => s.declineMember);
  const members = activeMembers(group);
  const owner = users[group.ownerId];
  const full = members.length >= group.maxSize;
  const pending = group.members.some((m) => m.userId === me.id && m.status === "pending");

  const join = () => {
    const result = joinGroup(group.id);
    if (result === "joined") {
      toast.success(`Welcome to ${group.name}`, { description: "Add your availability so the group can find a time." });
      router.push(`/groups/${group.id}/availability`);
    } else if (result === "pending") {
      toast("Request sent", { description: `${owner?.name.split(" ")[0] ?? "The organiser"} will review it.` });
    } else if (result === "full") {
      toast.error("This group just filled up");
    }
  };

  return (
    <div className="stagger space-y-4">
      <Panel className="overflow-hidden">
        <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:p-8">
          <SeatRing filled={members.length} total={group.maxSize} size={72} />
          <div className="min-w-0 flex-1">
            {course && (
              <Link href={`/courses/${course.id}`} className="text-sm font-semibold text-teal-text hover:underline">
                {course.code} {course.title}
              </Link>
            )}
            <div className="mt-1 flex flex-wrap items-center gap-3">
              <h1 className="text-h1">{group.name}</h1>
              <VisibilityBadge visibility={group.visibility} />
            </div>
            {group.description && <p className="mt-2 text-[0.9375rem] leading-6 text-muted-foreground">{group.description}</p>}
            <div className="mt-4 flex items-center gap-3">
              <AvatarStack users={members.map((m) => users[m.userId])} size="sm" max={6} />
              <span className="text-sm text-muted-foreground">
                {members.length} of {group.maxSize} members · Organised by {owner?.name}
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-3 border-t border-border bg-surface-2/60 px-6 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            {pending ? (
              <>
                <Clock className="size-4" /> Your request is waiting for {owner?.name.split(" ")[0]}&rsquo;s approval.
              </>
            ) : full ? (
              "This group is full. Try another group in the course."
            ) : group.visibility === "private" ? (
              <>
                <Lock className="size-4" /> Sessions, notes and chat are visible to members only.
              </>
            ) : (
              "Anyone in the course can join."
            )}
          </p>
          {pending ? (
            <Button variant="outline" onClick={() => declineMember(group.id, me.id)}>
              Cancel request
            </Button>
          ) : full ? (
            course && (
              <Button asChild variant="outline">
                <Link href={`/courses/${course.id}`}>Find another group</Link>
              </Button>
            )
          ) : (
            <Button variant="primary" size="lg" onClick={join}>
              {group.visibility === "private" ? "Ask to join" : "Join group"}
            </Button>
          )}
        </div>
      </Panel>
      <CharterCard group={group} />
    </div>
  );
}
