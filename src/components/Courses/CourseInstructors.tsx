"use client";

import { ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import type { CourseInstructor } from "@/lib/courses/types";

const cardClass =
  "relative block aspect-[3/4] w-[44%] max-w-[13rem] shrink-0 snap-start overflow-hidden rounded-2xl transition has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-btnBg sm:w-52";

/** Horizontal, swipeable row of tall teacher cards (photo, name, subjects). */
export default function CourseInstructors({
  instructors,
  heading,
}: {
  instructors: CourseInstructor[];
  heading: React.ReactNode;
}) {
  const trackRef = useRef<HTMLUListElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const update = () => {
      setCanPrev(track.scrollLeft > 4);
      setCanNext(track.scrollLeft + track.clientWidth < track.scrollWidth - 4);
    };
    const observer = new ResizeObserver(update);
    observer.observe(track);
    track.addEventListener("scroll", update, { passive: true });
    return () => {
      observer.disconnect();
      track.removeEventListener("scroll", update);
    };
  }, []);

  function scrollByCards(direction: -1 | 1) {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({ left: direction * track.clientWidth * 0.8, behavior: "smooth" });
  }

  const showArrows = canPrev || canNext;

  return (
    <section>
      <div className="flex items-center justify-between gap-4">
        {heading}
        {showArrows ? (
          <div className="flex gap-2">
            <ArrowButton
              label="আগের শিক্ষক"
              disabled={!canPrev}
              onClick={() => scrollByCards(-1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </ArrowButton>
            <ArrowButton
              label="আরও শিক্ষক"
              disabled={!canNext}
              onClick={() => scrollByCards(1)}
            >
              <ChevronRight className="h-4 w-4" />
            </ArrowButton>
          </div>
        ) : null}
      </div>

      <ul
        ref={trackRef}
        className="-mx-1 mt-5 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-1 pb-2 pt-1 [scrollbar-width:none] sm:gap-4 [&::-webkit-scrollbar]:hidden"
      >
        {instructors.map((instructor) => (
          <li key={instructor.name} className={cardClass}>
            {instructor.slug ? (
              <ProfileCard instructor={instructor} slug={instructor.slug} />
            ) : (
              <InitialsCard instructor={instructor} />
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

function ProfileCard({
  instructor,
  slug,
}: {
  instructor: CourseInstructor;
  slug: string;
}) {
  return (
    <Link
      href={`/instructors/${slug}`}
      className="group absolute inset-0 bg-navy outline-none"
    >
      {instructor.avatarUrl ? (
        <Image
          src={instructor.avatarUrl}
          alt={instructor.name}
          fill
          sizes="(max-width: 640px) 45vw, 208px"
          className="object-cover object-top transition duration-500 group-hover:scale-105"
        />
      ) : (
        <Initials name={instructor.name} />
      )}
      <span className="absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-navy opacity-0 shadow-sm transition group-hover:opacity-100 group-focus-visible:opacity-100">
        <ArrowUpRight className="h-4 w-4" />
      </span>
      <CardCaption instructor={instructor} />
    </Link>
  );
}

function InitialsCard({ instructor }: { instructor: CourseInstructor }) {
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-navy via-[#1c4470] to-btnBgDark">
      <div
        aria-hidden
        className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,.35)_1px,transparent_0)] [background-size:18px_18px]"
      />
      <Initials name={instructor.name} />
      <CardCaption instructor={instructor} />
    </div>
  );
}

function Initials({ name }: { name: string }) {
  return (
    <span className="absolute inset-x-0 top-[24%] mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-white/25 bg-white/10 text-2xl font-bold text-white backdrop-blur-sm sm:h-24 sm:w-24 sm:text-3xl">
      {initials(name)}
    </span>
  );
}

function CardCaption({ instructor }: { instructor: CourseInstructor }) {
  return (
    <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0d2238] via-[#0d2238]/85 to-transparent px-3.5 pb-3.5 pt-12 text-left sm:px-4 sm:pb-4">
      <span className="font-bangla line-clamp-2 block text-[15px] font-semibold leading-snug text-white sm:text-base">
        {instructor.name}
      </span>
      {instructor.subjects.length ? (
        <span className="font-bangla mt-1 line-clamp-2 block text-xs leading-5 text-white/75">
          {instructor.subjects.join(" · ")}
        </span>
      ) : null}
    </span>
  );
}

function ArrowButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-navy/12 bg-white text-navy shadow-sm transition hover:border-btnBg/40 hover:text-btnBg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-btnBg/40 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-navy/12 disabled:hover:text-navy"
    >
      {children}
    </button>
  );
}

function initials(name: string) {
  return name
    .replace(/^(md|mohammad|muhammad|mst|mrs?|dr)\.?\s+/i, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => Array.from(part)[0] ?? "")
    .join("")
    .toUpperCase();
}
