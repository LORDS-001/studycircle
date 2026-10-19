"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  NotebookPen,
  Pause,
  Play,
  SkipForward,
  Square,
  Video,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { AuthGate } from "@/components/app/app-shell";
import { RetroDialog } from "@/components/app/retro-dialog";
import { Mark } from "@/components/brand/logo";
import { StepRing } from "@/components/brand/rings";
import { Avatar } from "@/components/ui/avatar";
import { ConfirmDialog } from "@/components/ui/overlays";
import { activeMembers, useMe, useUserMap } from "@/lib/queries";
import { useStore } from "@/lib/store";
import { ROLES, ROLE_ORDER, TEMPLATES, stepsFor, type TemplateStep } from "@/lib/templates";
import type { Session, User } from "@/lib/types";
import { cn, firstName } from "@/lib/utils";

/*
 * Session Mode. Timer state lives on the session (current_step + step_started_at),
 * and each client computes the remaining time, so everyone sees the same clock.
 */

function fmt(ms: number) {
  const total = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function useNow(active: boolean) {
  const [now, setNow] = React.useState(() => Date.now());
  React.useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [active]);
  return now;
}

function useRingSize() {
  const [size, setSize] = React.useState(320);
  React.useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      setSize(Math.round(Math.max(232, Math.min(w - 48, h * 0.44, 380))));
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return size;
}

export default function SessionModePage() {
  return (
    <AuthGate>
      <SessionMode />
    </AuthGate>
  );
}

function SessionMode() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const session = useStore((s) => s.sessions.find((x) => x.id === sessionId));
  const group = useStore((s) => s.groups.find((g) => g.id === session?.groupId));
  const me = useMe();

  if (!session || !group || !activeMembers(group).some((m) => m.userId === me.id)) {
    return (
      <Shell>
        <div className="grid flex-1 place-items-center px-6 text-center">
          <div>
            <h1 className="text-h2">This session isn&rsquo;t available</h1>
            <p className="mt-2 text-brand-cream/70">It may have been cancelled, or it belongs to a group you&rsquo;re not in.</p>
            <Link href="/dashboard" className="mt-6 inline-flex h-11 items-center rounded-xl bg-brand-cream px-5 font-bold text-brand-blue">
              Back to dashboard
            </Link>
          </div>
        </div>
      </Shell>
    );
  }

  return <SessionRoom session={session} groupName={group.name} />;
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="dark flex min-h-dvh flex-col bg-brand-blue text-brand-cream [color-scheme:dark] selection:bg-brand-gold/40">
      {children}
    </div>
  );
}

function SessionRoom({ session, groupName }: { session: Session; groupName: string }) {
  const router = useRouter();
  const users = useUserMap();
  const me = useMe();
  const group = useStore((s) => s.groups.find((g) => g.id === session.groupId))!;
  const { startSession, goToStep, pauseSession, resumeSession, endSession } = useStore.getState();
  const [notesOpen, setNotesOpen] = React.useState(false);
  const [confirmEnd, setConfirmEnd] = React.useState(false);
  const [retroOpen, setRetroOpen] = React.useState(false);
  const hasRetro = useStore((s) => s.retros.some((r) => r.sessionId === session.id && r.userId === me.id));
  const ringSize = useRingSize();

  const members = activeMembers(group).map((m) => users[m.userId]).filter(Boolean) as User[];
  const teachers = members
    .filter((m) => session.template === "jigsaw" && session.jigsawTopics[m.id])
    .map((m) => ({ id: m.id, name: m.name, topic: session.jigsawTopics[m.id] }));
  const steps = stepsFor(session.template, session.durationMin, teachers);
  const live = session.status === "live";
  const paused = live && session.pausedRemainingMs !== undefined;
  const now = useNow(live && !paused);

  const step = steps[session.currentStep];
  const stepMs = (step?.minutes ?? 0) * 60_000;
  const elapsed = paused
    ? stepMs - (session.pausedRemainingMs ?? 0)
    : session.stepStartedAt
      ? now - new Date(session.stepStartedAt).getTime()
      : 0;
  const remaining = stepMs - elapsed;
  const overtime = live && remaining < 0;
  const progress = stepMs ? Math.min(1, Math.max(0, elapsed / stepMs)) : 0;
  const isLast = session.currentStep >= steps.length - 1;

  // Jigsaw: teaching steps start at index 1
  const teacherIndex = session.template === "jigsaw" ? session.currentStep - 1 : -1;
  const currentTeacher = teacherIndex >= 0 && teacherIndex < teachers.length ? teachers[teacherIndex] : undefined;
  const scribe = members.find((m) => session.roles[m.id] === "scribe");

  const next = React.useCallback(() => {
    if (!live) return;
    if (isLast) setConfirmEnd(true);
    else goToStep(session.id, session.currentStep + 1);
  }, [live, isLast, goToStep, session.id, session.currentStep]);

  const prev = React.useCallback(() => {
    if (live && session.currentStep > 0) goToStep(session.id, session.currentStep - 1);
  }, [live, goToStep, session.id, session.currentStep]);

  const togglePause = React.useCallback(() => {
    if (!live) return;
    if (paused) resumeSession(session.id);
    else pauseSession(session.id);
  }, [live, paused, pauseSession, resumeSession, session.id]);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("input, textarea, [contenteditable], [role=dialog]")) return;
      if (e.key === " ") {
        e.preventDefault();
        togglePause();
      } else if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [togglePause, next, prev]);

  // Document title doubles as a glanceable timer when the tab is in the background
  React.useEffect(() => {
    if (live && step) document.title = `${overtime ? "+" : ""}${fmt(Math.abs(remaining))} · ${step.title}`;
    else document.title = `${session.title} · StudyCircle`;
  }, [live, step, remaining, overtime, session.title]);

  const exit = () => router.push(`/sessions/${session.id}`);

  return (
    <Shell>
      {/* Top bar */}
      <header className="flex h-16 shrink-0 items-center gap-3 border-b border-white/10 px-4 sm:px-6">
        <button
          onClick={exit}
          className="pressable grid size-10 place-items-center rounded-xl text-brand-cream/80 hover:bg-white/10 hover:text-brand-cream"
          aria-label="Leave Session Mode"
        >
          <X className="size-5" />
        </button>
        <Mark size={24} tone="dark" title={null} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-bold">{session.title}</div>
          <div className="truncate text-xs text-brand-cream/65">
            {groupName}, {TEMPLATES[session.template].name}
          </div>
        </div>
        {session.videoUrl && (
          <a
            href={session.videoUrl}
            target="_blank"
            rel="noreferrer"
            className="pressable hidden h-10 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-brand-cream/85 hover:bg-white/10 hover:text-brand-cream sm:inline-flex"
          >
            <Video className="size-4" /> Video call
          </a>
        )}
        <button
          onClick={() => setNotesOpen((o) => !o)}
          aria-expanded={notesOpen}
          className={cn(
            "pressable inline-flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-brand-cream/85 hover:bg-white/10 hover:text-brand-cream",
            notesOpen && "bg-white/10 text-brand-cream",
          )}
        >
          <NotebookPen className="size-4" />
          <span className="hidden sm:inline">Notes</span>
        </button>
        {live && (
          <button
            onClick={() => setConfirmEnd(true)}
            className="pressable inline-flex h-10 items-center gap-2 rounded-xl bg-white/10 px-3.5 text-sm font-semibold hover:bg-white/15"
          >
            <Square className="size-3.5 fill-current" /> End
          </button>
        )}
      </header>

      <div className="flex min-h-0 flex-1">
        {/* Steps rail */}
        <aside className="hidden w-72 shrink-0 flex-col border-r border-white/10 p-6 lg:flex">
          <h2 className="mb-4 text-xs font-bold text-brand-cream/60">Plan</h2>
          <ol className="space-y-1">
            {steps.map((s, i) => {
              const done = live ? i < session.currentStep : session.status === "ended";
              const current = live && i === session.currentStep;
              return (
                <li key={i}>
                  <button
                    disabled={!live}
                    onClick={() => goToStep(session.id, i)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-white/5 disabled:hover:bg-transparent",
                      current && "bg-white/10 hover:bg-white/10",
                    )}
                    aria-current={current ? "step" : undefined}
                  >
                    <span
                      className={cn(
                        "grid size-6 shrink-0 place-items-center rounded-full border text-[11px] font-bold",
                        done && "border-brand-cream/80 bg-brand-cream/80 text-brand-blue",
                        current && "border-brand-gold bg-brand-gold text-brand-blue",
                        !done && !current && "border-white/25 text-brand-cream/60",
                      )}
                    >
                      {done ? <Check className="size-3.5" strokeWidth={3} /> : i + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={cn("block truncate text-sm font-semibold", !current && !done && "text-brand-cream/75")}>{s.title}</span>
                    </span>
                    <span className="text-xs tabular-nums text-brand-cream/55">{s.minutes}m</span>
                  </button>
                </li>
              );
            })}
          </ol>
          <p className="mt-auto text-xs leading-5 text-brand-cream/50">
            Space pauses. Arrow keys move between steps. Everyone in the group sees the same timer.
          </p>
        </aside>

        {/* Centre stage */}
        <main className="flex min-w-0 flex-1 flex-col items-center justify-center px-5 py-8 sm:py-10">
          {session.status === "scheduled" && (
            <Lobby
              session={session}
              steps={steps}
              members={members}
              ringSize={ringSize}
              onStart={() => {
                startSession(session.id);
                toast.success("Session started", { description: "Everyone in the group can join now.", position: "top-center" });
              }}
            />
          )}

          {live && step && (
            <div key={session.currentStep} className="flex w-full max-w-xl animate-fade-in flex-col items-center text-center">
              <StepRing steps={steps.length} current={session.currentStep} progress={progress} size={ringSize}>
                <div className="flex flex-col items-center">
                  <span className="text-xs font-bold text-brand-cream/60">
                    Step {session.currentStep + 1} of {steps.length}
                  </span>
                  <span
                    className={cn(
                      "mt-1 font-bold tabular-nums tracking-[-0.04em]",
                      overtime ? "text-brand-gold" : "text-brand-cream",
                    )}
                    style={{ fontSize: ringSize * 0.22, lineHeight: 1 }}
                    role="timer"
                    aria-live="off"
                    aria-label={overtime ? `${fmt(-remaining)} over time` : `${fmt(remaining)} remaining`}
                  >
                    {overtime && "+"}
                    {fmt(Math.abs(remaining))}
                  </span>
                  <span className="mt-2 text-sm font-semibold text-brand-cream/80">
                    {paused ? "Paused" : overtime ? "Time's up" : step.title}
                  </span>
                </div>
              </StepRing>

              <h1 className="mt-8 text-h2 text-brand-cream">{step.title}</h1>
              <p className="mt-2 max-w-md text-[1.0625rem] leading-7 text-brand-cream/80">{step.instruction}</p>

              {currentTeacher && (
                <div className="mt-5 inline-flex items-center gap-3 rounded-full bg-white/10 py-1.5 pl-1.5 pr-4">
                  <Avatar user={users[currentTeacher.id]} size="sm" className="ring-2 ring-brand-gold" />
                  <span className="text-sm">
                    <span className="font-bold">{currentTeacher.id === me.id ? "Your turn to teach" : `${firstName(currentTeacher.name)} is teaching`}</span>
                    <span className="text-brand-cream/70">: {currentTeacher.topic}</span>
                  </span>
                </div>
              )}

              {/* Controls */}
              <div className="mt-8 flex items-center gap-4">
                <button
                  onClick={prev}
                  disabled={session.currentStep === 0}
                  className="pressable grid size-12 place-items-center rounded-full bg-white/10 hover:bg-white/15 disabled:opacity-35"
                  aria-label="Previous step"
                >
                  <ChevronLeft className="size-5" />
                </button>
                <button
                  onClick={togglePause}
                  className="pressable grid size-16 place-items-center rounded-full bg-brand-cream text-brand-blue hover:bg-white"
                  aria-label={paused ? "Resume timer" : "Pause timer"}
                >
                  {paused ? <Play className="ml-0.5 size-6 fill-current" /> : <Pause className="size-6 fill-current" />}
                </button>
                <button
                  onClick={next}
                  className={cn(
                    "pressable grid size-12 place-items-center rounded-full bg-white/10 hover:bg-white/15",
                    overtime && "bg-brand-gold text-brand-blue hover:bg-brand-gold",
                  )}
                  aria-label={isLast ? "Finish session" : "Next step"}
                >
                  {isLast ? <Check className="size-5" /> : <SkipForward className="size-5 fill-current" />}
                </button>
              </div>
              {steps[session.currentStep + 1] && (
                <p className="mt-4 text-sm text-brand-cream/60">
                  Next: {steps[session.currentStep + 1].title}, {steps[session.currentStep + 1].minutes} min
                </p>
              )}
            </div>
          )}

          {session.status === "ended" && (
            <Finished
              session={session}
              steps={steps}
              members={members}
              hasRetro={hasRetro}
              onRetro={() => setRetroOpen(true)}
              groupId={group.id}
              ringSize={ringSize}
            />
          )}
        </main>

        {/* Roles / notes panel */}
        <aside
          className={cn(
            "w-80 shrink-0 flex-col border-l border-white/10",
            notesOpen
              ? "fixed inset-x-0 bottom-0 top-16 z-40 flex w-auto animate-fade-in bg-brand-blue xl:static xl:z-auto xl:w-80"
              : "hidden xl:flex",
          )}
        >
          {notesOpen ? (
            <NotesPanel session={session} scribe={scribe} onClose={() => setNotesOpen(false)} />
          ) : (
            <RolesPanel session={session} members={members} meId={me.id} />
          )}
        </aside>
      </div>

      {/* Mobile roles strip */}
      {live && !notesOpen && (
        <div className="scrollbar-none flex gap-2 overflow-x-auto border-t border-white/10 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] xl:hidden">
          {ROLE_ORDER.map((r) => {
            const u = members.find((m) => session.roles[m.id] === r);
            if (!u) return null;
            return (
              <span key={r} className="flex shrink-0 items-center gap-2 rounded-full bg-white/10 py-1 pl-1 pr-3">
                <Avatar user={u} size="xs" />
                <span className="text-xs">
                  <span className="font-bold">{u.id === me.id ? "You" : firstName(u.name)}</span>
                  <span className="text-brand-cream/70"> {ROLES[r].name.toLowerCase()}</span>
                </span>
              </span>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={confirmEnd}
        onOpenChange={setConfirmEnd}
        title="End the session for everyone?"
        description="The timer stops for the whole group and everyone gets the two-minute retro."
        confirmLabel="End session"
        onConfirm={() => {
          endSession(session.id);
          setRetroOpen(true);
        }}
      />
      <RetroDialog session={session} open={retroOpen} onOpenChange={setRetroOpen} />
    </Shell>
  );
}

function Lobby({
  session,
  steps,
  members,
  ringSize,
  onStart,
}: {
  session: Session;
  steps: TemplateStep[];
  members: User[];
  ringSize: number;
  onStart: () => void;
}) {
  const total = steps.reduce((a, s) => a + s.minutes, 0);
  return (
    <div className="flex max-w-lg animate-fade-in flex-col items-center text-center">
      <StepRing steps={steps.length} current={-1} progress={0} size={Math.round(ringSize * 0.8)}>
        <Mark size={Math.round(ringSize * 0.22)} tone="dark" title={null} />
      </StepRing>
      <h1 className="mt-8 text-h1">Ready when you are</h1>
      <p className="mt-2 text-[1.0625rem] leading-7 text-brand-cream/80">
        {TEMPLATES[session.template].name}: {steps.length} steps, about {total} minutes. Starting the session starts the
        timer for everyone.
      </p>
      <div className="mt-6 flex -space-x-2">
        {members.map((m) => (
          <Avatar key={m.id} user={m} size="md" className="ring-4 ring-brand-blue" />
        ))}
      </div>
      <button
        onClick={onStart}
        className="pressable mt-8 inline-flex h-14 items-center gap-2.5 rounded-2xl bg-brand-cream px-8 text-lg font-bold text-brand-blue hover:bg-white"
      >
        <Play className="size-5 fill-current" /> Start session
      </button>
    </div>
  );
}

function Finished({
  session,
  steps,
  members,
  hasRetro,
  onRetro,
  groupId,
  ringSize,
}: {
  session: Session;
  steps: TemplateStep[];
  members: User[];
  hasRetro: boolean;
  onRetro: () => void;
  groupId: string;
  ringSize: number;
}) {
  const going = members.filter((m) => session.rsvps[m.id] === "yes");
  return (
    <div className="flex max-w-lg animate-fade-in flex-col items-center text-center">
      <StepRing steps={steps.length} current={steps.length} progress={1} size={Math.round(ringSize * 0.7)}>
        <span className="grid size-16 place-items-center rounded-full bg-brand-gold text-brand-blue">
          <Check className="size-8" strokeWidth={3} />
        </span>
      </StepRing>
      <h1 className="mt-8 text-h1">Nice work. Same time next week?</h1>
      <p className="mt-2 text-[1.0625rem] leading-7 text-brand-cream/80">
        {going.length > 1 ? `${going.length} of you showed up and worked through it together.` : "Session complete."} The notes
        are saved to your group&rsquo;s archive.
      </p>
      <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
        {!hasRetro && (
          <button
            onClick={onRetro}
            className="pressable inline-flex h-12 items-center justify-center rounded-xl bg-brand-gold px-6 font-bold text-brand-blue hover:brightness-95"
          >
            Take the 2-minute retro
          </button>
        )}
        <Link
          href={`/groups/${groupId}`}
          className="pressable inline-flex h-12 items-center justify-center gap-1.5 rounded-xl bg-white/10 px-6 font-semibold hover:bg-white/15"
        >
          Back to the group <ChevronRight className="size-4" />
        </Link>
      </div>
    </div>
  );
}

function RolesPanel({ session, members, meId }: { session: Session; members: User[]; meId: string }) {
  const goals = session.template === "cowork";
  return (
    <div className="flex flex-1 flex-col overflow-y-auto p-6">
      <h2 className="mb-4 text-xs font-bold text-brand-cream/60">Roles this session</h2>
      <ul className="space-y-1">
        {ROLE_ORDER.map((r) => {
          const u = members.find((m) => session.roles[m.id] === r);
          return (
            <li key={r} className="flex items-center gap-3 rounded-xl px-2 py-2">
              {u ? <Avatar user={u} size="md" /> : <span className="size-10 rounded-full border border-dashed border-white/25" />}
              <div className="min-w-0">
                <div className="truncate text-sm font-bold">
                  {u ? (u.id === meId ? "You" : u.name) : "Unassigned"}
                </div>
                <div className="text-xs text-brand-cream/65">
                  {ROLES[r].name}, {ROLES[r].job.toLowerCase()}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {session.template === "jigsaw" && Object.keys(session.jigsawTopics).length > 0 && (
        <>
          <h2 className="mb-3 mt-8 text-xs font-bold text-brand-cream/60">Who teaches what</h2>
          <ul className="space-y-2">
            {members
              .filter((m) => session.jigsawTopics[m.id])
              .map((m) => (
                <li key={m.id} className="flex items-center gap-2.5 text-sm">
                  <Avatar user={m} size="xs" />
                  <span className="font-semibold">{m.id === meId ? "You" : firstName(m.name)}</span>
                  <span className="truncate text-brand-cream/70">{session.jigsawTopics[m.id]}</span>
                </li>
              ))}
          </ul>
        </>
      )}

      {goals && (
        <p className="mt-8 rounded-xl bg-white/5 p-4 text-sm leading-6 text-brand-cream/80">
          At each break, say out loud whether you met your goal. Short and honest beats perfect.
        </p>
      )}

      {session.agenda && (
        <>
          <h2 className="mb-2 mt-8 text-xs font-bold text-brand-cream/60">Agenda</h2>
          <p className="text-sm leading-6 text-brand-cream/80">{session.agenda}</p>
        </>
      )}
    </div>
  );
}

function NotesPanel({ session, scribe, onClose }: { session: Session; scribe?: User; onClose: () => void }) {
  const updateNotes = useStore((s) => s.updateNotes);
  const fields: { key: keyof Session["notes"]; label: string; placeholder: string }[] = [
    { key: "summary", label: "Summary", placeholder: "What did the group cover?" },
    { key: "openQuestions", label: "Open questions", placeholder: "What's still unclear?" },
    { key: "actionItems", label: "Action items", placeholder: "Who does what before next time? One per line." },
  ];
  return (
    <div className="flex flex-1 flex-col overflow-y-auto p-5 sm:p-6">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-bold">Session notes</h2>
          <p className="text-xs text-brand-cream/65">
            {scribe ? `${firstName(scribe.name)} is the scribe. Everyone can edit.` : "Everyone can edit."}
          </p>
        </div>
        <button
          onClick={onClose}
          className="pressable grid size-9 place-items-center rounded-lg text-brand-cream/75 hover:bg-white/10"
          aria-label="Close notes"
        >
          <X className="size-4" />
        </button>
      </div>
      <div className="space-y-5">
        {fields.map((f) => (
          <label key={f.key} className="block">
            <span className="mb-1.5 block text-sm font-semibold">{f.label}</span>
            <textarea
              defaultValue={session.notes[f.key] ?? ""}
              onBlur={(e) => {
                if (e.target.value !== session.notes[f.key]) updateNotes(session.id, { [f.key]: e.target.value });
              }}
              rows={f.key === "summary" ? 5 : 3}
              placeholder={f.placeholder}
              className="w-full resize-y rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-[0.9375rem] leading-6 text-brand-cream placeholder:text-brand-cream/40 focus-visible:border-brand-gold/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/25"
            />
          </label>
        ))}
      </div>
      <p className="mt-4 text-xs text-brand-cream/55">Notes save when you click away.</p>
    </div>
  );
}
