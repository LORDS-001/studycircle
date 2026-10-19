import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BellRing,
  CalendarCheck,
  ClipboardList,
  Clock,
  Flag,
  HelpCircle,
  LibraryBig,
  MessageSquareHeart,
  NotebookPen,
  Play,
  Repeat,
  Search,
  Timer,
  UsersRound,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Blob, HandNote, SectionLabel, Squiggle, caveat } from "@/components/marketing/bits";
import { MobileMenu } from "@/components/marketing/mobile-menu";
import { Subjects } from "@/components/marketing/subjects";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "#how", label: "How it works" },
  { href: "#subjects", label: "Subjects" },
  { href: "#roles", label: "Roles" },
];

const FEATURES = [
  {
    icon: CalendarCheck,
    tint: "bg-teal-soft text-teal-text",
    title: "Find a time fast",
    body: "Everyone paints their free hours once. The heatmap picks the top three times.",
  },
  {
    icon: ClipboardList,
    tint: "bg-gold-soft text-gold-foreground dark:text-gold",
    title: "Sessions with a shape",
    body: "Proven templates, a shared timer and rotating roles. No more drifting.",
  },
  {
    icon: Repeat,
    tint: "bg-surface-3 text-foreground",
    title: "Groups that last",
    body: "Recurring sessions to the exam, reminders, and a two-minute retro.",
  },
];

const STATS = [
  { icon: UsersRound, value: "3–6", label: "People per group" },
  { icon: Timer, value: "3", label: "Session templates" },
  { icon: BellRing, value: "24h + 1h", label: "Reminders before each session" },
  { icon: MessageSquareHeart, value: "2 min", label: "Retro after every session" },
];

const ROLES = [
  { image: "/images/role-facilitator.jpg", role: "Facilitator", job: "Keeps the group moving", icon: Flag },
  { image: "/images/role-timekeeper.jpg", role: "Timekeeper", job: "Watches the timer", icon: Clock },
  { image: "/images/role-scribe.jpg", role: "Scribe", job: "Takes the shared notes", icon: NotebookPen },
  { image: "/images/role-questioner.jpg", role: "Questioner", job: "Asks “why?” out loud", icon: HelpCircle },
];

function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-md supports-[backdrop-filter]:bg-background/75">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center gap-6 px-4 sm:px-6">
        <Link href="/" aria-label="StudyCircle home" className="shrink-0">
          <Logo size={24} />
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {NAV.map((n) => (
            <a
              key={n.href}
              href={n.href}
              className="rounded-lg px-3 py-2 text-[0.9375rem] font-semibold text-muted-foreground transition-colors hover:text-foreground"
            >
              {n.label}
            </a>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/login?next=/courses"
            className="hidden h-10 w-56 items-center gap-2 rounded-full border border-border-strong bg-surface px-4 text-sm text-subtle-foreground transition-colors hover:border-foreground/35 lg:flex"
          >
            <Search className="size-4" />
            Find your course
          </Link>
          <Button asChild variant="ghost" size="sm" className="hidden h-10 sm:inline-flex">
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild size="sm" className="h-10 rounded-full px-5">
            <Link href="/login">Get started</Link>
          </Button>
          <MobileMenu links={NAV} />
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative mx-auto grid max-w-[1200px] grid-cols-1 gap-x-12 px-4 pt-4 sm:px-6 sm:pt-8 lg:grid-cols-[1fr_1.08fr] lg:grid-rows-[1fr_auto] lg:pt-14">
      {/* Visual — on phones the headline sits on top of it */}
      <div className="relative col-start-1 row-start-1 lg:col-start-2 lg:row-span-2">
        <Blob className="-bottom-8 -left-10 hidden size-72 bg-gold-soft lg:block dark:bg-surface-2" />
        <Blob className="-right-8 -top-8 hidden size-40 bg-teal-soft lg:block" />
        <div className="relative aspect-[4/5] overflow-hidden rounded-[1.75rem] sm:aspect-[16/11] lg:aspect-[5/4.4] lg:rounded-[2.25rem]">
          <Image
            src="/images/hero-group.jpg"
            alt="Three students laughing together over their laptops"
            fill
            priority
            sizes="(min-width: 1024px) 600px, 100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-blue via-brand-blue/55 to-transparent lg:hidden" />
        </div>
        {/* Badge */}
        <div className="absolute right-3 top-3 grid size-24 rotate-6 place-items-center rounded-full bg-teal text-center text-white shadow-raised sm:size-28 lg:-right-5 lg:top-8 lg:size-36">
          <span className="font-hand text-[1.15rem] font-bold leading-[0.95] sm:text-[1.35rem] lg:text-[1.6rem]">
            Small groups.
            <br />
            Big results.
          </span>
        </div>
        {/* Product moment */}
        <div className="absolute -bottom-6 -left-8 hidden w-[19.5rem] rounded-2xl border border-border bg-surface p-4 shadow-float lg:block">
          <div className="flex items-center justify-between gap-2">
            <span className="text-label text-teal-text">Retrieval Round</span>
            <span className="whitespace-nowrap rounded-full bg-gold px-2.5 py-0.5 text-xs font-bold text-gold-foreground">Your turn to teach</span>
          </div>
          <div className="mt-1.5 font-bold tracking-tight">CSC 201: Trees and graphs</div>
          <div className="text-sm text-muted-foreground">Thursday, 6:00 pm, video call</div>
          <div className="mt-3 flex items-center gap-2">
            <span className="flex shrink-0 -space-x-1.5" aria-hidden>
              {["/images/role-facilitator.jpg", "/images/role-timekeeper.jpg", "/images/role-scribe.jpg", "/images/role-questioner.jpg"].map((src) => (
                <Image key={src} src={src} alt="" width={28} height={28} className="size-7 rounded-full object-cover ring-2 ring-surface" />
              ))}
            </span>
            <span className="whitespace-nowrap text-sm font-semibold">4 of 5 going</span>
          </div>
        </div>
        <HandNote arrow="down-right" className="absolute -left-36 top-6 hidden -rotate-6 text-[1.7rem] text-teal-text xl:inline-flex">
          {"Study together,\nkeep going"}
        </HandNote>
      </div>

      {/* Headline */}
      <div className="relative z-10 col-start-1 row-start-1 self-end p-6 pb-7 text-white sm:p-8 lg:self-end lg:p-0 lg:pb-2 lg:text-foreground">
        <SectionLabel className="text-brand-gold lg:text-teal-text">Study groups that work</SectionLabel>
        <h1 className="text-[2.5rem] font-bold leading-[1.02] tracking-[-0.045em] sm:text-[3.25rem] lg:text-[4.25rem]">
          Not another
          <br />
          group chat.
        </h1>
        <p className="mt-4 max-w-md text-[1.0625rem] leading-7 text-white/85 lg:mt-5 lg:text-lg lg:leading-8 lg:text-muted-foreground">
          Form a small study group, find a time that works, and run every session well.
        </p>
      </div>

      {/* Actions */}
      <div className="col-start-1 row-start-2 flex flex-col gap-5 pt-6 lg:pt-8">
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg" className="h-[52px] rounded-full px-7 text-base">
            <Link href="/login">
              Start a study group <ArrowRight />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="h-[52px] rounded-full px-7 text-base">
            <Link href="/login?next=/courses">Find a group in my course</Link>
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex -space-x-2" aria-hidden>
            {["/images/role-scribe.jpg", "/images/role-timekeeper.jpg", "/images/role-facilitator.jpg"].map((src) => (
              <Image key={src} src={src} alt="" width={36} height={36} className="size-9 rounded-full object-cover ring-[3px] ring-background" />
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

function Features() {
  return (
    <section className="mx-auto mt-16 max-w-[1200px] px-4 sm:px-6 lg:mt-24">
      <ul className="grid divide-y divide-border rounded-3xl border border-border bg-surface sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {FEATURES.map((f) => (
          <li key={f.title} className="flex items-start gap-4 p-5 sm:p-6 lg:p-8">
            <span className={cn("grid size-12 shrink-0 place-items-center rounded-full", f.tint)}>
              <f.icon className="size-[22px]" strokeWidth={2.1} />
            </span>
            <span>
              <span className="block text-[1.0625rem] font-bold tracking-tight">{f.title}</span>
              <span className="mt-1 block text-[0.9375rem] leading-6 text-muted-foreground">{f.body}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function About() {
  return (
    <section id="how" className="mx-auto mt-20 grid max-w-[1200px] scroll-mt-24 items-center gap-10 px-4 sm:px-6 lg:mt-28 lg:grid-cols-2 lg:gap-16">
      <div className="relative">
        <Blob className="-left-6 -top-6 size-48 bg-teal-soft" />
        <div className="relative aspect-[5/4] overflow-hidden rounded-[1.75rem]">
          <Image
            src="/images/about-group.jpg"
            alt="A small study group working through notes together at a table"
            fill
            sizes="(min-width: 1024px) 560px, 100vw"
            className="object-cover"
          />
        </div>
        <HandNote className="absolute right-5 top-4 rotate-[-5deg] text-[1.8rem] text-white drop-shadow-[0_1px_8px_rgb(0_0_0/0.45)] sm:right-8 sm:top-6 sm:text-[2.1rem]">
          {"Teach it\nto learn it"}
        </HandNote>
      </div>
      <div className="relative">
        <SectionLabel>How it works</SectionLabel>
        <h2 className="text-[2rem] font-bold leading-[1.1] tracking-[-0.035em] sm:text-[2.75rem]">
          Study sessions that actually work
        </h2>
        <p className="mt-5 max-w-lg text-[1.0625rem] leading-8 text-muted-foreground">
          Most study groups stall on scheduling, drift into chatting, and fade after the first test. StudyCircle builds
          the fixes in: a heatmap to find a time, templates based on retrieval practice and teaching each other, and
          reminders that keep everyone showing up.
        </p>
        <ul className="mt-6 grid gap-3 text-[0.9375rem] font-medium">
          {[
            { icon: Play, text: "Session Mode runs the timer and the steps for everyone" },
            { icon: LibraryBig, text: "A shared question bank for quizzing each other" },
            { icon: Repeat, text: "Roles rotate, so nobody organises every time" },
          ].map((i) => (
            <li key={i.text} className="flex items-center gap-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-surface-2">
                <i.icon className="size-4 text-teal-text" strokeWidth={2.3} />
              </span>
              {i.text}
            </li>
          ))}
        </ul>
        <Button asChild variant="teal" size="lg" className="mt-8 rounded-full px-6">
          <Link href="/login">
            Try it with your group <ArrowRight />
          </Link>
        </Button>
        <HandNote className="absolute -right-2 bottom-0 hidden rotate-[-8deg] text-[1.6rem] text-muted-foreground xl:inline-flex">
          {"Learning is a\nteam sport"}
        </HandNote>
      </div>
    </section>
  );
}

function SubjectsSection() {
  return (
    <section id="subjects" className="mx-auto mt-24 max-w-[1200px] scroll-mt-24 px-4 sm:px-6 lg:mt-32">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <SectionLabel>Subjects</SectionLabel>
          <h2 className="text-[2rem] font-bold leading-[1.1] tracking-[-0.035em] sm:text-[2.75rem]">Popular subjects</h2>
        </div>
        <p className="max-w-sm text-[0.9375rem] leading-6 text-muted-foreground">
          Whatever you&rsquo;re studying, there&rsquo;s a session format that suits it.
        </p>
      </div>
      <Subjects />
      <div className="mt-8 flex justify-center">
        <Button asChild variant="outline" size="lg" className="rounded-full px-6">
          <Link href="/login?next=/courses">
            Find your course <ArrowRight />
          </Link>
        </Button>
      </div>
    </section>
  );
}

function Stats() {
  return (
    <section className="mx-auto mt-20 max-w-[1200px] px-4 sm:px-6 lg:mt-28">
      <ul className="grid grid-cols-2 gap-y-8 rounded-3xl bg-brand-blue px-4 py-8 text-brand-cream sm:py-10 lg:grid-cols-4 lg:divide-x lg:divide-white/15 lg:px-6 dark:bg-surface-2">
        {STATS.map((s) => (
          <li key={s.label} className="flex flex-col items-center px-3 text-center">
            <s.icon className="size-6 text-brand-gold" strokeWidth={2} />
            <span className="mt-3 text-[1.75rem] font-bold leading-none tracking-[-0.03em] sm:text-[2.25rem]">{s.value}</span>
            <span className="mt-2 max-w-[11rem] text-sm text-brand-cream/75">{s.label}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Roles() {
  return (
    <section id="roles" className="mx-auto mt-24 max-w-[1200px] scroll-mt-24 px-4 sm:px-6 lg:mt-32">
      <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <SectionLabel>Your circle</SectionLabel>
          <h2 className="text-[2rem] font-bold leading-[1.1] tracking-[-0.035em] sm:text-[2.75rem]">Everyone has a role</h2>
        </div>
        <p className="max-w-sm text-[0.9375rem] leading-6 text-muted-foreground">
          Roles rotate every session, so everyone takes a turn leading, and nobody just watches.
        </p>
      </div>
      <ul className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
        {ROLES.map((r) => (
          <li
            key={r.role}
            className="flex flex-col items-center rounded-2xl border border-border bg-surface p-4 text-center sm:flex-row sm:items-center sm:gap-4 sm:p-5 sm:text-left"
          >
            <Image
              src={r.image}
              alt=""
              width={88}
              height={88}
              className="size-16 shrink-0 rounded-full object-cover ring-4 ring-surface-2 sm:size-[4.5rem]"
            />
            <span className="mt-3 min-w-0 sm:mt-0">
              <span className="block font-bold tracking-tight">{r.role}</span>
              <span className="mt-0.5 block text-sm leading-5 text-muted-foreground">{r.job}</span>
              <span className="mt-2 hidden size-7 place-items-center rounded-full bg-teal-soft text-teal-text sm:grid">
                <r.icon className="size-3.5" strokeWidth={2.4} />
              </span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Closing() {
  return (
    <section className="mx-auto mt-24 max-w-[1200px] px-4 sm:px-6 lg:mt-32">
      <div className="grid overflow-hidden rounded-3xl border border-border bg-surface lg:grid-cols-[1.1fr_1fr]">
        <div className="relative isolate overflow-hidden p-6 sm:p-10 lg:p-12">
          <Blob className="-bottom-24 -left-20 size-72 bg-gold-soft/70 dark:bg-surface-2" />
          <h2 className="text-[2rem] font-bold leading-[1.1] tracking-[-0.035em] sm:text-[2.5rem]">
            Study together.
            <br />
            Keep going.
          </h2>
          <p className="mt-4 max-w-md text-[1.0625rem] leading-7 text-muted-foreground">
            Set up your group in two minutes and share one link with your classmates on WhatsApp.
          </p>
          <ul className="mt-7 grid gap-5 sm:grid-cols-2">
            {[
              { icon: Play, title: "Session Mode", body: "One timer and one plan for the whole group" },
              { icon: LibraryBig, title: "Question bank", body: "Quiz yourself on what the group wrote" },
            ].map((f) => (
              <li key={f.title} className="flex gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-teal-soft text-teal-text">
                  <f.icon className="size-[18px]" strokeWidth={2.3} />
                </span>
                <span>
                  <span className="block font-bold">{f.title}</span>
                  <span className="block text-sm leading-5 text-muted-foreground">{f.body}</span>
                </span>
              </li>
            ))}
          </ul>
          <Button asChild size="lg" className="mt-8 rounded-full px-7">
            <Link href="/login">
              Start a study group <ArrowRight />
            </Link>
          </Button>
        </div>
        <div className="relative min-h-64 lg:min-h-full">
          <Image
            src="/images/cta-desk.jpg"
            alt="A desk with an open notebook, laptop and coffee"
            fill
            sizes="(min-width: 1024px) 540px, 100vw"
            className="object-cover"
          />
          <HandNote className="absolute bottom-6 right-6 rotate-[-6deg] rounded-xl bg-surface/90 px-3 py-2 text-[1.6rem] text-foreground shadow-raised">
            {"Your circle\nis waiting"}
          </HandNote>
        </div>
      </div>
    </section>
  );
}

export default function LandingPage() {
  return (
    <div className={cn(caveat.variable, "relative isolate min-h-dvh overflow-x-clip")}>
      <Blob className="-left-40 top-[28rem] size-80 bg-gold-soft/60 dark:bg-surface" />
      <Blob className="-right-48 top-[70rem] size-96 bg-teal-soft/60" />
      <Header />
      <main>
        <Hero />
        <Features />
        <About />
        <SubjectsSection />
        <Stats />
        <Roles />
        <Closing />
      </main>
      <footer className="mx-auto mt-20 flex max-w-[1200px] flex-col items-center gap-3 px-4 pb-12 text-center sm:px-6">
        <p className="font-hand text-[1.9rem] font-bold text-foreground">Study together. Keep going.</p>
        <Squiggle className="-mt-2 text-teal" />
        <div className="mt-6 flex w-full flex-col items-center justify-between gap-3 border-t border-border pt-6 text-sm text-muted-foreground sm:flex-row">
          <Logo size={20} />
          <p>Photos from Unsplash. Made for students who&rsquo;d rather pass together.</p>
        </div>
      </footer>
    </div>
  );
}
