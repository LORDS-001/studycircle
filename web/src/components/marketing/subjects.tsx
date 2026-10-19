"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Puzzle, Timer, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

type Field = "Science" | "Tech" | "Maths" | "Health";

const SUBJECTS: {
  title: string;
  blurb: string;
  field: Field;
  image: string;
  format: { icon: typeof Zap; label: string };
}[] = [
  {
    title: "Data Structures",
    blurb: "Trees, graphs and the questions that always come up",
    field: "Tech",
    image: "/images/topic-data-structures.jpg",
    format: { icon: Zap, label: "Retrieval Round" },
  },
  {
    title: "Linear Algebra",
    blurb: "Work past papers together, then mark them as a group",
    field: "Maths",
    image: "/images/topic-linear-algebra.jpg",
    format: { icon: Timer, label: "Co-work" },
  },
  {
    title: "Organic Chemistry",
    blurb: "Split the mechanisms and teach them to each other",
    field: "Science",
    image: "/images/topic-chemistry.jpg",
    format: { icon: Puzzle, label: "Jigsaw" },
  },
  {
    title: "Neuroscience",
    blurb: "Quiz each other on structures until they stick",
    field: "Health",
    image: "/images/topic-neuroscience.jpg",
    format: { icon: Zap, label: "Retrieval Round" },
  },
  {
    title: "Electromagnetism",
    blurb: "Explain the derivations out loud, one step at a time",
    field: "Science",
    image: "/images/topic-physics.jpg",
    format: { icon: Puzzle, label: "Jigsaw" },
  },
  {
    title: "Clinical Medicine",
    blurb: "Spaced case reviews from now until the exam",
    field: "Health",
    image: "/images/topic-medicine.jpg",
    format: { icon: Zap, label: "Retrieval Round" },
  },
];

const FILTERS = ["All", "Science", "Tech", "Maths", "Health"] as const;

export function Subjects() {
  const [filter, setFilter] = React.useState<(typeof FILTERS)[number]>("All");
  const shown = SUBJECTS.filter((s) => filter === "All" || s.field === filter);

  return (
    <>
      <div role="group" aria-label="Filter subjects" className="scrollbar-none -mx-4 mb-6 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            aria-pressed={filter === f}
            className={cn(
              "pressable h-9 shrink-0 rounded-full px-4 text-sm font-semibold",
              filter === f ? "bg-teal text-white" : "bg-surface-2 text-muted-foreground hover:bg-surface-3 hover:text-foreground",
            )}
          >
            {f}
          </button>
        ))}
      </div>

      <ul className="grid gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
        {shown.map((s) => (
          <li key={s.title} className="animate-fade-in">
            <Link
              href="/login?next=/courses"
              className="pressable group flex items-center gap-4 rounded-2xl border border-border bg-surface p-2.5 pr-4 hover:border-border-strong hover:shadow-raised active:scale-[0.99] sm:flex-col sm:items-stretch sm:gap-0 sm:p-3"
            >
              <span className="relative size-16 shrink-0 overflow-hidden rounded-xl sm:aspect-[16/10] sm:size-auto sm:w-full">
                <Image
                  src={s.image}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 360px, (min-width: 640px) 45vw, 64px"
                  className="object-cover transition-transform duration-500 ease-[var(--ease-out)] group-hover:scale-[1.04]"
                />
              </span>
              <span className="flex min-w-0 flex-1 items-center gap-3 sm:px-1.5 sm:pb-1 sm:pt-4">
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-bold tracking-tight sm:text-[1.0625rem]">{s.title}</span>
                  <span className="mt-0.5 hidden text-sm leading-5 text-muted-foreground sm:block">{s.blurb}</span>
                  <span className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground sm:mt-3">
                    <s.format.icon className="size-3.5 text-teal-text" strokeWidth={2.4} />
                    Try a {s.format.label}
                  </span>
                </span>
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-teal text-white transition-transform duration-200 group-hover:translate-x-0.5">
                  <ArrowRight className="size-4" />
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
