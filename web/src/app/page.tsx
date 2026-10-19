import Image from "next/image";
import Link from "next/link";
import {
  BellRing,
  Check,
  Clock,
  Flag,
  HelpCircle,
  LibraryBig,
  MessageSquareHeart,
  NotebookPen,
  Play,
  Repeat,
  Timer,
  UsersRound,
  X,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { StepRing } from "@/components/brand/rings";
import { ArrowButton, Bezel, Eyebrow, Glow, HandNote, Squiggle, caveat } from "@/components/marketing/bits";
import { IslandNav } from "@/components/marketing/island-nav";
import { Subjects } from "@/components/marketing/subjects";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "#features", label: "Features" },
  { href: "#how", label: "How it works" },
  { href: "#subjects", label: "Subjects" },
  { href: "#roles", label: "Roles" },
];

const STATS = [
  { icon: UsersRound, value: "3–6", label: "People per group, so everyone talks" },
  { icon: Timer, value: "3", label: "Session templates built on research" },
  { icon: BellRing, value: "24h + 1h", label: "Reminders before every session" },
  { icon: MessageSquareHeart, value: "2 min", label: "Retro to make the next one better" },
];

const ROLES = [
  { image: "/images/role-facilitator-tall.jpg", role: "Facilitator", job: "Keeps the group moving", icon: Flag },
  { image: "/images/role-timekeeper-tall.jpg", role: "Timekeeper", job: "Watches the timer", icon: Clock },
  { image: "/images/role-scribe-tall.jpg", role: "Scribe", job: "Takes the shared notes", icon: NotebookPen },
  { image: "/images/role-questioner-tall.jpg", role: "Questioner", job: "Asks “why?” out loud", icon: HelpCircle },
];

const H2 = "text-[2.25rem] font-bold leading-[1.05] tracking-[-0.04em] sm:text-[3rem] lg:text-[3.5rem]";

/* ---------------------------------- Hero ---------------------------------- */

function Hero() {
  return (
    <section className="relative mx-auto grid max-w-[1200px] grid-cols-1 gap-x-14 px-4 pt-24 sm:px-6 sm:pt-32 lg:grid-cols-[1fr_1.05fr] lg:grid-rows-[1fr_auto] lg:pt-40">
      <Glow className="-left-40 -top-20 size-[42rem]" tone="teal" />
      <Glow className="-right-32 top-40 size-[36rem]" tone="gold" />

      {/* Visual: on phones the headline sits on top of it */}
      <div className="enter relative col-start-1 row-start-1 lg:col-start-2 lg:row-span-2" style={{ animationDelay: "120ms" }}>
        <Bezel radius="2.25rem">
          <div className="relative aspect-[4/5] sm:aspect-[16/11] lg:aspect-[5/4.6]">
            <Image
              src="/images/hero-group.jpg"
              alt="Three students laughing together over their laptops"
              fill
              priority
              sizes="(min-width: 1024px) 600px, 100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-brand-blue via-brand-blue/50 to-transparent lg:hidden" />
          </div>
        </Bezel>

        <div className="absolute right-4 top-4 grid size-24 rotate-6 place-items-center rounded-full bg-teal text-center text-white shadow-[0_20px_40px_-16px_rgb(35_124_116/0.6)] ring-4 ring-background/60 sm:size-28 lg:-right-6 lg:top-10 lg:size-36">
          <span className="font-hand text-[1.15rem] font-bold leading-[0.95] sm:text-[1.35rem] lg:text-[1.6rem]">
            Small groups.
            <br />
            Big results.
          </span>
        </div>

        {/* Product moment, cascading off the photo */}
        <div className="absolute -bottom-10 -left-12 hidden w-[20rem] -rotate-3 lg:block">
          <Bezel radius="1.5rem">
            <div className="p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-teal-text">Retrieval Round</span>
                <span className="whitespace-nowrap rounded-full bg-gold px-2.5 py-0.5 text-xs font-bold text-gold-foreground">
                  Your turn to teach
                </span>
              </div>
              <div className="mt-2 font-bold tracking-tight">CSC 201: Trees and graphs</div>
              <div className="text-sm text-muted-foreground">Thursday, 6:00 pm, video call</div>
              <div className="mt-3 flex items-center gap-2">
                <span className="flex shrink-0 -space-x-1.5" aria-hidden>
                  {["facilitator", "timekeeper", "scribe", "questioner"].map((r) => (
                    <Image
                      key={r}
                      src={`/images/role-${r}.jpg`}
                      alt=""
                      width={28}
                      height={28}
                      className="size-7 rounded-full object-cover ring-2 ring-surface"
                    />
                  ))}
                </span>
                <span className="whitespace-nowrap text-sm font-semibold">4 of 5 going</span>
              </div>
            </div>
          </Bezel>
        </div>

        <HandNote arrow="down-right" className="absolute -left-40 top-2 hidden -rotate-6 text-[1.7rem] text-teal-text xl:inline-flex">
          {"Study together,\nkeep going"}
        </HandNote>
      </div>

      {/* Headline */}
      <div className="relative z-10 col-start-1 row-start-1 self-end p-7 pb-8 text-white sm:p-10 lg:self-end lg:p-0 lg:pb-4 lg:text-foreground">
        <div className="enter hidden lg:block">
          <Eyebrow>Study groups that work</Eyebrow>
        </div>
        <p className="text-label mb-3 text-brand-gold lg:hidden">Study groups that work</p>
        <h1
          className="enter mt-0 text-[2.75rem] font-bold leading-[0.98] tracking-[-0.05em] sm:text-[4rem] lg:mt-6 lg:text-[5.25rem]"
          style={{ animationDelay: "60ms" }}
        >
          Not another
          <br />
          group chat.
        </h1>
        <p
          className="enter mt-5 max-w-[26rem] text-[1.0625rem] leading-7 text-white/85 lg:mt-7 lg:text-xl lg:leading-8 lg:text-muted-foreground"
          style={{ animationDelay: "140ms" }}
        >
          Form a small study group, find a time that works, and run every session well.
        </p>
      </div>

      {/* Actions */}
      <div className="enter col-start-1 row-start-2 flex flex-col gap-6 pt-7 lg:pt-10" style={{ animationDelay: "220ms" }}>
        <div className="flex flex-col gap-3 sm:flex-row">
          <ArrowButton href="/login">Start a study group</ArrowButton>
          <ArrowButton href="/login?next=/courses" variant="ghost">
            Find my course
          </ArrowButton>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex -space-x-2.5" aria-hidden>
            {["scribe", "timekeeper", "facilitator"].map((r) => (
              <Image key={r} src={`/images/role-${r}.jpg`} alt="" width={36} height={36} className="size-9 rounded-full object-cover ring-[3px] ring-background" />
            ))}
          </span>
          <p className="text-sm leading-5 text-muted-foreground">
            Free for students.
            <br />
            Works on any phone or laptop.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------- Feature bento ------------------------------ */

function MiniHeatmap() {
  // Members free per slot (0–5), Mon–Sun × 5 evening slots
  const grid = [
    [1, 2, 3, 3, 1],
    [0, 2, 2, 1, 0],
    [1, 1, 2, 0, 0],
    [2, 4, 5, 5, 3],
    [0, 1, 1, 0, 0],
    [3, 5, 4, 2, 1],
    [0, 0, 1, 1, 0],
  ];
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  return (
    <div aria-hidden className="relative">
      <div className="grid grid-cols-7 gap-1.5">
        {grid.map((col, d) => (
          <div key={d} className="flex flex-col gap-1.5">
            <span className="mb-1 text-center text-[11px] font-semibold text-subtle-foreground">{days[d]}</span>
            {col.map((n, s) => (
              <span
                key={s}
                className={cn("h-7 rounded-md sm:h-8", d === 3 && s === 2 && "ring-2 ring-foreground ring-offset-2 ring-offset-surface")}
                style={{ background: n ? `color-mix(in srgb, var(--teal-text) ${18 + n * 16}%, transparent)` : "var(--surface-2)" }}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="absolute -bottom-3 left-1/2 flex -translate-x-[18%] items-center gap-2 whitespace-nowrap rounded-full bg-foreground py-1.5 pl-1.5 pr-3.5 text-sm font-semibold text-background shadow-float">
        <span className="grid size-6 place-items-center rounded-full bg-teal text-white">
          <Check className="size-3.5" strokeWidth={3} />
        </span>
        Thu 6:00 pm, all 5 free
      </div>
    </div>
  );
}

function Bento() {
  return (
    <section id="features" className="relative mx-auto max-w-[1200px] scroll-mt-28 px-4 py-24 sm:px-6 lg:py-36">
      <div className="reveal mb-12 max-w-2xl lg:mb-16">
        <Eyebrow>Everything in one place</Eyebrow>
        <h2 className={cn(H2, "mt-5")}>Built for how groups actually study</h2>
        <p className="mt-5 text-lg leading-8 text-muted-foreground">
          Scheduling, structure and follow-through, in one app your whole group can use.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-12 lg:grid-rows-[auto_auto] lg:gap-5">
        {/* Find a time */}
        <Bezel className="reveal lg:col-span-7">
          <div className="flex h-full flex-col gap-8 p-6 sm:p-8">
            <div className="max-w-sm">
              <h3 className="text-xl font-bold tracking-tight">Find a time in one tap</h3>
              <p className="mt-2 leading-7 text-muted-foreground">
                Everyone paints their free hours once. The heatmap shows when most of you are free and suggests the best three times.
              </p>
            </div>
            <div className="mt-auto pb-4">
              <MiniHeatmap />
            </div>
          </div>
        </Bezel>

        {/* Session Mode */}
        <Bezel className="reveal lg:col-span-5 lg:row-span-2" innerClassName="bg-brand-blue text-brand-cream dark:bg-surface-2">
          <div className="relative isolate flex h-full flex-col p-6 sm:p-8">
            <Glow className="-right-24 -top-24 size-80" tone="gold" />
            <h3 className="text-xl font-bold tracking-tight">Session Mode</h3>
            <p className="mt-2 max-w-sm leading-7 text-brand-cream/75">
              Press start and the whole group sees one timer, the current step and who&rsquo;s doing what.
            </p>
            <div className="my-10 flex flex-1 items-center justify-center" aria-hidden>
              <StepRing steps={5} current={2} progress={0.58} size={232}>
                <div className="text-center">
                  <div className="text-[11px] font-semibold text-brand-cream/60">Step 3 of 5</div>
                  <div className="mt-1 text-[3.25rem] font-bold leading-none tracking-[-0.05em] tabular-nums">8:24</div>
                  <div className="mt-2 text-sm font-semibold text-brand-cream/80">Compare answers</div>
                </div>
              </StepRing>
            </div>
            <ul className="flex flex-wrap gap-2" aria-label="Roles this session">
              {ROLES.map((r) => (
                <li key={r.role} className="flex items-center gap-2 rounded-full bg-white/[0.08] py-1 pl-1 pr-3 text-xs ring-1 ring-white/10">
                  <Image src={r.image.replace("-tall", "")} alt="" width={24} height={24} className="size-6 rounded-full object-cover" />
                  {r.role}
                </li>
              ))}
            </ul>
          </div>
        </Bezel>

        {/* Question bank */}
        <Bezel className="reveal lg:col-span-4">
          <div className="flex h-full flex-col p-6 sm:p-8">
            <h3 className="text-xl font-bold tracking-tight">A shared question bank</h3>
            <p className="mt-2 leading-7 text-muted-foreground">Everyone adds questions. Quiz yourself between sessions.</p>
            <div aria-hidden className="mt-7 rounded-2xl bg-surface-2/70 p-4 ring-1 ring-border">
              <div className="text-xs font-semibold text-muted-foreground">Graphs</div>
              <div className="mt-1 font-semibold leading-6">Which data structure does BFS use?</div>
              <div className="mt-3 rounded-xl bg-surface px-3 py-2 text-sm ring-1 ring-border">A queue (first in, first out)</div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm font-semibold">
                <span className="flex h-9 items-center justify-center gap-1.5 rounded-full ring-1 ring-border-strong">
                  <X className="size-3.5" strokeWidth={2} /> Not yet
                </span>
                <span className="flex h-9 items-center justify-center gap-1.5 rounded-full bg-teal text-white">
                  <Check className="size-3.5" strokeWidth={2.4} /> Got it
                </span>
              </div>
            </div>
          </div>
        </Bezel>

        {/* Reminders */}
        <Bezel className="reveal lg:col-span-3">
          <div className="flex h-full flex-col p-6 sm:p-8">
            <h3 className="text-xl font-bold tracking-tight">Nobody forgets</h3>
            <p className="mt-2 leading-7 text-muted-foreground">Reminders 24 hours and 1 hour before.</p>
            <div aria-hidden className="relative mt-7 h-28">
              <div className="absolute inset-x-3 top-0 h-20 rounded-2xl bg-surface-2 ring-1 ring-border" />
              <div className="absolute inset-x-0 top-3 rounded-2xl bg-surface p-3 shadow-[0_12px_28px_-14px_rgb(36_59_107/0.35)] ring-1 ring-border">
                <div className="flex items-center gap-2 text-xs font-semibold text-teal-text">
                  <BellRing className="size-3.5" strokeWidth={2} /> In 1 hour
                </div>
                <div className="mt-1 text-sm font-bold leading-5">CSC 201 Retrieval Round</div>
                <div className="text-xs text-muted-foreground">Bring 2 questions from Chapter 4</div>
              </div>
            </div>
          </div>
        </Bezel>
      </div>
    </section>
  );
}

/* ------------------------------- How it works ------------------------------- */

function About() {
  return (
    <section id="how" className="relative mx-auto grid max-w-[1200px] scroll-mt-28 items-center gap-12 px-4 py-24 sm:px-6 lg:grid-cols-2 lg:gap-20 lg:py-32">
      <div className="reveal relative">
        <Glow className="-left-24 -top-24 size-96" tone="teal" />
        <Bezel radius="2.25rem">
          <div className="relative aspect-[5/4]">
            <Image
              src="/images/about-group.jpg"
              alt="A small study group working through notes together at a table"
              fill
              sizes="(min-width: 1024px) 560px, 100vw"
              className="object-cover"
            />
          </div>
        </Bezel>
        <HandNote className="absolute right-6 top-5 rotate-[-5deg] text-[1.9rem] text-white drop-shadow-[0_1px_10px_rgb(0_0_0/0.5)] sm:right-10 sm:top-8 sm:text-[2.2rem]">
          {"Teach it\nto learn it"}
        </HandNote>
      </div>
      <div className="reveal relative">
        <Eyebrow>How it works</Eyebrow>
        <h2 className={cn(H2, "mt-5")}>Study sessions that actually work</h2>
        <p className="mt-6 max-w-lg text-lg leading-8 text-muted-foreground">
          Most study groups stall on scheduling, drift into chatting, and fade after the first test. StudyCircle builds the fixes
          in, based on how people actually remember things.
        </p>
        <ul className="mt-8 divide-y divide-border border-y border-border">
          {[
            { icon: Play, text: "Session Mode runs the timer and the steps for everyone" },
            { icon: LibraryBig, text: "A shared question bank for quizzing each other" },
            { icon: Repeat, text: "Roles rotate, so nobody organises every time" },
          ].map((i) => (
            <li key={i.text} className="flex items-center gap-4 py-4 text-[0.9375rem] font-medium">
              <i.icon className="size-5 shrink-0 text-teal-text" strokeWidth={1.6} />
              {i.text}
            </li>
          ))}
        </ul>
        <ArrowButton href="/login" variant="teal" className="mt-10">
          Try it with your group
        </ArrowButton>
        <HandNote className="absolute -right-4 bottom-2 hidden rotate-[-8deg] text-[1.6rem] text-muted-foreground xl:inline-flex">
          {"Learning is a\nteam sport"}
        </HandNote>
      </div>
    </section>
  );
}

/* --------------------------------- Subjects --------------------------------- */

function SubjectsSection() {
  return (
    <section id="subjects" className="mx-auto max-w-[1200px] scroll-mt-28 px-4 py-24 sm:px-6 lg:py-32">
      <div className="reveal mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Eyebrow>Subjects</Eyebrow>
          <h2 className={cn(H2, "mt-5")}>Popular subjects</h2>
        </div>
        <p className="max-w-xs text-[0.9375rem] leading-6 text-muted-foreground">
          Whatever you&rsquo;re studying, there&rsquo;s a session format that suits it.
        </p>
      </div>
      <div className="reveal">
        <Subjects />
      </div>
      <div className="mt-12 flex justify-center">
        <ArrowButton href="/login?next=/courses" variant="ghost">
          Find your course
        </ArrowButton>
      </div>
    </section>
  );
}

/* ---------------------------------- Stats ----------------------------------- */

function Stats() {
  return (
    <section className="px-4 sm:px-6">
      <div className="reveal relative isolate mx-auto max-w-[1200px] overflow-hidden rounded-[2.5rem] bg-brand-blue px-6 py-14 text-brand-cream sm:px-10 sm:py-20 dark:bg-surface-2">
        <Glow className="-left-32 -top-40 size-[34rem]" tone="teal" />
        <Glow className="-bottom-48 -right-24 size-[30rem]" tone="gold" />
        <ul className="grid grid-cols-2 gap-x-6 gap-y-12 lg:grid-cols-4 lg:gap-0 lg:divide-x lg:divide-white/10">
          {STATS.map((s) => (
            <li key={s.label} className="flex flex-col lg:px-8 lg:first:pl-0 lg:last:pr-0">
              <s.icon className="size-6 text-brand-gold" strokeWidth={1.5} />
              <span className="mt-6 text-[2.25rem] font-bold leading-none tracking-[-0.045em] sm:text-[3.25rem]">{s.value}</span>
              <span className="mt-3 max-w-[12rem] text-sm leading-5 text-brand-cream/70">{s.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ---------------------------------- Roles ----------------------------------- */

function Roles() {
  return (
    <section id="roles" className="mx-auto max-w-[1200px] scroll-mt-28 px-4 py-24 sm:px-6 lg:py-36">
      <div className="reveal mb-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Eyebrow>Your circle</Eyebrow>
          <h2 className={cn(H2, "mt-5")}>Everyone has a role</h2>
        </div>
        <p className="max-w-xs text-[0.9375rem] leading-6 text-muted-foreground">
          Roles rotate every session, so everyone takes a turn leading, and nobody just watches.
        </p>
      </div>
      <ul className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
        {ROLES.map((r) => (
          <li key={r.role} className="reveal">
            <Bezel radius="1.75rem" innerClassName="group">
              <div className="relative aspect-[4/5]">
                <Image
                  src={r.image}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 280px, 50vw"
                  className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-[1.04]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <span className="absolute left-3 top-3 grid size-9 place-items-center rounded-full bg-black/30 text-white ring-1 ring-white/25">
                  <r.icon className="size-4" strokeWidth={1.8} />
                </span>
                <div className="absolute inset-x-0 bottom-0 p-4 text-white sm:p-5">
                  <div className="text-lg font-bold tracking-tight sm:text-xl">{r.role}</div>
                  <div className="mt-0.5 text-sm text-white/80">{r.job}</div>
                </div>
              </div>
            </Bezel>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* --------------------------------- Closing ---------------------------------- */

function Closing() {
  return (
    <section className="px-4 pb-24 sm:px-6 lg:pb-32">
      <Bezel radius="2.75rem" className="reveal mx-auto max-w-[1200px]" innerClassName="bg-brand-blue text-brand-cream dark:bg-surface-2">
        <div className="relative isolate grid lg:grid-cols-[1.1fr_1fr]">
          <Glow className="-left-40 -top-40 size-[36rem]" tone="teal" />
          <div className="p-8 sm:p-12 lg:p-16">
            <Eyebrow tone="dark">Free for students</Eyebrow>
            <h2 className={cn(H2, "mt-6")}>
              Study together.
              <br />
              Keep going.
            </h2>
            <p className="mt-5 max-w-md text-lg leading-8 text-brand-cream/75">
              Set up your group in two minutes and share one link with your classmates on WhatsApp.
            </p>
            <ul className="mt-9 grid gap-6 sm:grid-cols-2">
              {[
                { icon: Play, title: "Session Mode", body: "One timer and one plan for the whole group" },
                { icon: LibraryBig, title: "Question bank", body: "Quiz yourself on what the group wrote" },
              ].map((f) => (
                <li key={f.title} className="flex gap-3">
                  <f.icon className="mt-0.5 size-5 shrink-0 text-brand-gold" strokeWidth={1.6} />
                  <span>
                    <span className="block font-bold">{f.title}</span>
                    <span className="block text-sm leading-5 text-brand-cream/70">{f.body}</span>
                  </span>
                </li>
              ))}
            </ul>
            <ArrowButton href="/login" variant="gold" className="mt-10">
              Start a study group
            </ArrowButton>
          </div>
          <div className="relative p-2 pt-0 lg:p-3 lg:pl-0">
            <div className="relative h-72 overflow-hidden rounded-[2.125rem] sm:h-96 lg:h-full">
              <Image
                src="/images/cta-desk.jpg"
                alt="A desk with an open notebook, laptop and coffee"
                fill
                sizes="(min-width: 1024px) 540px, 100vw"
                className="object-cover"
              />
              <HandNote className="absolute bottom-6 right-6 rotate-[-6deg] rounded-2xl bg-brand-cream/95 px-3.5 py-2 text-[1.7rem] text-brand-blue shadow-raised">
                {"Your circle\nis waiting"}
              </HandNote>
            </div>
          </div>
        </div>
      </Bezel>
    </section>
  );
}

/* --------------------------------- Footer ----------------------------------- */

function Footer() {
  const cols = [
    { title: "Product", links: NAV },
    {
      title: "Get started",
      links: [
        { href: "/login", label: "Sign in" },
        { href: "/login", label: "Create a group" },
        { href: "/login?next=/courses", label: "Find your course" },
      ],
    },
  ];
  return (
    <footer className="mx-auto max-w-[1200px] px-4 pb-10 sm:px-6">
      <div className="grid gap-10 border-t border-border pt-12 sm:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Logo size={24} />
          <p className="mt-4 max-w-xs text-[0.9375rem] leading-6 text-muted-foreground">
            The app that makes your study group actually work.
          </p>
          <p className="mt-6 font-hand text-[1.8rem] font-bold leading-none text-foreground">Study together. Keep going.</p>
          <Squiggle className="mt-1 text-teal" />
        </div>
        {cols.map((c) => (
          <div key={c.title}>
            <h3 className="text-sm font-bold">{c.title}</h3>
            <ul className="mt-4 space-y-3">
              {c.links.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-[0.9375rem] text-muted-foreground transition-colors hover:text-foreground">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mt-12 flex flex-col gap-2 text-sm text-subtle-foreground sm:flex-row sm:justify-between">
        <p>Made for students who&rsquo;d rather pass together.</p>
        <p>Photos from Unsplash.</p>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  return (
    <div className={cn(caveat.variable, "relative isolate min-h-dvh overflow-x-clip")}>
      <div className="grain" aria-hidden />
      <IslandNav links={NAV} />
      <main>
        <Hero />
        <Bento />
        <About />
        <SubjectsSection />
        <Stats />
        <Roles />
        <Closing />
      </main>
      <Footer />
    </div>
  );
}
