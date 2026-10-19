"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { BookX, Check, Plus, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { Page, PageHeader } from "@/components/app/app-shell";
import { CourseGroupRow, STATUS_ORDER, groupStatus, type GroupStatus } from "@/components/app/courses-group-row";
import { AvatarStack } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/surface";
import { useMe, useUserMap } from "@/lib/queries";
import { useStore } from "@/lib/store";
import { plural } from "@/lib/utils";

const NO_MEMBERS: string[] = [];

const SECTIONS: { key: string; title: string; statuses: GroupStatus[] }[] = [
  { key: "yours", title: "Your groups", statuses: ["member", "pending"] },
  { key: "open", title: "Open to join", statuses: ["open"] },
  { key: "full", title: "Full", statuses: ["full"] },
];

export default function CoursePage() {
  const { courseId } = useParams<{ courseId: string }>();
  const me = useMe();
  const users = useUserMap();
  const course = useStore((s) => s.courses.find((c) => c.id === courseId));
  const memberIds = useStore((s) => s.courseMembers[courseId] ?? NO_MEMBERS);
  const allGroups = useStore((s) => s.groups);
  const joinCourse = useStore((s) => s.joinCourse);
  const leaveCourse = useStore((s) => s.leaveCourse);

  const groups = React.useMemo(
    () =>
      allGroups
        .filter((g) => g.courseId === courseId)
        .map((g) => ({ group: g, status: groupStatus(g, me.id) }))
        .sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]),
    [allGroups, courseId, me.id],
  );

  if (!course) {
    return (
      <Page>
        <EmptyState
          icon={<BookX />}
          title="Course not found"
          description="It may have been removed, or the link is wrong."
          action={
            <Button asChild variant="outline">
              <Link href="/courses">Browse courses</Link>
            </Button>
          }
        />
      </Page>
    );
  }

  const joined = memberIds.includes(me.id);
  const newGroupHref = `/groups/new?course=${course.id}`;

  const toggleCourse = () => {
    if (joined) {
      leaveCourse(course.id);
      toast(`You left ${course.code}`, {
        description: "Your groups in it stay as they are.",
        action: { label: "Undo", onClick: () => joinCourse(course.id) },
      });
    } else {
      joinCourse(course.id);
      toast.success(`Joined ${course.code}`, { description: "Pick a group below, or start your own." });
    }
  };

  return (
    <Page>
      <PageHeader
        back={{ href: "/courses", label: "Courses" }}
        eyebrow={course.code}
        title={course.title}
        description={
          <span className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <span>{course.school}</span>
            <span aria-hidden className="text-subtle-foreground max-sm:hidden">
              ·
            </span>
            <span className="inline-flex items-center gap-2">
              <AvatarStack users={memberIds.map((id) => users[id])} size="xs" max={5} />
              {plural(memberIds.length, "student")}
            </span>
          </span>
        }
        actions={
          <>
            <Button asChild variant={joined ? "primary" : "outline"}>
              <Link href={newGroupHref}>
                <Plus />
                Create group
              </Link>
            </Button>
            {joined ? (
              <Button variant="ghost" onClick={toggleCourse}>
                Leave course
              </Button>
            ) : (
              <Button variant="primary" onClick={toggleCourse} className="order-first">
                <Check />
                Join course
              </Button>
            )}
          </>
        }
      />

      {groups.length === 0 ? (
        <EmptyState
          icon={<UsersRound />}
          title="No study groups yet"
          description={`Start the first group for ${course.code}. Pick a size, a goal and a rhythm, then invite classmates.`}
          action={
            <Button asChild>
              <Link href={newGroupHref}>
                <Plus />
                Create the first group
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="stagger space-y-8">
          {SECTIONS.map((section) => {
            const items = groups.filter((g) => section.statuses.includes(g.status));
            if (!items.length) return null;
            return (
              <section key={section.key} aria-labelledby={`sec-${section.key}`}>
                <h2
                  id={`sec-${section.key}`}
                  className="mb-3 flex items-baseline gap-2 text-lg font-bold tracking-tight"
                >
                  {section.title}
                  <span className="text-sm font-semibold text-subtle-foreground">{items.length}</span>
                </h2>
                <ul className="divide-y divide-border overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface">
                  {items.map(({ group }) => (
                    <li key={group.id}>
                      <CourseGroupRow group={group} meId={me.id} users={users} />
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}

          <div className="flex flex-col items-start gap-3 rounded-[var(--radius-card)] border border-dashed border-border-strong px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold">Not seeing the right fit?</p>
              <p className="text-sm text-muted-foreground">Start a group with your own goal and rhythm.</p>
            </div>
            <Button asChild variant="outline">
              <Link href={newGroupHref}>
                <Plus />
                Create group
              </Link>
            </Button>
          </div>
        </div>
      )}
    </Page>
  );
}
