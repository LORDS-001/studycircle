import Link from "next/link";
import { Check, Puzzle, Timer, Zap } from "lucide-react";
import { Logo, Mark } from "@/components/brand/logo";
import { StepRing } from "@/components/brand/rings";
import { Cycle } from "@/components/marketing/cycle";
import { Button } from "@/components/ui/button";

const PROBLEMS = [
  {
    problem: "Finding a time takes forty messages.",
    fix: "Everyone paints their free hours once. The heatmap picks the top three times.",
  },
  {
    problem: "Sessions turn into chatting or re-reading.",
    fix: "Every session runs on a template with steps, a shared timer and an agenda.",
  },
  {
    problem: "Some people come unprepared.",
    fix: "Prep checklists, rotating roles and a contribution view that thanks people for showing up.",
  },
  {
    problem: "One person ends up doing all the organising.",
    fix: "Reminders, RSVPs and recurring sessions run themselves. Roles rotate every time.",
  },
  {
    problem: "The group fades after the first test.",
    fix: "Recurring sessions up to the exam date, and a two-minute retro that keeps sessions worth showing up for.",
  },
];

const TEMPLATES = [
  {
    icon: Zap,
    name: "Retrieval Round",
    length: "60 min",
    body: "Answer alone from memory, then compare and argue about the disagreements.",
    steps: [
      { label: "Check-in", min: 5 },
      { label: "Answer alone", min: 15 },
      { label: "Compare", min: 20 },
      { label: "Explain aloud", min: 15 },
      { label: "Retro", min: 5 },
    ],
  },
  {
    icon: Puzzle,
    name: "Jigsaw",
    length: "60 to 90 min",
    body: "Each member prepares one subtopic and teaches it. Teaching is the fastest way to learn.",
    steps: [
      { label: "Check-in", min: 5 },
      { label: "Ada", min: 10 },
      { label: "Tunde", min: 10 },
      { label: "Chioma", min: 10 },
      { label: "Kemi", min: 10 },
      { label: "Quiz", min: 10 },
      { label: "Wrap-up", min: 5 },
    ],
  },
  {
    icon: Timer,
    name: "Co-work",
    length: "Any length",
    body: "Twenty-five minutes of focus, five minutes of check-in. State a goal, report back.",
    steps: [
      { label: "Goals", min: 3 },
      { label: "Focus", min: 25 },
      { label: "Break", min: 5 },
      { label: "Focus", min: 25 },
      { label: "Check-in", min: 5 },
    ],
  },
];

const RESEARCH = [
  { finding: "Retrieval practice beats re-reading", source: "Roediger & Karpicke, 2006", feature: "Retrieval Round and question bank" },
  { finding: "Spaced practice beats cramming", source: "Cepeda et al., 2006", feature: "Recurring sessions up to the exam" },
  { finding: "Teaching others deepens learning", source: "Fiorella & Mayer, 2013", feature: "Jigsaw template" },
  { finding: "Small groups participate more", source: "Lou et al., 1996", feature: "Groups of 3 to 6" },
  { finding: "Reflection improves group performance", source: "Johnson & Johnson, 2009", feature: "Post-session retro" },
  { finding: "Safe groups speak up", source: "Edmondson, 1999", feature: "Charter norms, no leaderboards" },
];

function HeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-[540px] pb-28 sm:pb-20 lg:mx-0">
      {/* Session card, as members see it */}
      <div className="relative z-10 w-[86%] rounded-[1.375rem] border border-border bg-surface p-6 shadow-float sm:p-7">
        <div className="text-label text-teal-text">Retrieval Round · 60 min</div>
        <div className="mt-3 text-[1.375rem] font-bold leading-7 tracking-tight">CSC 201: Trees and graphs</div>
        <div className="mt-1.5 text-[0.9375rem] text-muted-foreground">Thursday, 6:00 pm, video call</div>
        <div className="mt-5 flex flex-wrap items-center gap-2.5">
          <span className="flex -space-x-2" aria-hidden>
            {[168, 220, 28, 330].map((h, i) => (
              <span
                key={h}
                className="grid size-8 place-items-center rounded-full text-[11px] font-bold ring-[2.5px] ring-surface"
                style={{ background: `hsl(${h} 42% 88%)`, color: `hsl(${h} 45% 26%)` }}
              >
                {["AO", "TB", "CE", "KA"][i]}
              </span>
            ))}
          </span>
          <span className="text-sm font-semibold">4 of 5 going</span>
          <span className="rounded-full bg-gold px-3 py-1 text-[0.8125rem] font-bold text-gold-foreground">Your turn to teach</span>
        </div>
        <ul className="mt-5 space-y-2 text-[0.9375rem]">
          <li className="flex items-center gap-2.5">
            <span className="grid size-5 place-items-center rounded-md bg-teal text-white">
              <Check className="size-3.5" strokeWidth={3} />
            </span>
            Bring 2 questions from Chapter 4
          </li>
          <li className="flex items-center gap-2.5 text-muted-foreground">
            <span className="size-5 rounded-md border-[1.5px] border-border-strong" />
            Skim the BFS and DFS slides
          </li>
        </ul>
        <div className="mt-6 flex h-12 items-center justify-center rounded-xl bg-primary font-bold text-primary-foreground">
          Start session
        </div>
      </div>

      {/* Session Mode, mid-step */}
      <div className="absolute bottom-0 right-0 z-20 w-[50%] min-w-[210px] rounded-[1.375rem] bg-brand-blue p-5 text-brand-cream shadow-float ring-1 ring-white/10">
        <div className="flex items-center justify-between text-xs font-semibold text-brand-cream/70">
          <span>Session Mode</span>
          <span>Step 3 of 5</span>
        </div>
        <div className="mt-3 flex justify-center">
          <StepRing steps={5} current={2} progress={0.62} size={156}>
            <div className="text-center">
              <div className="text-[2.125rem] font-bold leading-none tracking-[-0.04em] tabular-nums">7:36</div>
              <div className="mt-1.5 text-[11px] font-semibold text-brand-cream/75">Compare answers</div>
            </div>
          </StepRing>
        </div>
        <div className="mt-3 flex items-center gap-2 rounded-full bg-white/10 py-1 pl-1 pr-3 text-xs">
          <span
            className="grid size-6 place-items-center rounded-full text-[10px] font-bold"
            style={{ background: "hsl(28 42% 88%)", color: "hsl(28 45% 26%)" }}
          >
            CE
          </span>
          <span>
            <b>Chioma</b> <span className="text-brand-cream/70">is the questioner</span>
          </span>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-dvh overflow-x-clip">
      <header className="sticky top-0 z-40 border-b border-transparent bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/70">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-4 sm:px-6">
          <Link href="/" aria-label="StudyCircle home">
            <Logo size={26} />
          </Link>
          <nav className="flex items-center gap-1 sm:gap-2" aria-label="Main">
            <a href="#how" className="hidden rounded-lg px-3 py-2 text-[0.9375rem] font-semibold text-muted-foreground hover:text-foreground md:block">
              How it works
            </a>
            <a href="#research" className="hidden rounded-lg px-3 py-2 text-[0.9375rem] font-semibold text-muted-foreground hover:text-foreground md:block">
              The research
            </a>
            <Button asChild variant="ghost" size="sm" className="h-10">
              <Link href="/login">Log in</Link>
            </Button>
            <Button asChild size="sm" className="h-10">
              <Link href="/login">Get started</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto grid max-w-[1200px] items-center gap-16 px-4 pb-24 pt-12 sm:px-6 sm:pt-16 lg:grid-cols-[1.05fr_1fr] lg:gap-12 lg:pb-32 lg:pt-24">
          <div className="stagger">
            <h1 className="text-[2.75rem] font-bold leading-[1.02] tracking-[-0.045em] sm:text-[4rem] lg:text-[4.5rem]">
              Not another group chat.
            </h1>
            <p className="mt-6 max-w-[34rem] text-lg leading-8 text-muted-foreground sm:text-xl sm:leading-8">
              StudyCircle helps you form a small study group, find a time that works, and run every session well, with
              retrieval practice, spaced sessions and learning by teaching built in.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-[52px] px-7 text-base">
                <Link href="/login">Start a study group</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-[52px] px-7 text-base">
                <Link href="/login?next=/courses">Find a group in my course</Link>
              </Button>
            </div>
            <p className="mt-5 text-sm text-muted-foreground">Free for students. Works in any browser, on any phone.</p>
          </div>
          <HeroVisual />
        </section>

        {/* Problems → fixes */}
        <section className="border-y border-border bg-surface">
          <div className="mx-auto max-w-[1200px] px-4 py-20 sm:px-6 lg:py-28">
            <div className="grid gap-12 lg:grid-cols-[minmax(0,380px)_1fr] lg:gap-20">
              <div>
                <h2 className="text-[2rem] font-bold leading-10 tracking-[-0.035em] sm:text-[2.5rem] sm:leading-[3rem]">
                  Why most study groups stop meeting
                </h2>
                <p className="mt-4 text-lg leading-8 text-muted-foreground">
                  Studying with peers works. Keeping a group going is the hard part. Each of these is fixed in the product,
                  not left to willpower.
                </p>
              </div>
              <dl className="divide-y divide-border border-y border-border">
                {PROBLEMS.map((p) => (
                  <div key={p.problem} className="grid gap-2 py-6 sm:grid-cols-[minmax(0,0.9fr)_1.1fr] sm:gap-8">
                    <dt className="text-lg font-bold leading-7 tracking-tight">{p.problem}</dt>
                    <dd className="text-[1.0625rem] leading-7 text-muted-foreground">{p.fix}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </section>

        {/* The cycle */}
        <section id="how" className="mx-auto max-w-[1200px] scroll-mt-20 px-4 py-20 sm:px-6 lg:py-32">
          <div className="mb-14 max-w-2xl">
            <h2 className="text-[2rem] font-bold leading-10 tracking-[-0.035em] sm:text-[2.5rem] sm:leading-[3rem]">
              Five pieces, one circle
            </h2>
            <p className="mt-4 text-lg leading-8 text-muted-foreground">
              Every group moves through the same loop, week after week, until the exam. No single piece makes a circle on
              its own.
            </p>
          </div>
          <Cycle />
        </section>

        {/* Templates */}
        <section className="bg-brand-blue text-brand-cream dark:bg-surface">
          <div className="mx-auto max-w-[1200px] px-4 py-20 sm:px-6 lg:py-28">
            <div className="mb-14 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
              <div className="max-w-2xl">
                <h2 className="text-[2rem] font-bold leading-10 tracking-[-0.035em] sm:text-[2.5rem] sm:leading-[3rem]">
                  Sessions with a shape
                </h2>
                <p className="mt-4 text-lg leading-8 text-brand-cream/75">
                  Press start and Session Mode opens for everyone: one timer, the current step, and who&rsquo;s doing what.
                  Roles rotate so the same person isn&rsquo;t always in charge.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 text-sm">
                {["Facilitator", "Timekeeper", "Scribe", "Questioner"].map((r) => (
                  <span key={r} className="rounded-full border border-white/20 px-3.5 py-1.5 font-semibold">
                    {r}
                  </span>
                ))}
              </div>
            </div>
            <div className="grid gap-px overflow-hidden rounded-[1.375rem] bg-white/10 lg:grid-cols-3">
              {TEMPLATES.map((t) => {
                const total = t.steps.reduce((a, s) => a + s.min, 0);
                return (
                  <article key={t.name} className="flex flex-col bg-brand-blue p-7 dark:bg-surface sm:p-8">
                    <div className="flex items-center justify-between">
                      <t.icon className="size-6 text-brand-gold" strokeWidth={2.2} />
                      <span className="text-sm font-semibold text-brand-cream/65">{t.length}</span>
                    </div>
                    <h3 className="mt-6 text-2xl font-bold tracking-tight">{t.name}</h3>
                    <p className="mt-2 leading-7 text-brand-cream/75">{t.body}</p>
                    <div className="mt-auto pt-8">
                      <div className="flex h-2 gap-1" aria-hidden>
                        {t.steps.map((s, i) => (
                          <span
                            key={i}
                            className={i === 1 ? "rounded-full bg-brand-gold" : "rounded-full bg-brand-cream/30"}
                            style={{ flexGrow: s.min }}
                          />
                        ))}
                      </div>
                      <ol className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-brand-cream/65">
                        {t.steps.map((s, i) => (
                          <li key={i}>
                            {s.label} {s.min}m
                          </li>
                        ))}
                      </ol>
                      <span className="sr-only">Total {total} minutes</span>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* Research */}
        <section id="research" className="mx-auto max-w-[1200px] scroll-mt-20 px-4 py-20 sm:px-6 lg:py-28">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,380px)_1fr] lg:gap-20">
            <div>
              <h2 className="text-[2rem] font-bold leading-10 tracking-[-0.035em] sm:text-[2.5rem] sm:leading-[3rem]">
                Every feature has a reason
              </h2>
              <p className="mt-4 text-lg leading-8 text-muted-foreground">
                We built on decades of learning research, so your group spends its time on what works.
              </p>
            </div>
            <div className="overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface">
              <table className="w-full text-left">
                <caption className="sr-only">Research findings and the features built on them</caption>
                <thead className="hidden bg-surface-2 text-sm sm:table-header-group">
                  <tr>
                    <th scope="col" className="px-5 py-3 font-semibold">
                      What the research says
                    </th>
                    <th scope="col" className="px-5 py-3 font-semibold">
                      What it became
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {RESEARCH.map((r) => (
                    <tr key={r.finding} className="flex flex-col gap-1 px-5 py-4 sm:table-row sm:p-0">
                      <td className="sm:px-5 sm:py-4">
                        <div className="font-bold">{r.finding}</div>
                        <div className="text-sm text-muted-foreground">{r.source}</div>
                      </td>
                      <td className="text-[0.9375rem] text-teal-text sm:px-5 sm:py-4 sm:font-semibold">{r.feature}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Closing */}
        <section className="px-4 pb-6 sm:px-6">
          <div className="mx-auto flex max-w-[1200px] flex-col items-center overflow-hidden rounded-[1.75rem] bg-brand-blue px-6 py-20 text-center text-brand-cream dark:bg-surface sm:py-24">
            <Mark size={72} tone="dark" title={null} />
            <h2 className="mt-8 text-[2.25rem] font-bold leading-tight tracking-[-0.04em] sm:text-[3.25rem]">
              Study together. Keep going.
            </h2>
            <p className="mt-4 max-w-md text-lg leading-8 text-brand-cream/75">
              Set up your group in two minutes and share the link with your classmates.
            </p>
            <Button asChild variant="gold" size="lg" className="mt-9 h-[52px] px-8 text-base">
              <Link href="/login">Start a study group</Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="mx-auto flex max-w-[1200px] flex-col gap-4 px-4 py-10 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <Logo size={20} />
        <p>Made for students who&rsquo;d rather pass together.</p>
      </footer>
    </div>
  );
}
