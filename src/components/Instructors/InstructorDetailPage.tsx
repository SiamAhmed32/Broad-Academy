"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  BookOpen,
  Clock3,
  ExternalLink,
  Globe,
  Link2,
  Share2,
  Star,
  UsersRound,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Container } from "@/components/reusables";
import type { InstructorDetailResponse } from "@/lib/instructors/types";

import InstructorCard from "./InstructorCard";

type InstructorDetailPageProps = {
  data: InstructorDetailResponse["data"];
};

const statRows = [
  { key: "rating", label: "Rating", icon: Star, filled: true },
  { key: "students", label: "Students", icon: UsersRound, filled: false },
  { key: "courses", label: "Courses", icon: BookOpen, filled: false },
  { key: "experience", label: "Experience", icon: Clock3, filled: false },
] as const;

const InstructorDetailPage = ({ data }: InstructorDetailPageProps) => {
  const { instructor, related } = data;
  const shouldReduceMotion = useReducedMotion();

  const socialLinks = [
    { href: instructor.linkedIn, label: "LinkedIn", icon: Link2 },
    { href: instructor.twitter, label: "Social", icon: Share2 },
    { href: instructor.website, label: "Website", icon: Globe },
  ].filter((item) => item.href);

  const statValues: Record<(typeof statRows)[number]["key"], string> = {
    rating: `${instructor.rating.toFixed(1)} (${instructor.reviewCount})`,
    students: `${instructor.studentsCount.toLocaleString()}+`,
    courses: String(instructor.coursesCount),
    experience: `${instructor.experienceYears}+ yrs`,
  };

  return (
    <main className="bg-soft">
      {/* Cover banner */}
      <section className="relative bg-navy">
        <Container className="relative z-10 pt-6 sm:pt-8">
          <Link
            href="/instructors"
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-soft transition hover:bg-white/15"
          >
            <ArrowLeft className="h-4 w-4" />
            All Instructors
          </Link>
        </Container>

        <div className="relative mt-6 h-44 overflow-hidden sm:h-52 md:h-60">
          {instructor.coverUrl ? (
            <Image
              src={instructor.coverUrl}
              alt=""
              fill
              className="object-cover"
              priority
              sizes="100vw"
            />
          ) : (
            <div className="h-full bg-gradient-to-br from-accent/40 via-navy to-btnBg/30" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/60 to-navy/20" />
          <div className="absolute left-[-5rem] top-0 h-56 w-56 rounded-full bg-accent/15 blur-3xl" />
          <div className="absolute bottom-0 right-[-3rem] h-56 w-56 rounded-full bg-btnBg/15 blur-3xl" />
        </div>
      </section>

      {/* Profile card — floats over the cover */}
      <Container className="relative z-20 -mt-16 sm:-mt-20">
        <motion.div
          initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="rounded-[1.75rem] border border-navy/10 bg-white p-5 shadow-2xl shadow-navy/10 sm:p-7"
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="relative mx-auto h-28 w-28 shrink-0 overflow-hidden rounded-2xl ring-2 ring-accent/30 ring-offset-2 ring-offset-white shadow-xl sm:mx-0 sm:h-32 sm:w-32">
                <Image
                  src={instructor.avatarUrl}
                  alt={instructor.fullName}
                  fill
                  className="object-cover"
                  priority
                  sizes="128px"
                />
              </div>

              <div className="text-center sm:text-left">
                <span className="inline-flex rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-accent">
                  {instructor.specialty}
                </span>
                <h1 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-navy sm:text-3xl lg:text-4xl">
                  {instructor.fullName}
                </h1>
                <p className="mt-1.5 text-base text-navy/65 sm:text-lg">
                  {instructor.title}
                </p>
              </div>
            </div>

            {socialLinks.length > 0 ? (
              <div className="flex flex-wrap justify-center gap-2 lg:justify-end">
                {socialLinks.map(({ href, label, icon: Icon }) => (
                  <a
                    key={label}
                    href={href!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-navy/10 bg-heroBg px-4 py-2 text-sm font-medium text-navy transition hover:border-accent/30 hover:bg-accent/5"
                  >
                    <Icon className="h-4 w-4 text-accent" />
                    {label}
                    <ExternalLink className="h-3 w-3 opacity-50" />
                  </a>
                ))}
              </div>
            ) : null}
          </div>
        </motion.div>
      </Container>

      {/* Main content */}
      <Container className="relative z-10 py-10 pb-24 sm:py-12">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,320px)_1fr] lg:gap-8">
          <motion.aside
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="h-fit space-y-5 lg:sticky lg:top-24"
          >
            <div className="rounded-3xl border border-navy/10 bg-white p-6 shadow-lg shadow-navy/5">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">
                At a Glance
              </p>
              <div className="mt-5 space-y-3">
                {statRows.map(({ key, label, icon: Icon, filled }) => (
                  <div
                    key={key}
                    className="flex items-center justify-between rounded-2xl bg-heroBg px-4 py-3.5"
                  >
                    <span className="flex items-center gap-3 text-sm font-medium text-navy/70">
                      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-navy text-soft">
                        <Icon
                          className={`h-4 w-4 ${filled ? "fill-accent text-accent" : ""}`}
                        />
                      </span>
                      {label}
                    </span>
                    <span className="text-sm font-semibold text-navy">
                      {statValues[key]}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-navy/10 bg-white p-6 shadow-lg shadow-navy/5">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">
                Expertise
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {instructor.expertise.map((item) => (
                  <span
                    key={item}
                    className="rounded-full bg-navy px-3 py-1.5 text-xs font-medium text-soft"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </motion.aside>

          <div className="space-y-6">
            <motion.article
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.55, ease: "easeOut" }}
              className="rounded-3xl border border-navy/10 bg-white p-6 shadow-lg shadow-navy/5 sm:p-8"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">
                About
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-navy sm:text-3xl">
                Teaching Philosophy
              </h2>
              <p className="mt-5 text-base leading-8 text-navy/70 sm:text-[17px] sm:leading-8">
                {instructor.bio}
              </p>
            </motion.article>

            <motion.article
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.55, ease: "easeOut" }}
              className="rounded-3xl border border-navy/10 bg-white p-6 shadow-lg shadow-navy/5 sm:p-8"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">
                Subjects
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-navy sm:text-3xl">
                What You&apos;ll Learn
              </h2>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {instructor.subjects.map((subject, index) => (
                  <div
                    key={subject}
                    className="flex items-center gap-3 rounded-2xl border border-navy/8 bg-heroBg px-4 py-3.5"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy text-xs font-semibold text-soft">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="font-medium text-navy">{subject}</span>
                  </div>
                ))}
              </div>
            </motion.article>

            <motion.div
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.55, ease: "easeOut" }}
              className="relative overflow-hidden rounded-3xl border border-navy/10 bg-navy p-6 text-soft sm:p-8"
            >
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(5,150,105,0.15),transparent_55%)]"
              />
              <div className="relative">
                <h2 className="text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">
                  Ready to learn with {instructor.fullName.split(" ")[0]}?
                </h2>
              <p className="mt-4 max-w-xl text-base leading-8 text-soft/75">
                Explore courses taught by this mentor and start your learning
                journey with Broad Academy today.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href="/courses"
                  className="inline-flex h-12 items-center justify-center rounded-full bg-accent px-7 text-sm font-semibold text-white transition hover:bg-accent/90"
                >
                  View Courses
                </Link>
                <Link
                  href="/register"
                  className="inline-flex h-12 items-center justify-center rounded-full border border-white/20 bg-white/10 px-7 text-sm font-semibold transition hover:bg-white/15"
                >
                  Get Started
                </Link>
              </div>
              </div>
            </motion.div>
          </div>
        </div>

        {related.length > 0 ? (
          <section className="mt-16 sm:mt-20">
            <div className="mb-8">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">
                Similar Mentors
              </p>
              <h2 className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-navy sm:text-3xl">
                More {instructor.specialty} Experts
              </h2>
            </div>
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {related.map((item, index) => (
                <InstructorCard key={item.id} instructor={item} index={index} />
              ))}
            </div>
          </section>
        ) : null}
      </Container>
    </main>
  );
};

export default InstructorDetailPage;
