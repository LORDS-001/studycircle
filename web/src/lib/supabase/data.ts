import { toast } from "sonner";
import type { SeedData } from "../seed";
import type { Session as SupabaseSession } from "@supabase/supabase-js";
import { useStore } from "../store";
import type { Group, ID, Session } from "../types";
import { getSupabase } from "./client";
import { mapAvailability, mapCourse, mapGroup, mapGroupMember, mapMessage, mapPrep, mapQuestion, mapQuizAttempt, mapRetro, mapSession, mapUser } from "./mappers";

type Row = Record<string, unknown>;
const value = (row: Row, key: string) => String(row[key] ?? "");
const rows = async (table: string) => {
  const { data, error } = await getSupabase().from(table).select("*");
  if (error) throw error;
  return (data ?? []) as Row[];
};

export async function loadSupabaseData(session?: SupabaseSession | null) {
  const client = getSupabase();
  let activeSession = session;
  if (activeSession === undefined) {
    const { data, error } = await client.auth.getSession();
    if (error) throw error;
    activeSession = data.session;
  }
  if (!activeSession) {
    useStore.setState({ currentUserId: null, onboarded: false });
    return;
  }
  const [profiles, courses, courseRows, groups, groupRows, availabilityRows, sessionRows, rsvpRows, roleRows, prepRows, doneRows, questionRows, attemptRows, retroRows, messageRows] = await Promise.all([
    rows("profiles"), rows("courses"), rows("course_members"), rows("groups"), rows("group_members"), rows("availability"),
    rows("sessions"), rows("session_rsvps"), rows("session_roles"), rows("prep_items"), rows("prep_done"), rows("questions"),
    rows("quiz_attempts"), rows("retros"), rows("messages"),
  ]);
  const users = profiles.map(mapUser);
  const currentProfile = profiles.find((r) => value(r, "id") === activeSession.user.id);
  const mappedGroups = groups.map((r) => mapGroup(r, groupRows.filter((m) => value(m, "group_id") === value(r, "id")).map(mapGroupMember)));
  const mappedSessions: Session[] = sessionRows.map((r) => {
    const id = value(r, "id");
    const rsvps = Object.fromEntries(rsvpRows.filter((x) => value(x, "session_id") === id).map((x) => [value(x, "user_id"), value(x, "status")]));
    const sessionRoles = roleRows.filter((x) => value(x, "session_id") === id);
    return mapSession(
      r,
      mapPrep(prepRows.filter((x) => value(x, "session_id") === id), doneRows),
      rsvps as Session["rsvps"],
      Object.fromEntries(sessionRoles.map((x) => [value(x, "user_id"), x.role ?? undefined])) as Session["roles"],
      Object.fromEntries(sessionRoles.filter((x) => x.jigsaw_topic).map((x) => [value(x, "user_id"), value(x, "jigsaw_topic")])),
    );
  });
  const courseMembers: Record<ID, ID[]> = {};
  for (const row of courseRows) (courseMembers[value(row, "course_id")] ??= []).push(value(row, "user_id"));
  const snapshot: Partial<SeedData> = {
    users, courses: courses.map(mapCourse), courseMembers, groups: mappedGroups,
    sessions: mappedSessions, availability: availabilityRows.map(mapAvailability), questions: questionRows.map(mapQuestion),
    quizAttempts: attemptRows.map(mapQuizAttempt), retros: retroRows.map(mapRetro), messages: messageRows.map(mapMessage),
  };
  useStore.setState({ ...snapshot, currentUserId: activeSession.user.id, onboarded: Boolean(currentProfile?.onboarded) });
}

export async function refreshSupabaseData() {
  try { await loadSupabaseData(); } catch (error) { showSupabaseError(error); }
}

export function errorText(error: unknown) {
  if (error && typeof error === "object" && "message" in error) return String(error.message);
  return "Something went wrong. Please try again.";
}

export function showSupabaseError(error: unknown) {
  toast.error(errorText(error));
}

export async function runRpc(name: string, args: Record<string, unknown> = {}) {
  try {
    const { data, error } = await getSupabase().rpc(name, args);
    if (error) throw error;
    await loadSupabaseData();
    return data;
  } catch (error) {
    showSupabaseError(error);
    throw error;
  }
}

export async function runWrite<T>(write: () => PromiseLike<{ error: { message: string } | null }>, result?: T): Promise<T | undefined> {
  try {
    const { error } = await write();
    if (error) throw error;
    await loadSupabaseData();
    return result;
  } catch (error) {
    showSupabaseError(error);
    return undefined;
  }
}

export async function createGroupInSupabase(input: {
  courseId: ID; name: string; description: string; maxSize: number; visibility: string; goal: string; norms: string[]; cadence: string; examDate?: string;
}) {
  const data = await runRpc("create_group", {
    course_id: input.courseId, name: input.name, description: input.description, max_size: input.maxSize,
    visibility: input.visibility, goal: input.goal, norms: input.norms, cadence: input.cadence, exam_date: input.examDate ?? null,
  });
  const id = value(data as Row, "id");
  if (!id) throw new Error("The group creation returned no ID.");
  return id;
}

export async function createCourseInSupabase(input: { code: string; title: string; school: string }) {
  try {
    const data = await getSupabase().rpc("create_course", input);
    if (data.error) throw data.error;
    const id = value(data.data as Row, "id");
    if (!id) throw new Error("The course creation returned no ID.");
    await loadSupabaseData();
    return { ok: true as const, id };
  } catch (error) {
    return { ok: false as const, error: errorText(error) };
  }
}

export async function createSessionInSupabase(input: {
  groupId: ID; title: string; template: string; startsAt: string; durationMin: number; locationType: string; place?: string;
  recurrence: string; agenda: string; prep: string[]; jigsawTopics: Record<ID, string>;
}) {
  const { error, data } = await getSupabase().rpc("create_session", {
    group_id: input.groupId, title: input.title, template: input.template, starts_at: input.startsAt, duration_min: input.durationMin,
    location_type: input.locationType, place: input.place ?? "", recurrence: input.recurrence, agenda: input.agenda,
    prep: input.prep, jigsaw_topics: input.jigsawTopics,
  });
  if (error) { showSupabaseError(error); throw error; }
  if (!data) {
    const missingId = new Error("The session creation returned no ID.");
    showSupabaseError(missingId);
    throw missingId;
  }
  await loadSupabaseData();
  return data;
}

export async function joinGroupInSupabase(groupId: ID): Promise<"joined" | "pending" | "full" | "already"> {
  const result = await runRpc("join_group", { group_id: groupId });
  if (result === "joined" || result === "pending" || result === "full" || result === "already") return result;
  throw new Error("The group join returned an unexpected result.");
}

export interface InviteGroupPreview {
  group: Group;
  memberCount: number;
  course: { id: ID; code: string; title: string };
}

export async function groupByInviteInSupabase(code: string): Promise<InviteGroupPreview | null> {
  const result = await runRpc("group_by_invite", { code });
  const row = (Array.isArray(result) ? result[0] : result) as Row | null;
  if (!row) return null;

  const cachedGroup = useStore.getState().groups.find((group) => group.id === value(row, "id"));
  const group = mapGroup(row, cachedGroup?.members ?? []);
  return {
    group,
    memberCount: Number(row.member_count ?? group.members.filter((member) => member.status === "active").length),
    course: { id: value(row, "course_id"), code: value(row, "course_code"), title: value(row, "course_title") },
  };
}

export function uuid() { return crypto.randomUUID(); }
