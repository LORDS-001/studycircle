import type {
  Availability,
  Course,
  Group,
  GroupMember,
  Message,
  PrepItem,
  Question,
  QuizAttempt,
  Retro,
  Session,
  User,
} from "../types";

type Row = Record<string, unknown>;
const str = (row: Row, key: string) => String(row[key] ?? "");
const num = (row: Row, key: string) => Number(row[key] ?? 0);
const bool = (row: Row, key: string) => Boolean(row[key]);
const array = <T,>(row: Row, key: string): T[] => (Array.isArray(row[key]) ? (row[key] as T[]) : []);

export const mapUser = (r: Row): User => ({
  id: str(r, "id"), name: str(r, "name"), email: str(r, "email"), school: str(r, "school"),
  avatarUrl: r.avatar_url ? str(r, "avatar_url") : undefined, hue: num(r, "hue"),
  emailPrefs: { reminders: bool(r, "email_reminders"), groupActivity: bool(r, "email_group_activity"), retros: bool(r, "email_retros") },
});
export const mapCourse = (r: Row): Course => ({ id: str(r, "id"), code: str(r, "code"), title: str(r, "title"), school: str(r, "school"), createdBy: str(r, "created_by") });
export const mapGroupMember = (r: Row): GroupMember => ({ userId: str(r, "user_id"), role: str(r, "role") as GroupMember["role"], status: str(r, "status") as GroupMember["status"], joinedAt: str(r, "joined_at") });
export const mapGroup = (r: Row, members: GroupMember[]): Group => ({
  id: str(r, "id"), courseId: str(r, "course_id"), name: str(r, "name"), description: str(r, "description"), maxSize: num(r, "max_size"),
  visibility: str(r, "visibility") as Group["visibility"], goal: str(r, "goal") as Group["goal"], norms: array<string>(r, "norms"), cadence: str(r, "cadence"),
  examDate: r.exam_date ? str(r, "exam_date") : undefined, inviteCode: str(r, "invite_code"), ownerId: str(r, "owner_id"), members,
  pinnedMessage: r.pinned_message ? str(r, "pinned_message") : undefined, createdAt: str(r, "created_at"),
});
export const mapAvailability = (r: Row): Availability => ({ groupId: str(r, "group_id"), userId: str(r, "user_id"), slots: array<string>(r, "slots"), updatedAt: str(r, "updated_at") });
export const mapSession = (r: Row, prep: PrepItem[], rsvps: Session["rsvps"], roles: Session["roles"], jigsawTopics: Session["jigsawTopics"]): Session => ({
  id: str(r, "id"), groupId: str(r, "group_id"), seriesId: r.series_id ? str(r, "series_id") : undefined, title: str(r, "title"),
  template: str(r, "template") as Session["template"], startsAt: str(r, "starts_at"), durationMin: num(r, "duration_min"), location: str(r, "location"),
  videoUrl: r.video_url ? str(r, "video_url") : undefined, recurrence: str(r, "recurrence") as Session["recurrence"], agenda: str(r, "agenda"), prep,
  status: str(r, "status") as Session["status"], currentStep: num(r, "current_step"), stepStartedAt: r.step_started_at ? str(r, "step_started_at") : undefined,
  pausedRemainingMs: r.paused_remaining_ms == null ? undefined : num(r, "paused_remaining_ms"), rsvps, roles, jigsawTopics,
  notes: { summary: str(r, "notes_summary"), openQuestions: str(r, "notes_open_questions"), actionItems: str(r, "notes_action_items"), updatedAt: r.notes_updated_at ? str(r, "notes_updated_at") : undefined },
});
export const mapQuestion = (r: Row): Question => ({ id: str(r, "id"), groupId: str(r, "group_id"), topic: str(r, "topic"), prompt: str(r, "prompt"), answer: str(r, "answer"), explanation: r.explanation ? str(r, "explanation") : undefined, createdBy: str(r, "created_by"), createdAt: str(r, "created_at") });
export const mapQuizAttempt = (r: Row): QuizAttempt => ({ id: str(r, "id"), userId: str(r, "user_id"), questionId: str(r, "question_id"), correct: bool(r, "correct"), attemptedAt: str(r, "attempted_at") });
export const mapRetro = (r: Row): Retro => ({ sessionId: str(r, "session_id"), userId: str(r, "user_id"), rating: num(r, "rating"), helped: str(r, "helped"), change: str(r, "change"), balanced: str(r, "balanced") as Retro["balanced"] });
export const mapMessage = (r: Row): Message => ({ id: str(r, "id"), groupId: str(r, "group_id"), userId: str(r, "user_id"), body: str(r, "body"), createdAt: str(r, "created_at") });

export const mapPrep = (rows: Row[], done: Row[]): PrepItem[] => rows.map((r) => ({
  id: str(r, "id"), text: str(r, "text"), doneBy: done.filter((d) => str(d, "prep_id") === str(r, "id")).map((d) => str(d, "user_id")),
}));
