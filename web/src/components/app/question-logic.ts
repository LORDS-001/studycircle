"use client";

import * as React from "react";
import { useStore } from "@/lib/store";
import type { ID, Question, QuizAttempt } from "@/lib/types";

/** This group's questions, newest first. */
export function useGroupQuestions(groupId: ID): Question[] {
  const questions = useStore((s) => s.questions);
  return React.useMemo(
    () =>
      questions
        .filter((q) => q.groupId === groupId)
        .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
    [questions, groupId],
  );
}

/** questionId → whether my latest attempt was "Got it" */
export function latestResults(attempts: QuizAttempt[], userId: ID): Map<ID, boolean> {
  const latest = new Map<ID, QuizAttempt>();
  for (const a of attempts) {
    if (a.userId !== userId) continue;
    const prev = latest.get(a.questionId);
    if (!prev || +new Date(a.attemptedAt) >= +new Date(prev.attemptedAt)) latest.set(a.questionId, a);
  }
  return new Map(Array.from(latest, ([id, a]) => [id, a.correct]));
}

export function useMyResults(userId: ID) {
  const attempts = useStore((s) => s.quizAttempts);
  return React.useMemo(() => latestResults(attempts, userId), [attempts, userId]);
}

/** Topics in alphabetical order with how many questions each has */
export function topicCounts(questions: Question[]) {
  const counts = new Map<string, number>();
  for (const q of questions) counts.set(q.topic, (counts.get(q.topic) ?? 0) + 1);
  return Array.from(counts, ([topic, count]) => ({ topic, count })).sort((a, b) => a.topic.localeCompare(b.topic));
}

/** Per-topic "got it" progress from my latest attempts */
export function topicProgress(questions: Question[], results: Map<ID, boolean>) {
  return topicCounts(questions).map(({ topic, count }) => {
    const inTopic = questions.filter((q) => q.topic === topic);
    return {
      topic,
      total: count,
      gotIt: inTopic.filter((q) => results.get(q.id) === true).length,
      tried: inTopic.filter((q) => results.has(q.id)).length,
    };
  });
}

/** Fisher–Yates; call from event handlers only */
export function shuffle<T>(items: T[]): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
