"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import {
  CalendarDays,
  ChevronLeft,
  Clock4,
  Ellipsis,
  LayoutGrid,
  LibraryBig,
  LogOut,
  MessagesSquare,
  NotebookPen,
  Pencil,
  UserPlus,
  UsersRound,
} from "lucide-react";
import { toast } from "sonner";
import { InviteDialog } from "@/components/app/invite-dialog";
import { VisibilityBadge } from "@/components/app/group-bits";
import { EditGroupDialog } from "@/components/app/edit-group-dialog";
import { GroupPreview } from "@/components/app/group-preview";
import { Page } from "@/components/app/app-shell";
import { AvatarStack } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  ConfirmDialog,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/overlays";
import { EmptyState } from "@/components/ui/surface";
import { GroupContext } from "@/lib/group-context";
import { activeMembers, useGroup, useMe, useUserMap } from "@/lib/queries";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const TABS = [
  { seg: "", label: "Overview", icon: LayoutGrid },
  { seg: "sessions", label: "Sessions", icon: CalendarDays },
  { seg: "availability", label: "Availability", icon: Clock4 },
  { seg: "questions", label: "Questions", icon: LibraryBig },
  { seg: "notes", label: "Notes", icon: NotebookPen },
  { seg: "chat", label: "Chat", icon: MessagesSquare },
  { seg: "members", label: "Members", icon: UsersRound },
];

export default function GroupLayout({ children }: { children: React.ReactNode }) {
  const { groupId } = useParams<{ groupId: string }>();
  const pathname = usePathname();
  const router = useRouter();
  const group = useGroup(groupId);
  const me = useMe();
  const users = useUserMap();
  const course = useStore((s) => s.courses.find((c) => c.id === group?.courseId));
  const leaveGroup = useStore((s) => s.leaveGroup);
  const [editOpen, setEditOpen] = React.useState(false);
  const [leaveOpen, setLeaveOpen] = React.useState(false);

  if (!group) {
    return (
      <Page>
        <EmptyState
          icon={<UsersRound />}
          title="Group not found"
          description="It may have been deleted, or the link is wrong."
          action={
            <Button asChild variant="outline">
              <Link href="/groups">See your groups</Link>
            </Button>
          }
        />
      </Page>
    );
  }

  const membership = group.members.find((m) => m.userId === me.id);
  if (!membership || membership.status !== "active") {
    return (
      <Page width="narrow">
        <GroupPreview group={group} />
      </Page>
    );
  }

  const members = activeMembers(group);
  const isOwner = group.ownerId === me.id;
  const pending = group.members.filter((m) => m.status === "pending").length;
  const base = `/groups/${group.id}`;
  // Full-bleed sub-pages (quiz) hide the group chrome
  const immersive = pathname.startsWith(`${base}/questions/quiz`);

  return (
    <GroupContext.Provider value={group}>
      {immersive ? (
        children
      ) : (
        <Page width="default" className="pt-4 lg:pt-8">
          <header className="mb-6">
            {course && (
              <Link
                href={`/courses/${course.id}`}
                className="mb-3 inline-flex items-center gap-1 rounded-md text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
              >
                <ChevronLeft className="size-4" />
                {course.code} {course.title}
              </Link>
            )}
            <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                  <h1 className="text-h1">{group.name}</h1>
                  <VisibilityBadge visibility={group.visibility} />
                </div>
                {group.description && (
                  <p className="mt-2 max-w-2xl text-[0.9375rem] leading-6 text-muted-foreground">{group.description}</p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <Link
                  href={`${base}/members`}
                  className="pressable mr-1 flex items-center gap-2.5 rounded-full py-1 pl-1 pr-3 hover:bg-surface-2"
                >
                  <AvatarStack users={members.map((m) => users[m.userId])} size="sm" max={5} />
                  <span className="text-sm font-semibold text-muted-foreground">
                    {members.length}/{group.maxSize}
                  </span>
                </Link>
                <InviteDialog group={group}>
                  <Button variant="outline" size="sm" className="h-10">
                    <UserPlus />
                    Invite
                  </Button>
                </InviteDialog>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" aria-label="Group options" className="size-10">
                      <Ellipsis />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {isOwner && (
                      <DropdownMenuItem onSelect={() => setEditOpen(true)}>
                        <Pencil /> Edit group and charter
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem asChild>
                      <Link href={`${base}/members`}>
                        <UsersRound /> Manage members
                        {pending > 0 && (
                          <span className="ml-auto rounded-full bg-gold px-1.5 text-xs font-bold text-gold-foreground">{pending}</span>
                        )}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem destructive onSelect={() => setLeaveOpen(true)}>
                      <LogOut /> Leave group
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          <nav aria-label="Group sections" className="scrollbar-none sticky top-14 z-20 -mx-4 mb-8 overflow-x-auto border-b border-border bg-background/90 px-4 backdrop-blur-md sm:-mx-6 sm:px-6 lg:top-0 lg:mx-0 lg:px-0">
            <ul className="flex gap-1">
              {TABS.map(({ seg, label, icon: Icon }) => {
                const href = seg ? `${base}/${seg}` : base;
                const active = seg ? pathname.startsWith(href) : pathname === base;
                return (
                  <li key={seg}>
                    <Link
                      href={href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "relative inline-flex h-12 items-center gap-2 whitespace-nowrap px-3 text-[0.9375rem] font-semibold text-muted-foreground transition-colors hover:text-foreground",
                        "after:absolute after:inset-x-3 after:-bottom-px after:h-[2.5px] after:origin-center after:scale-x-0 after:rounded-full after:bg-foreground after:transition-transform after:duration-200 after:ease-[var(--ease-out)]",
                        active && "text-foreground after:scale-x-100",
                      )}
                    >
                      <Icon className="size-4" strokeWidth={2.2} />
                      {label}
                      {seg === "members" && pending > 0 && isOwner && (
                        <span className="grid size-5 place-items-center rounded-full bg-gold text-[11px] font-bold text-gold-foreground">
                          {pending}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {children}
        </Page>
      )}

      {isOwner && <EditGroupDialog group={group} open={editOpen} onOpenChange={setEditOpen} />}
      <ConfirmDialog
        open={leaveOpen}
        onOpenChange={setLeaveOpen}
        title={`Leave ${group.name}?`}
        description={
          isOwner && members.length > 1
            ? "You own this group. Transfer ownership from the Members tab first, or the group won't have an organiser."
            : "You'll lose access to the group's sessions, notes and chat. You can ask to rejoin later."
        }
        confirmLabel="Leave group"
        destructive
        onConfirm={() => {
          leaveGroup(group.id);
          toast("You left the group");
          router.push("/groups");
        }}
      />
    </GroupContext.Provider>
  );
}
