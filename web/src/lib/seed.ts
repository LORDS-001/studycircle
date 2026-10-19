import { addDays, setHours, setMinutes, startOfDay, subDays } from "date-fns";
import type {
  Availability,
  Course,
  Group,
  Message,
  Question,
  QuizAttempt,
  Retro,
  Session,
  User,
} from "./types";

/** Demo dataset. Dates are relative to "now" so the demo never goes stale. */
export function createSeed(now = new Date()) {
  const at = (dayOffset: number, h: number, m = 0) =>
    setMinutes(setHours(startOfDay(addDays(now, dayOffset)), h), m).toISOString();
  const ago = (days: number) => subDays(now, days).toISOString();
  const prefs = { reminders: true, groupActivity: true, retros: true };

  const users: User[] = [
    { id: "u-ada", name: "Ada Okafor", email: "ada@unilag.edu.ng", school: "University of Lagos", hue: 168, emailPrefs: prefs },
    { id: "u-tunde", name: "Tunde Bakare", email: "tunde@unilag.edu.ng", school: "University of Lagos", hue: 220, emailPrefs: prefs },
    { id: "u-chioma", name: "Chioma Eze", email: "chioma@unilag.edu.ng", school: "University of Lagos", hue: 28, emailPrefs: prefs },
    { id: "u-kemi", name: "Kemi Adeyemi", email: "kemi@unilag.edu.ng", school: "University of Lagos", hue: 330, emailPrefs: prefs },
    { id: "u-ife", name: "Ifeanyi Obi", email: "ife@unilag.edu.ng", school: "University of Lagos", hue: 260, emailPrefs: prefs },
    { id: "u-zainab", name: "Zainab Musa", email: "zainab@unilag.edu.ng", school: "University of Lagos", hue: 120, emailPrefs: prefs },
    { id: "u-david", name: "David Olatunji", email: "david@unilag.edu.ng", school: "University of Lagos", hue: 0, emailPrefs: prefs },
    { id: "u-fola", name: "Folake Ajayi", email: "fola@unilag.edu.ng", school: "University of Lagos", hue: 290, emailPrefs: prefs },
  ];

  const courses: Course[] = [
    { id: "c-csc201", code: "CSC 201", title: "Data Structures", school: "University of Lagos", createdBy: "u-ada" },
    { id: "c-mth201", code: "MTH 201", title: "Linear Algebra", school: "University of Lagos", createdBy: "u-zainab" },
    { id: "c-csc205", code: "CSC 205", title: "Operating Systems", school: "University of Lagos", createdBy: "u-david" },
    { id: "c-sta211", code: "STA 211", title: "Probability I", school: "University of Lagos", createdBy: "u-fola" },
  ];

  const courseMembers: Record<string, string[]> = {
    "c-csc201": ["u-ada", "u-tunde", "u-chioma", "u-kemi", "u-ife", "u-david", "u-fola", "u-zainab"],
    "c-mth201": ["u-ada", "u-zainab", "u-tunde", "u-fola", "u-david"],
    "c-csc205": ["u-david", "u-ife"],
    "c-sta211": ["u-fola", "u-kemi"],
  };

  const m = (userId: string, role: "owner" | "member" = "member", days = 20) => ({
    userId,
    role,
    status: "active" as const,
    joinedAt: ago(days),
  });

  const groups: Group[] = [
    {
      id: "g-trees",
      courseId: "c-csc201",
      name: "Trees and Graphs Crew",
      description: "Second-years working through CSC 201 one chapter a week, with a mock exam before the real one.",
      maxSize: 5,
      visibility: "private",
      goal: "a",
      norms: ["Come prepared", "Cameras on", "Phones face down", "Ask “why?” out loud"],
      cadence: "Twice weekly",
      examDate: at(34, 9),
      inviteCode: "TREE-4KX9",
      ownerId: "u-ada",
      members: [m("u-ada", "owner", 28), m("u-tunde", "member", 26), m("u-chioma", "member", 25), m("u-kemi", "member", 22), m("u-ife", "member", 12)],
      pinnedMessage: "Bring 2 questions from Chapter 4 to the next Retrieval Round.",
      createdAt: ago(28),
    },
    {
      id: "g-nightowls",
      courseId: "c-csc201",
      name: "Night Owls",
      description: "Late-evening co-working for people with day jobs. Quiet focus, short check-ins.",
      maxSize: 6,
      visibility: "public",
      goal: "b-plus",
      norms: ["Mics off during focus", "Share one goal"],
      cadence: "Weekly",
      examDate: at(34, 9),
      inviteCode: "OWLS-77QP",
      ownerId: "u-david",
      members: [m("u-david", "owner"), m("u-fola"), m("u-zainab")],
      createdAt: ago(18),
    },
    {
      id: "g-matrix",
      courseId: "c-mth201",
      name: "Eigen Friends",
      description: "Working every past paper from the last five years before the final.",
      maxSize: 4,
      visibility: "public",
      goal: "b-plus",
      norms: ["Attempt problems before the session", "No phones"],
      cadence: "Weekly",
      examDate: at(41, 13),
      inviteCode: "EIGN-2M8D",
      ownerId: "u-zainab",
      members: [m("u-zainab", "owner"), m("u-ada", "member", 15), m("u-tunde", "member", 14), m("u-fola", "member", 9)],
      createdAt: ago(16),
    },
    {
      id: "g-proofs",
      courseId: "c-mth201",
      name: "Proof Club",
      description: "For people who want to really understand the proofs, not just memorise them.",
      maxSize: 5,
      visibility: "public",
      goal: "mastery",
      norms: ["Explain in your own words"],
      cadence: "Twice weekly",
      inviteCode: "PRUF-91LA",
      ownerId: "u-david",
      members: [m("u-david", "owner"), m("u-fola")],
      createdAt: ago(6),
    },
  ];

  const trees = ["u-ada", "u-tunde", "u-chioma", "u-kemi", "u-ife"];

  const baseSession = {
    recurrence: "twice-weekly" as const,
    seriesId: "s-series-trees",
    status: "scheduled" as const,
    currentStep: 0,
    roles: {},
    jigsawTopics: {},
    notes: { summary: "", openQuestions: "", actionItems: "" },
  };

  const sessions: Session[] = [
    {
      ...baseSession,
      id: "s-past-1",
      groupId: "g-trees",
      title: "Binary search trees",
      template: "retrieval",
      startsAt: at(-8, 18),
      durationMin: 60,
      location: "Video call",
      videoUrl: "https://meet.jit.si/studycircle-trees-8f3k2m9q1x",
      agenda: "BST insert, delete and the three traversals.",
      prep: [{ id: "p1", text: "Read Chapter 3", doneBy: trees }],
      status: "ended",
      rsvps: { "u-ada": "yes", "u-tunde": "yes", "u-chioma": "yes", "u-kemi": "maybe", "u-ife": "yes" },
      roles: { "u-ada": "facilitator", "u-tunde": "timekeeper", "u-chioma": "scribe", "u-kemi": "questioner" },
      notes: {
        summary: "Covered insert and delete. Deleting a node with two children still trips people up: use the in-order successor.",
        openQuestions: "Why is the worst case O(n)? What makes a tree balanced?",
        actionItems: "Tunde: add 3 questions on traversals.\nKemi: find a good AVL rotation visual.",
        updatedAt: at(-8, 19),
      },
    },
    {
      ...baseSession,
      id: "s-past-2",
      groupId: "g-trees",
      title: "Heaps and priority queues",
      template: "jigsaw",
      startsAt: at(-4, 18),
      durationMin: 75,
      location: "Faculty of Science, Room 204",
      agenda: "Each person teaches one heap operation.",
      prep: [{ id: "p1", text: "Prepare your 10-minute explanation", doneBy: ["u-ada", "u-tunde", "u-chioma", "u-ife"] }],
      status: "ended",
      rsvps: { "u-ada": "yes", "u-tunde": "yes", "u-chioma": "yes", "u-kemi": "no", "u-ife": "yes" },
      roles: { "u-tunde": "facilitator", "u-chioma": "timekeeper", "u-kemi": "scribe", "u-ife": "questioner" },
      jigsawTopics: { "u-ada": "Heapify", "u-tunde": "Insert and sift-up", "u-chioma": "Extract-min", "u-ife": "Heapsort" },
      notes: {
        summary: "Everyone taught their operation. Heapify in O(n) was the big surprise.",
        openQuestions: "Proof that build-heap is O(n), not O(n log n).",
        actionItems: "Ada: share the build-heap proof.",
        updatedAt: at(-4, 19, 20),
      },
    },
    {
      ...baseSession,
      id: "s-next",
      groupId: "g-trees",
      title: "Trees and graphs",
      template: "retrieval",
      startsAt: at(1, 18),
      durationMin: 60,
      location: "Video call",
      videoUrl: "https://meet.jit.si/studycircle-trees-r7c2x0vm4p",
      agenda: "Graph representations, BFS and DFS. Then the hardest tree questions from the bank.",
      prep: [
        { id: "p1", text: "Bring 2 questions from Chapter 4", doneBy: ["u-tunde", "u-chioma"] },
        { id: "p2", text: "Skim the BFS/DFS lecture slides", doneBy: ["u-chioma"] },
      ],
      rsvps: { "u-tunde": "yes", "u-chioma": "yes", "u-kemi": "maybe", "u-ife": "yes" },
      roles: { "u-chioma": "facilitator", "u-kemi": "timekeeper", "u-ife": "scribe", "u-ada": "questioner" },
    },
    {
      ...baseSession,
      id: "s-next-2",
      groupId: "g-trees",
      title: "Shortest paths",
      template: "jigsaw",
      startsAt: at(5, 18),
      durationMin: 75,
      location: "Video call",
      videoUrl: "https://meet.jit.si/studycircle-trees-k2p9w8qa3z",
      agenda: "Dijkstra, Bellman-Ford, Floyd-Warshall and topological sort.",
      prep: [{ id: "p1", text: "Prepare your subtopic", doneBy: [] }],
      rsvps: { "u-ada": "yes", "u-tunde": "maybe" },
      roles: { "u-kemi": "facilitator", "u-ife": "timekeeper", "u-ada": "scribe", "u-tunde": "questioner" },
      jigsawTopics: { "u-ada": "Dijkstra", "u-tunde": "Bellman-Ford", "u-chioma": "Floyd-Warshall", "u-kemi": "Topological sort", "u-ife": "Minimum spanning trees" },
    },
    {
      ...baseSession,
      id: "s-matrix-next",
      groupId: "g-matrix",
      seriesId: "s-series-matrix",
      recurrence: "weekly",
      title: "Past paper: 2023",
      template: "cowork",
      startsAt: at(2, 16),
      durationMin: 90,
      location: "Main Library, 2nd floor",
      agenda: "Work the 2023 paper under exam conditions, then mark together.",
      prep: [{ id: "p1", text: "Print the 2023 paper", doneBy: ["u-zainab"] }],
      rsvps: { "u-zainab": "yes", "u-tunde": "yes", "u-fola": "maybe" },
    },
  ];

  const q = (id: string, topic: string, prompt: string, answer: string, createdBy: string, explanation?: string): Question => ({
    id,
    groupId: "g-trees",
    topic,
    prompt,
    answer,
    explanation,
    createdBy,
    createdAt: ago(Math.floor(Math.random() * 20) + 1),
  });

  const questions: Question[] = [
    q("q1", "Trees", "What is the worst-case time to search an unbalanced BST with n nodes?", "O(n)", "u-tunde", "If keys arrive in sorted order the tree degenerates into a linked list."),
    q("q2", "Trees", "Which traversal of a BST visits keys in sorted order?", "In-order traversal (left, node, right).", "u-tunde"),
    q("q3", "Trees", "When deleting a BST node with two children, what replaces it?", "Its in-order successor (smallest key in the right subtree), or in-order predecessor.", "u-chioma"),
    q("q4", "Heaps", "What is the time complexity of building a heap from n elements?", "O(n)", "u-ada", "Most nodes are near the bottom and sift down only a short distance; the sum converges to O(n)."),
    q("q5", "Heaps", "In a min-heap stored as an array, where are the children of index i?", "2i + 1 and 2i + 2 (0-indexed).", "u-ife"),
    q("q6", "Graphs", "Which data structure does BFS use?", "A queue (FIFO).", "u-chioma"),
    q("q7", "Graphs", "Adjacency list or matrix for a sparse graph?", "Adjacency list: O(V + E) space instead of O(V²).", "u-kemi"),
    q("q8", "Graphs", "What does DFS use to detect a cycle in a directed graph?", "A back edge: reaching a vertex that is still on the recursion stack (grey).", "u-ada"),
    q("q9", "Hashing", "What is the load factor of a hash table?", "n / m: the number of stored keys divided by the number of buckets.", "u-tunde"),
    q("q10", "Hashing", "Name two ways to resolve collisions.", "Separate chaining and open addressing (linear probing, quadratic probing, double hashing).", "u-kemi"),
    q("q11", "Trees", "What property must an AVL tree maintain?", "For every node, the heights of the left and right subtrees differ by at most 1.", "u-chioma"),
    q("q12", "Graphs", "Why can't Dijkstra handle negative edge weights?", "It finalises a vertex once popped; a later negative edge could have produced a shorter path.", "u-ife"),
  ];

  const quizAttempts: QuizAttempt[] = [
    { id: "a1", userId: "u-ada", questionId: "q1", correct: true, attemptedAt: ago(3) },
    { id: "a2", userId: "u-ada", questionId: "q2", correct: true, attemptedAt: ago(3) },
    { id: "a3", userId: "u-ada", questionId: "q3", correct: false, attemptedAt: ago(3) },
    { id: "a4", userId: "u-ada", questionId: "q6", correct: true, attemptedAt: ago(2) },
    { id: "a5", userId: "u-ada", questionId: "q12", correct: false, attemptedAt: ago(2) },
    { id: "a6", userId: "u-ada", questionId: "q9", correct: true, attemptedAt: ago(1) },
  ];

  const retros: Retro[] = [
    { sessionId: "s-past-1", userId: "u-tunde", rating: 5, helped: "Answering alone first showed me what I didn't know.", change: "Start on time.", balanced: "yes" },
    { sessionId: "s-past-1", userId: "u-chioma", rating: 4, helped: "The questioner role kept us honest.", change: "Fewer questions, more depth.", balanced: "somewhat" },
    { sessionId: "s-past-1", userId: "u-ada", rating: 4, helped: "Comparing answers.", change: "Share questions before the session.", balanced: "yes" },
    { sessionId: "s-past-2", userId: "u-tunde", rating: 5, helped: "Teaching heapify made it click.", change: "Keep turns to 10 minutes.", balanced: "yes" },
    { sessionId: "s-past-2", userId: "u-ife", rating: 4, helped: "Hearing it explained four ways.", change: "A shared diagram board.", balanced: "yes" },
  ];

  const msg = (id: string, userId: string, body: string, minutesAgo: number): Message => ({
    id,
    groupId: "g-trees",
    userId,
    body,
    createdAt: new Date(now.getTime() - minutesAgo * 60_000).toISOString(),
  });

  const messages: Message[] = [
    msg("m1", "u-tunde", "Added 3 traversal questions to the bank from last session", 60 * 26),
    msg("m2", "u-kemi", "Found a really good AVL rotation visual: https://visualgo.net/en/bst", 60 * 25),
    msg("m3", "u-ada", "Nice, thanks both. Next session is a Retrieval Round on graphs. Bring 2 questions from Chapter 4.", 60 * 20),
    msg("m4", "u-chioma", "Can we do BFS vs DFS first? I keep mixing up when to use which", 60 * 3),
    msg("m5", "u-ife", "+1, and topological sort if there's time", 60 * 2),
    msg("m6", "u-ada", "Good call. I'll put it first in the agenda.", 45),
  ];

  // Availability: weekday 0-6 (Mon-Sun), slot 0-31 (07:00 + 30 min * slot)
  const range = (day: number, from: number, to: number) =>
    Array.from({ length: to - from }, (_, i) => `${day}:${from + i}`);
  const availability: Availability[] = [
    { groupId: "g-trees", userId: "u-ada", slots: [...range(0, 20, 28), ...range(1, 22, 28), ...range(3, 20, 28), ...range(5, 6, 14)], updatedAt: ago(2) },
    { groupId: "g-trees", userId: "u-tunde", slots: [...range(0, 18, 26), ...range(3, 20, 30), ...range(4, 16, 24), ...range(5, 4, 12)], updatedAt: ago(3) },
    { groupId: "g-trees", userId: "u-chioma", slots: [...range(1, 20, 26), ...range(3, 21, 27), ...range(5, 6, 10), ...range(6, 14, 20)], updatedAt: ago(4) },
    { groupId: "g-trees", userId: "u-kemi", slots: [...range(0, 22, 28), ...range(3, 22, 28), ...range(5, 8, 14)], updatedAt: ago(1) },
    { groupId: "g-trees", userId: "u-ife", slots: [...range(2, 18, 24), ...range(3, 22, 30), ...range(5, 6, 12)], updatedAt: ago(5) },
  ];

  return {
    users,
    courses,
    courseMembers,
    groups,
    sessions,
    questions,
    quizAttempts,
    retros,
    messages,
    availability,
  };
}

export type SeedData = ReturnType<typeof createSeed>;
