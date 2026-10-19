// Mirrors the Supabase data model in the MVP spec (section 11).
// When the backend lands, these become the generated DB types.

export type ID = string;

export interface User {
  id: ID;
  name: string;
  email: string;
  school: string;
  avatarUrl?: string;
  /** Hue used for generated avatars, 0-360 */
  hue: number;
  emailPrefs: {
    reminders: boolean;
    groupActivity: boolean;
    retros: boolean;
  };
}

export interface Course {
  id: ID;
  code: string;
  title: string;
  school: string;
  createdBy: ID;
}

export type GroupGoal = "pass" | "b-plus" | "a" | "mastery";
export type Visibility = "public" | "private";
export type MemberRole = "owner" | "member";
export type MemberStatus = "active" | "pending";

export interface GroupMember {
  userId: ID;
  role: MemberRole;
  status: MemberStatus;
  joinedAt: string;
}

export interface Group {
  id: ID;
  courseId: ID;
  name: string;
  description: string;
  maxSize: number;
  visibility: Visibility;
  goal: GroupGoal;
  norms: string[];
  cadence: string;
  examDate?: string;
  inviteCode: string;
  ownerId: ID;
  members: GroupMember[];
  pinnedMessage?: string;
  createdAt: string;
}

/** Availability slots: weekday 0 (Mon) – 6 (Sun), slot 0–31 for 07:00–23:00 in 30-min steps */
export interface Availability {
  groupId: ID;
  userId: ID;
  slots: string[]; // "weekday:slot"
  updatedAt: string;
}

export type SessionTemplate = "retrieval" | "jigsaw" | "cowork";
export type Recurrence = "none" | "weekly" | "twice-weekly";
export type SessionStatus = "scheduled" | "live" | "ended";
export type RsvpStatus = "yes" | "maybe" | "no";
export type SessionRole = "facilitator" | "timekeeper" | "scribe" | "questioner";

export interface PrepItem {
  id: ID;
  text: string;
  doneBy: ID[];
}

export interface Session {
  id: ID;
  groupId: ID;
  seriesId?: ID;
  title: string;
  template: SessionTemplate;
  startsAt: string;
  durationMin: number;
  location: string;
  videoUrl?: string;
  recurrence: Recurrence;
  agenda: string;
  prep: PrepItem[];
  status: SessionStatus;
  currentStep: number;
  stepStartedAt?: string;
  pausedRemainingMs?: number;
  rsvps: Record<ID, RsvpStatus>;
  roles: Record<ID, SessionRole | undefined>;
  jigsawTopics: Record<ID, string>;
  notes: {
    summary: string;
    openQuestions: string;
    actionItems: string;
    updatedAt?: string;
  };
}

export interface Question {
  id: ID;
  groupId: ID;
  topic: string;
  prompt: string;
  answer: string;
  explanation?: string;
  createdBy: ID;
  createdAt: string;
}

export interface QuizAttempt {
  id: ID;
  userId: ID;
  questionId: ID;
  correct: boolean;
  attemptedAt: string;
}

export interface Retro {
  sessionId: ID;
  userId: ID;
  rating: number;
  helped: string;
  change: string;
  balanced: "yes" | "somewhat" | "no";
}

export interface Message {
  id: ID;
  groupId: ID;
  userId: ID;
  body: string;
  createdAt: string;
}
