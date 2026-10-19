import type { SessionRole, SessionTemplate } from "./types";

export interface TemplateStep {
  title: string;
  minutes: number;
  instruction: string;
}

export interface TemplateDef {
  id: SessionTemplate;
  name: string;
  short: string;
  description: string;
  defaultDuration: number;
  research: string;
}

export const TEMPLATES: Record<SessionTemplate, TemplateDef> = {
  retrieval: {
    id: "retrieval",
    name: "Retrieval Round",
    short: "Answer from memory, then compare",
    description:
      "Everyone answers questions alone, from memory, then the group compares answers and explains the hardest ideas aloud.",
    defaultDuration: 60,
    research: "Roediger & Karpicke, 2006",
  },
  jigsaw: {
    id: "jigsaw",
    name: "Jigsaw",
    short: "Each member teaches one subtopic",
    description:
      "Each member prepares one subtopic and teaches it to the group, followed by a quick quiz on everything.",
    defaultDuration: 75,
    research: "Fiorella & Mayer, 2013",
  },
  cowork: {
    id: "cowork",
    name: "Co-work",
    short: "Focus cycles with check-ins",
    description:
      "25 minutes of focus, 5 minutes of break. Everyone states a goal at the start and reports back at each break.",
    defaultDuration: 90,
    research: "Pomodoro method",
  },
};

export function stepsFor(
  template: SessionTemplate,
  durationMin: number,
  teachers: { name: string; topic?: string }[] = [],
): TemplateStep[] {
  if (template === "retrieval") {
    return [
      { title: "Check-in and goals", minutes: 5, instruction: "Go round once. What do you want to leave this session knowing?" },
      { title: "Answer alone", minutes: 15, instruction: "Answer the quiz questions on your own, from memory. No notes, no talking." },
      { title: "Compare answers", minutes: 20, instruction: "Compare answers and spend your time on the ones you disagree on." },
      { title: "Explain aloud", minutes: 15, instruction: "Pick the hardest concepts. One person explains, the questioner asks “why?”." },
      { title: "Open questions and retro", minutes: 5, instruction: "Write down what is still unclear, then take the two-minute retro." },
    ];
  }
  if (template === "jigsaw") {
    const teach = teachers.length
      ? teachers.map((t) => ({
          title: `${t.name.split(" ")[0]} teaches`,
          minutes: 10,
          instruction: t.topic ? `${t.topic}. Everyone else listens, then asks one question.` : "Teach your subtopic. Everyone else listens, then asks one question.",
        }))
      : [{ title: "Teaching turns", minutes: 40, instruction: "Each member teaches their subtopic for about 10 minutes." }];
    return [
      { title: "Check-in", minutes: 5, instruction: "Quick round: what is your topic and what is the one idea everyone must get?" },
      ...teach,
      { title: "Quick quiz", minutes: 10, instruction: "Answer questions on every topic, not just your own." },
      { title: "Wrap-up", minutes: 5, instruction: "Note open questions. Who follows up on what?" },
    ];
  }
  const cycles = Math.max(1, Math.round(durationMin / 30));
  const steps: TemplateStep[] = [
    { title: "Set goals", minutes: 3, instruction: "Each person says one concrete goal for this block." },
  ];
  for (let i = 0; i < cycles; i++) {
    steps.push({ title: `Focus ${i + 1}`, minutes: 25, instruction: "Cameras on, mics off. Work on your goal." });
    steps.push({
      title: i === cycles - 1 ? "Final check-in" : `Break ${i + 1}`,
      minutes: 5,
      instruction: "Did you meet your goal? Say it out loud, then stretch.",
    });
  }
  return steps;
}

export const ROLES: Record<SessionRole, { name: string; job: string }> = {
  facilitator: { name: "Facilitator", job: "Keeps the group moving" },
  timekeeper: { name: "Timekeeper", job: "Watches the timer" },
  scribe: { name: "Scribe", job: "Takes the notes" },
  questioner: { name: "Questioner", job: "Asks “why?”" },
};

export const ROLE_ORDER: SessionRole[] = ["facilitator", "timekeeper", "scribe", "questioner"];

export const GOALS = {
  pass: "Pass",
  "b-plus": "B+ or better",
  a: "Aim for an A",
  mastery: "Mastery",
} as const;
