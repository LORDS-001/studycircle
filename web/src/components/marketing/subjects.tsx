"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Puzzle, Timer, Zap } from "lucide-react";
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
      <div role="group" aria-label="Filter subjects" className="scrollbar-none -mx-4 mb-8 flex overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div className="flex gap-1 rounded-full bg-foreground/[0.04] p-1 ring-1 ring-foreground/[0.06]">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            aria-pressed={filter === f}
            className={cn(
              "h-9 shrink-0 rounded-full px-4 text-sm font-semibold transition-[background-color,color,box-shadow] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
              filter === f
                ? "bg-surface text-foreground shadow-[0_1px_2px_rgb(36_59_107/0.1),0_4px_12px_-6px_rgb(36_59_107/0.2)]"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {f}
          </button>
        ))}
        </div>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
        {shown.map((s) => (
          <li key={s.title} className="animate-fade-in">
            <Link
              href="/login?next=/courses"
              className="group flex items-center gap-4 rounded-[1.75rem] bg-foreground/[0.035] p-1.5 ring-1 ring-foreground/[0.06] transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.99] sm:flex-col sm:items-stretch sm:gap-0 sm:hover:-translate-y-1"
            >
              <span className="flex w-full items-center gap-4 rounded-[calc(1.75rem-0.375rem)] bg-surface p-2 pr-3 shadow-[inset_0_1px_0_rgb(255_255_255/0.7),0_20px_40px_-28px_rgb(36_59_107/0.3)] sm:flex-col sm:items-stretch sm:gap-0 sm:p-2 dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.06)]">
              <span className="relative size-16 shrink-0 overflow-hidden rounded-2xl sm:aspect-[16/10] sm:size-auto sm:w-full sm:rounded-[1.125rem]">
                <Image
                  src={s.image}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 360px, (min-width: 640px) 45vw, 64px"
                  className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-[1.05]"
                />
              </span>
              <span className="flex min-w-0 flex-1 items-center gap-3 sm:px-2.5 sm:pb-2.5 sm:pt-4">
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-bold tracking-tight sm:text-[1.0625rem]">{s.title}</span>
                  <span className="mt-0.5 hidden text-sm leading-5 text-muted-foreground sm:block">{s.blurb}</span>
                  <span className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground sm:mt-3">
                    <s.format.icon className="size-3.5 text-teal-text" strokeWidth={2} />
                    Try a {s.format.label}
                  </span>
                </span>
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-foreground/[0.05] text-foreground transition-[transform,background-color,color] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:-translate-y-px group-hover:translate-x-0.5 group-hover:bg-teal group-hover:text-white">
                  <ArrowUpRight className="size-[18px]" strokeWidth={1.8} />
                </span>
              </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
