"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, BookOpen, Star, UsersRound } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import type { PublicInstructorCard } from "@/lib/instructors/types";

type InstructorCardProps = {
  instructor: PublicInstructorCard;
  index?: number;
  featured?: boolean;
};

const InstructorCard = ({
  instructor,
  index = 0,
  featured = false,
}: InstructorCardProps) => {
  return (
    <motion.article
      initial={{ opacity: 0, y: 34, scale: 0.96 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: false, amount: 0.25 }}
      transition={{
        duration: 0.55,
        delay: index * 0.06,
        ease: "easeOut",
      }}
      whileHover={{
        y: -8,
        transition: { type: "spring", stiffness: 320, damping: 22 },
      }}
      className="group relative overflow-hidden rounded-[1.75rem] border border-navy/10 bg-white shadow-xl shadow-navy/5"
    >
      <div className="relative h-72 overflow-hidden bg-navy">
        <Image
          src={instructor.avatarUrl}
          alt={instructor.fullName}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#10223a]/95 via-[#10223a]/35 to-transparent" />

        {featured ? (
          <span className="absolute left-4 top-4 rounded-full bg-accent px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-white">
            Featured
          </span>
        ) : null}

        <div className="absolute inset-x-0 bottom-0 p-5">
          <span className="inline-flex rounded-full bg-white/15 px-3 py-1 text-[11px] font-medium tracking-[0.08em] text-white backdrop-blur">
            {instructor.specialty}
          </span>
          <h3 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-white">
            {instructor.fullName}
          </h3>
          <p className="mt-1 text-sm text-white/75">{instructor.title}</p>
        </div>
      </div>

      <div className="p-5">
        <p className="line-clamp-2 min-h-12 leading-7 text-navy/65">
          {instructor.shortBio}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {instructor.subjects.slice(0, 3).map((subject) => (
            <span
              key={subject}
              className="rounded-full bg-heroBg px-3 py-1 text-xs font-medium text-navy/70"
            >
              {subject}
            </span>
          ))}
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3 border-t border-navy/8 pt-5 text-center">
          <div>
            <p className="flex items-center justify-center gap-1 text-sm font-semibold text-navy">
              <Star className="h-4 w-4 fill-accent text-accent" />
              {instructor.rating.toFixed(1)}
            </p>
            <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-navy/45">
              Rating
            </p>
          </div>
          <div>
            <p className="flex items-center justify-center gap-1 text-sm font-semibold text-navy">
              <UsersRound className="h-4 w-4 text-accent" />
              {(instructor.studentsCount / 1000).toFixed(1)}k
            </p>
            <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-navy/45">
              Students
            </p>
          </div>
          <div>
            <p className="flex items-center justify-center gap-1 text-sm font-semibold text-navy">
              <BookOpen className="h-4 w-4 text-accent" />
              {instructor.coursesCount}
            </p>
            <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-navy/45">
              Courses
            </p>
          </div>
        </div>

        <Link
          href={`/instructors/${instructor.slug}`}
          className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-navy text-sm font-semibold text-soft transition-colors duration-200 group-hover:bg-accent"
        >
          View Profile
          <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      </div>
    </motion.article>
  );
};

export default InstructorCard;
