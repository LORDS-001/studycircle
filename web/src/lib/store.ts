"use client";

import { addWeeks, addDays, isBefore } from "date-fns";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { createSeed, type SeedData } from "./seed";
import { ROLE_ORDER, stepsFor } from "./templates";
import { supabaseEnabled } from "./supabase/client";
import type {
  Availability,
  Group,
  GroupGoal,
  ID,
  Message,
  PrepItem,
  Question,
  Recurrence,
  Retro,
  RsvpStatus,
  Session,
  SessionTemplate,
  User,
  Visibility,
} from "./types";

/* Demo mode persists locally; Supabase mode uses only its loaded server snapshot. */

export const uid = (prefix = "id") =>
  `${prefix}-${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`;

const inviteCode = (name: string) =>
  `${name.replace(/[^a-z]/gi, "").slice(0, 4).toUpperCase().padEnd(4, "X")}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

const jitsiUrl = () =>
  `https://meet.jit.si/studycircle-${Math.random().toString(36).slice(2, 10)}${Math.random().toString(36).slice(2, 10)}`;

export interface NewGroupInput {
  courseId: ID;
  name: string;
  description: string;
  maxSize: number;
  visibility: Visibility;
  goal: GroupGoal;
  norms: string[];
  cadence: string;
  examDate?: string;
}

export interface NewSessionInput {
  groupId: ID;
  title: string;
  template: SessionTemplate;
  startsAt: string;
  durationMin: number;
  locationType: "video" | "place";
  place?: string;
  recurrence: Recurrence;
  agenda: string;
  prep: string[];
  jigsawTopics: Record<ID, string>;
}

interface State extends SeedData {
  currentUserId: ID | null;
  onboarded: boolean;

  signIn: (email?: string) => void;
  signOut: () => void;
  updateProfile: (patch: Partial<Pick<User, "name" | "school" | "emailPrefs">>) => void;
  completeOnboarding: () => void;
  resetDemo: () => void;

  createCourse: (input: { code: string; title: string; school: string }) => { ok: true; id: ID } | { ok: false; error: string };
  joinCourse: (courseId: ID) => void;
  leaveCourse: (courseId: ID) => void;

  createGroup: (input: NewGroupInput) => ID;
  updateGroup: (groupId: ID, patch: Partial<Group>) => void;
  joinGroup: (groupId: ID) => "joined" | "pending" | "full" | "already";
  approveMember: (groupId: ID, userId: ID) => void;
  declineMember: (groupId: ID, userId: ID) => void;
  removeMember: (groupId: ID, userId: ID) => void;
  leaveGroup: (groupId: ID) => void;
  transferOwnership: (groupId: ID, userId: ID) => void;

  saveAvailability: (groupId: ID, slots: string[]) => void;

  createSession: (input: NewSessionInput) => ID;
  updateSession: (sessionId: ID, patch: Partial<Session>) => void;
  deleteSession: (sessionId: ID) => void;
  rsvp: (sessionId: ID, status: RsvpStatus) => void;
  togglePrep: (sessionId: ID, prepId: ID) => void;
  startSession: (sessionId: ID) => void;
  goToStep: (sessionId: ID, step: number) => void;
  pauseSession: (sessionId: ID) => void;
  resumeSession: (sessionId: ID) => void;
  endSession: (sessionId: ID) => void;
  updateNotes: (sessionId: ID, patch: Partial<Session["notes"]>) => void;

  addQuestion: (input: Omit<Question, "id" | "createdAt" | "createdBy">) => void;
  updateQuestion: (id: ID, patch: Partial<Question>) => void;
  deleteQuestion: (id: ID) => void;
  recordAttempt: (questionId: ID, correct: boolean) => void;

  submitRetro: (retro: Omit<Retro, "userId">) => void;

  sendMessage: (groupId: ID, body: string) => void;
  /** A message arriving from another member (Supabase Realtime insert) */
  receiveMessage: (message: Omit<Message, "id" | "createdAt">) => void;
}

function nextRoles(state: SeedData, groupId: ID, members: ID[]): Session["roles"] {
  // Rotate roles: shift by the number of sessions this group has already started.
  const count = state.sessions.filter((s) => s.groupId === groupId && s.status !== "scheduled").length;
  const roles: Session["roles"] = {};
  members.forEach((userId, i) => {
    roles[userId] = ROLE_ORDER[(i + count) % members.length] ?? undefined;
  });
  return roles;
}

/** Dates a series creates, up to `until` (the exam) or six weeks. Exported so forms can preview the count. */
export function occurrences(start: Date, recurrence: Recurrence, until?: Date): Date[] {
  if (recurrence === "none") return [start];
  const out: Date[] = [];
  const limit = until ?? addWeeks(start, 6);
  let cursor = start;
  let flip = false;
  while (!isBefore(limit, cursor) && out.length < 24) {
    out.push(cursor);
    if (recurrence === "weekly") cursor = addWeeks(cursor, 1);
    else {
      // Twice weekly: alternate +3 and +4 days to stay on the same two weekdays
      cursor = addDays(cursor, flip ? 4 : 3);
      flip = !flip;
    }
  }
  return out;
}

const emptyData: SeedData = {
  users: [],
  courses: [],
  courseMembers: {},
  groups: [],
  sessions: [],
  questions: [],
  quizAttempts: [],
  retros: [],
  messages: [],
  availability: [],
};

const inertStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
};

export const useStore = create<State>()(
  persist(
    (set, get) => {
      const rpc = (name: string, args: Record<string, unknown> = {}) => {
        if (supabaseEnabled) void import("./supabase/data").then(({ runRpc }) => runRpc(name, args)).catch(() => undefined);
      };
      const write = (table: string, operation: "insert" | "upsert" | "update" | "delete", payload: Record<string, unknown>, match?: Record<string, unknown>) => {
        if (!supabaseEnabled) return;
        void import("./supabase/client").then(async ({ getSupabase }) => {
          const client = getSupabase();
          const criteria = Object.entries(match ?? {});
          let response;
          if (operation === "insert") response = await client.from(table).insert(payload);
          else if (operation === "upsert") response = await client.from(table).upsert(payload);
          else if (operation === "update") {
            let query = client.from(table).update(payload);
            for (const [key, value] of criteria) query = query.eq(key, value);
            response = await query;
          } else {
            let query = client.from(table).delete();
            for (const [key, value] of criteria) query = query.eq(key, value);
            response = await query;
          }
          const { error } = response;
          if (error) throw error;
          const { loadSupabaseData } = await import("./supabase/data");
          await loadSupabaseData();
        }).catch((error: unknown) => import("./supabase/data").then(({ showSupabaseError }) => showSupabaseError(error)));
      };
      const timerStepMs = (sessionId: ID) => {
        const st = get();
        const session = st.sessions.find((s) => s.id === sessionId);
        if (!session) return 0;
        const group = st.groups.find((g) => g.id === session.groupId);
        const steps = stepsFor(session.template, session.durationMin, teachersFor(st, session, group));
        return Math.round((steps[session.currentStep]?.minutes ?? 0) * 60_000);
      };
      const me = () => get().currentUserId!;
      const patchSession = (id: ID, fn: (s: Session) => Session) =>
        set((st) => ({ sessions: st.sessions.map((s) => (s.id === id ? fn(s) : s)) }));
      const patchGroup = (id: ID, fn: (g: Group) => Group) =>
        set((st) => ({ groups: st.groups.map((g) => (g.id === id ? fn(g) : g)) }));

      return {
        ...(supabaseEnabled ? emptyData : createSeed()),
        currentUserId: null,
        onboarded: false,

        signIn: () => { if (!supabaseEnabled) set({ currentUserId: "u-ada" }); },
        signOut: () => {
          if (supabaseEnabled) void import("./supabase/client").then(({ getSupabase }) => getSupabase().auth.signOut()).then(() => set({ currentUserId: null, onboarded: false }));
          else set({ currentUserId: null });
        },
        updateProfile: (patch) =>
          supabaseEnabled
            ? write("profiles", "update", { ...(patch.name !== undefined ? { name: patch.name } : {}), ...(patch.school !== undefined ? { school: patch.school } : {}), ...(patch.emailPrefs ? { email_reminders: patch.emailPrefs.reminders, email_group_activity: patch.emailPrefs.groupActivity, email_retros: patch.emailPrefs.retros } : {}) }, { id: me() })
            : set((st) => ({ users: st.users.map((u) => (u.id === st.currentUserId ? { ...u, ...patch } : u)) })),
        completeOnboarding: () => { if (supabaseEnabled) { set({ onboarded: true }); write("profiles", "update", { onboarded: true }, { id: me() }); } else set({ onboarded: true }); },
        resetDemo: () => { if (!supabaseEnabled) set({ ...createSeed(), onboarded: true }); },

        createCourse: ({ code, title, school }) => {
          if (supabaseEnabled) {
            return { ok: false, error: "Use the asynchronous Supabase course action." };
          }
          const norm = (s: string) => s.replace(/\s+/g, "").toLowerCase();
          const exists = get().courses.find((c) => norm(c.code) === norm(code) && norm(c.school) === norm(school));
          if (exists) return { ok: false, error: `${exists.code} at ${exists.school} already exists. Join it instead.` };
          const id = uid("c");
          const formatted = code.trim().toUpperCase().replace(/^([A-Z]+)\s*(\d+)/, "$1 $2");
          set((st) => ({
            courses: [...st.courses, { id, code: formatted, title: title.trim(), school: school.trim(), createdBy: me() }],
            courseMembers: { ...st.courseMembers, [id]: [me()] },
          }));
          return { ok: true, id };
        },
        joinCourse: (courseId) => supabaseEnabled
          ? write("course_members", "upsert", { course_id: courseId, user_id: me() })
          :
          set((st) => ({
            courseMembers: {
              ...st.courseMembers,
              [courseId]: Array.from(new Set([...(st.courseMembers[courseId] ?? []), me()])),
            },
          })),
        leaveCourse: (courseId) => supabaseEnabled
          ? write("course_members", "delete", {}, { course_id: courseId, user_id: me() })
          :
          set((st) => ({
            courseMembers: { ...st.courseMembers, [courseId]: (st.courseMembers[courseId] ?? []).filter((u) => u !== me()) },
          })),

        createGroup: (input) => {
          if (supabaseEnabled) {
            throw new Error("Use the asynchronous Supabase group action.");
          }
          const id = uid("g");
          const now = new Date().toISOString();
          get().joinCourse(input.courseId);
          set((st) => ({
            groups: [
              ...st.groups,
              {
                id,
                ...input,
                inviteCode: inviteCode(input.name),
                ownerId: me(),
                members: [{ userId: me(), role: "owner", status: "active", joinedAt: now }],
                createdAt: now,
              },
            ],
          }));
          return id;
        },
        updateGroup: (groupId, patch) => supabaseEnabled
          ? write("groups", "update", { ...(patch.name !== undefined ? { name: patch.name } : {}), ...(patch.description !== undefined ? { description: patch.description } : {}), ...(patch.maxSize !== undefined ? { max_size: patch.maxSize } : {}), ...(patch.visibility !== undefined ? { visibility: patch.visibility } : {}), ...(patch.goal !== undefined ? { goal: patch.goal } : {}), ...(patch.norms !== undefined ? { norms: patch.norms } : {}), ...(patch.cadence !== undefined ? { cadence: patch.cadence } : {}), ...(patch.examDate !== undefined ? { exam_date: patch.examDate } : {}), ...(patch.pinnedMessage !== undefined ? { pinned_message: patch.pinnedMessage } : {}) }, { id: groupId })
          : patchGroup(groupId, (g) => ({ ...g, ...patch })),
        joinGroup: (groupId) => {
          if (supabaseEnabled) {
            throw new Error("Use the asynchronous Supabase group join action.");
          }
          const g = get().groups.find((x) => x.id === groupId);
          if (!g) return "full";
          if (g.members.some((mm) => mm.userId === me())) return "already";
          if (g.members.filter((mm) => mm.status === "active").length >= g.maxSize) return "full";
          const status = g.visibility === "public" ? "active" : "pending";
          get().joinCourse(g.courseId);
          patchGroup(groupId, (gg) => ({
            ...gg,
            members: [...gg.members, { userId: me(), role: "member", status, joinedAt: new Date().toISOString() }],
          }));
          return status === "active" ? "joined" : "pending";
        },
        approveMember: (groupId, userId) => supabaseEnabled ? rpc("approve_member", { group_id: groupId, user_id: userId }) :
          patchGroup(groupId, (g) => ({
            ...g,
            members: g.members.map((mm) => (mm.userId === userId ? { ...mm, status: "active" } : mm)),
          })),
        declineMember: (groupId, userId) => supabaseEnabled ? rpc("decline_member", { group_id: groupId, user_id: userId }) :
          patchGroup(groupId, (g) => ({ ...g, members: g.members.filter((mm) => mm.userId !== userId) })),
        removeMember: (groupId, userId) => supabaseEnabled ? rpc("remove_member", { group_id: groupId, user_id: userId }) :
          patchGroup(groupId, (g) => ({ ...g, members: g.members.filter((mm) => mm.userId !== userId) })),
        leaveGroup: (groupId) => supabaseEnabled ? rpc("leave_group", { group_id: groupId }) :
          patchGroup(groupId, (g) => ({ ...g, members: g.members.filter((mm) => mm.userId !== me()) })),
        transferOwnership: (groupId, userId) => supabaseEnabled ? rpc("transfer_ownership", { group_id: groupId, user_id: userId }) :
          patchGroup(groupId, (g) => ({
            ...g,
            ownerId: userId,
            members: g.members.map((mm) => ({
              ...mm,
              role: mm.userId === userId ? "owner" : mm.role === "owner" ? "member" : mm.role,
            })),
          })),

        saveAvailability: (groupId, slots) => supabaseEnabled ? rpc("save_availability", { group_id: groupId, slots }) :
          set((st) => {
            const rest = st.availability.filter((a) => !(a.groupId === groupId && a.userId === me()));
            const entry: Availability = { groupId, userId: me(), slots, updatedAt: new Date().toISOString() };
            return { availability: [...rest, entry] };
          }),

        createSession: (input) => {
          if (supabaseEnabled) {
            throw new Error("Use the asynchronous Supabase session action.");
          }
          const st = get();
          const group = st.groups.find((g) => g.id === input.groupId)!;
          const active = group.members.filter((mm) => mm.status === "active").map((mm) => mm.userId);
          const seriesId = input.recurrence === "none" ? undefined : uid("series");
          const first = new Date(input.startsAt);
          const series = occurrences(first, input.recurrence, group.examDate ? new Date(group.examDate) : undefined);
          // A series that starts after the exam still creates the one session asked for
          const dates = series.length ? series : [first];
          const roles = nextRoles(st, input.groupId, active);
          const videoUrl = input.locationType === "video" ? jitsiUrl() : undefined;
          const prep: PrepItem[] = input.prep.filter(Boolean).map((text) => ({ id: uid("p"), text, doneBy: [] }));
          const created: Session[] = dates.map((d) => ({
            id: uid("s"),
            groupId: input.groupId,
            seriesId,
            title: input.title,
            template: input.template,
            startsAt: d.toISOString(),
            durationMin: input.durationMin,
            location: input.locationType === "video" ? "Video call" : input.place || "To be decided",
            videoUrl,
            recurrence: input.recurrence,
            agenda: input.agenda,
            prep: prep.map((p) => ({ ...p, id: uid("p") })),
            status: "scheduled",
            currentStep: 0,
            rsvps: { [me()]: "yes" },
            roles,
            jigsawTopics: input.jigsawTopics,
            notes: { summary: "", openQuestions: "", actionItems: "" },
          }));
          set((s) => ({ sessions: [...s.sessions, ...created] }));
          return created[0].id;
        },
        updateSession: (sessionId, patch) => supabaseEnabled
          ? rpc("update_session", { session_id: sessionId, patch: { ...(patch.title !== undefined ? { title: patch.title } : {}), ...(patch.startsAt !== undefined ? { starts_at: patch.startsAt } : {}), ...(patch.durationMin !== undefined ? { duration_min: patch.durationMin } : {}), ...(patch.location !== undefined ? { location: patch.location } : {}), ...(patch.videoUrl !== undefined ? { video_url: patch.videoUrl } : {}), ...(patch.agenda !== undefined ? { agenda: patch.agenda } : {}), ...(patch.template !== undefined ? { template: patch.template } : {}) } })
          : patchSession(sessionId, (s) => ({ ...s, ...patch })),
        deleteSession: (sessionId) => supabaseEnabled ? rpc("delete_session", { session_id: sessionId }) : set((st) => ({ sessions: st.sessions.filter((s) => s.id !== sessionId) })),
        rsvp: (sessionId, status) => supabaseEnabled ? rpc("rsvp", { session_id: sessionId, status }) :
          patchSession(sessionId, (s) => ({ ...s, rsvps: { ...s.rsvps, [me()]: status } })),
        togglePrep: (sessionId, prepId) => supabaseEnabled ? rpc("toggle_prep", { prep_id: prepId }) :
          patchSession(sessionId, (s) => ({
            ...s,
            prep: s.prep.map((p) =>
              p.id !== prepId ? p : { ...p, doneBy: p.doneBy.includes(me()) ? p.doneBy.filter((u) => u !== me()) : [...p.doneBy, me()] },
            ),
          })),
        startSession: (sessionId) => supabaseEnabled ? rpc("start_session", { sid: sessionId }) :
          patchSession(sessionId, (s) => ({
            ...s,
            status: "live",
            currentStep: 0,
            stepStartedAt: new Date().toISOString(),
            pausedRemainingMs: undefined,
          })),
        goToStep: (sessionId, step) => supabaseEnabled ? rpc("go_to_step", { sid: sessionId, step }) :
          patchSession(sessionId, (s) => ({
            ...s,
            currentStep: step,
            stepStartedAt: new Date().toISOString(),
            pausedRemainingMs: undefined,
          })),
        pauseSession: (sessionId) => supabaseEnabled ? rpc("pause_session", { sid: sessionId, step_ms: timerStepMs(sessionId) }) :
          patchSession(sessionId, (s) => {
            const st = get();
            const group = st.groups.find((g) => g.id === s.groupId);
            const steps = stepsFor(s.template, s.durationMin, teachersFor(st, s, group));
            const step = steps[s.currentStep];
            const elapsed = Date.now() - new Date(s.stepStartedAt ?? Date.now()).getTime();
            return { ...s, pausedRemainingMs: Math.max(0, (step?.minutes ?? 0) * 60_000 - elapsed) };
          }),
        resumeSession: (sessionId) => supabaseEnabled ? rpc("resume_session", { sid: sessionId, step_ms: timerStepMs(sessionId) }) :
          patchSession(sessionId, (s) => {
            const st = get();
            const group = st.groups.find((g) => g.id === s.groupId);
            const steps = stepsFor(s.template, s.durationMin, teachersFor(st, s, group));
            const total = (steps[s.currentStep]?.minutes ?? 0) * 60_000;
            const remaining = s.pausedRemainingMs ?? total;
            return {
              ...s,
              stepStartedAt: new Date(Date.now() - (total - remaining)).toISOString(),
              pausedRemainingMs: undefined,
            };
          }),
        endSession: (sessionId) => supabaseEnabled ? rpc("end_session", { sid: sessionId }) : patchSession(sessionId, (s) => ({ ...s, status: "ended", pausedRemainingMs: undefined })),
        updateNotes: (sessionId, patch) => supabaseEnabled ? rpc("update_notes", { sid: sessionId, summary: patch.summary ?? null, open_questions: patch.openQuestions ?? null, action_items: patch.actionItems ?? null }) :
          patchSession(sessionId, (s) => ({ ...s, notes: { ...s.notes, ...patch, updatedAt: new Date().toISOString() } })),

        addQuestion: (input) => supabaseEnabled ? write("questions", "insert", { group_id: input.groupId, topic: input.topic, prompt: input.prompt, answer: input.answer, explanation: input.explanation ?? null, created_by: me() }) :
          set((st) => ({
            questions: [{ ...input, id: uid("q"), createdBy: me(), createdAt: new Date().toISOString() }, ...st.questions],
          })),
        updateQuestion: (id, patch) => supabaseEnabled ? write("questions", "update", { ...(patch.topic !== undefined ? { topic: patch.topic } : {}), ...(patch.prompt !== undefined ? { prompt: patch.prompt } : {}), ...(patch.answer !== undefined ? { answer: patch.answer } : {}), ...(patch.explanation !== undefined ? { explanation: patch.explanation } : {}) }, { id }) :
          set((st) => ({ questions: st.questions.map((q) => (q.id === id ? { ...q, ...patch } : q)) })),
        deleteQuestion: (id) => supabaseEnabled ? write("questions", "delete", {}, { id }) : set((st) => ({ questions: st.questions.filter((q) => q.id !== id) })),
        recordAttempt: (questionId, correct) => supabaseEnabled ? write("quiz_attempts", "insert", { user_id: me(), question_id: questionId, correct }) :
          set((st) => ({
            quizAttempts: [
              ...st.quizAttempts,
              { id: uid("a"), userId: me(), questionId, correct, attemptedAt: new Date().toISOString() },
            ],
          })),

        submitRetro: (retro) => supabaseEnabled ? rpc("submit_retro", { sid: retro.sessionId, rating: retro.rating, helped: retro.helped, change: retro.change, balanced: retro.balanced }) :
          set((st) => ({
            retros: [...st.retros.filter((r) => !(r.sessionId === retro.sessionId && r.userId === me())), { ...retro, userId: me() }],
          })),

        sendMessage: (groupId, body) => {
          if (supabaseEnabled) { write("messages", "insert", { group_id: groupId, user_id: me(), body }); return; }
          const message: Message = { id: uid("m"), groupId, userId: me(), body, createdAt: new Date().toISOString() };
          set((st) => ({ messages: [...st.messages, message] }));
        },
        receiveMessage: (input) =>
          set((st) => ({ messages: [...st.messages, { ...input, id: uid("m"), createdAt: new Date().toISOString() }] })),
      };
    },
    {
      name: "studycircle-demo-v1",
      storage: createJSONStorage(() => supabaseEnabled ? inertStorage : localStorage),
      skipHydration: true,
    },
  ),
);

export function teachersFor(
  st: Pick<SeedData, "users">,
  session: Session,
  group: Group | undefined,
): { name: string; topic?: string }[] {
  if (session.template !== "jigsaw" || !group) return [];
  return group.members
    .filter((m) => m.status === "active" && session.jigsawTopics[m.userId])
    .map((m) => ({
      name: st.users.find((u) => u.id === m.userId)?.name ?? "Member",
      topic: session.jigsawTopics[m.userId],
    }));
}
