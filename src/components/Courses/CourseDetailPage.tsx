"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  Check,
  ChevronDown,
  Clock3,
  FileText,
  GraduationCap,
  Laptop,
  MessageCircleMore,
  Play,
  Star,
  Trophy,
  UsersRound,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Container } from "@/components/reusables";
import { courseLevelLabels } from "@/lib/courses/constants";
import {
  formatCourseDuration,
  formatLessonDuration,
  lessonTypeLabel,
} from "@/lib/courses/content-format";
import type { CourseDetailData } from "@/lib/courses/types";

import CourseCard from "./CourseCard";
import EnrollmentCTA from "./EnrollmentCTA";
import EnrollmentGuideButton from "./EnrollmentGuideButton";

export default function CourseDetailPage({ data }: { data: CourseDetailData }) {
  const { course } = data;
  const reduceMotion = useReducedMotion();
  const durationLabel = formatCourseDuration(
    course.durationMinutes,
    course.lessonCount,
  );
  const discount =
    course.originalPrice && course.originalPrice > course.price
      ? Math.round((1 - course.price / course.originalPrice) * 100)
      : null;
  const inquiryHref = `/contact?subject=course-inquiry&course=${encodeURIComponent(course.slug)}`;

  return (
    <main className="overflow-hidden bg-[#f6f8fb] pb-24 lg:pb-0">
      <section className="relative bg-navy pb-28 pt-7 text-white sm:pb-32 sm:pt-10 lg:pb-40">
        <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,.22)_1px,transparent_0)] [background-size:32px_32px]" />
        <div className="absolute -right-20 top-8 h-80 w-80 rounded-full bg-btnBg/20 blur-3xl" />
        <div className="absolute -left-20 bottom-0 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />

        <Container className="relative">
          <Link
            href="/courses"
            className="inline-flex items-center gap-2 text-sm font-semibold text-white/65 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            All courses
          </Link>

          <motion.div
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="mt-10 max-w-3xl"
          >
            <div className="flex flex-wrap gap-2">
              <Pill>{course.category}</Pill>
              <Pill>{courseLevelLabels[course.level]}</Pill>
              {course.badge ? <Pill accent>{course.badge}</Pill> : null}
            </div>
            <h1 className="mt-6 text-4xl font-semibold leading-[1.08] tracking-[-0.05em] sm:text-5xl lg:text-6xl">
              {course.title}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-white/68 sm:text-lg">
              {course.shortDescription}
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-white/72">
              <span className="flex items-center gap-2">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <strong className="text-white">{course.rating.toFixed(1)}</strong>
                ({course.reviewCount} reviews)
              </span>
              <span className="flex items-center gap-2">
                <UsersRound className="h-4 w-4 text-[#8cf0d0]" />
                {course.studentsCount.toLocaleString()} learners
              </span>
              <span className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-[#8cf0d0]" />
                {course.instructorName}
              </span>
            </div>
          </motion.div>
        </Container>
      </section>

      <Container className="relative -mt-20 pb-20 lg:-mt-28">
        <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_370px] xl:gap-10">
          <div className="space-y-7">
            <AnimatedSection reduceMotion={reduceMotion}>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Metric icon={BookOpen} value={`${course.lessonCount}`} label="Lessons" />
                <Metric icon={Clock3} value={durationLabel} label="Total duration" />
                <Metric icon={Award} value={courseLevelLabels[course.level]} label="Level" />
                <Metric icon={Laptop} value="Any device" label="Flexible access" />
              </div>
            </AnimatedSection>

            <AnimatedSection reduceMotion={reduceMotion} className="p-6 sm:p-8">
              <Eyebrow>Learning outcomes</Eyebrow>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.035em] text-navy sm:text-3xl">
                What you&apos;ll be able to do
              </h2>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {data.outcomes.map((outcome) => (
                  <div key={outcome} className="flex gap-3">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/12 text-accent">
                      <Check className="h-3.5 w-3.5" strokeWidth={3} />
                    </span>
                    <p className="text-sm leading-6 text-navy/68">{outcome}</p>
                  </div>
                ))}
              </div>
            </AnimatedSection>

            <AnimatedSection reduceMotion={reduceMotion} className="p-6 sm:p-8">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <Eyebrow>Course curriculum</Eyebrow>
                  <h2 className="mt-2 text-2xl font-semibold tracking-[-0.035em] text-navy sm:text-3xl">
                    A clear path from basics to mastery
                  </h2>
                </div>
                <span className="rounded-full bg-heroBg px-4 py-2 text-xs font-bold text-navy/60">
                  {course.lessonCount} lessons
                  {course.lessonCount > 0 ? ` · ${durationLabel}` : ""}
                </span>
              </div>
              {data.curriculum.length > 0 ? (
                <div className="mt-7 divide-y divide-navy/8 overflow-hidden rounded-2xl border border-navy/10">
                  {data.curriculum.map((section, index) => (
                    <details key={section.title} className="group bg-white" open={index === 0}>
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-5 transition hover:bg-heroBg">
                        <span className="flex min-w-0 items-center gap-4">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-navy text-xs font-bold text-white">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <span>
                            <strong className="block text-sm font-semibold text-navy sm:text-base">
                              {section.title}
                            </strong>
                            <span className="mt-1 block text-xs text-navy/45">
                              {section.lessons.length} lesson
                              {section.lessons.length === 1 ? "" : "s"}
                            </span>
                          </span>
                        </span>
                        <ChevronDown className="h-5 w-5 shrink-0 text-navy/40 transition group-open:rotate-180" />
                      </summary>
                      <div className="border-t border-navy/8 bg-[#fafcfe] px-5 py-3 sm:pl-[4.9rem]">
                        {section.lessons.map((lesson) => {
                          const LessonIcon =
                            lesson.type === "QUIZ"
                              ? Trophy
                              : lesson.type === "READING"
                                ? FileText
                                : Play;
                          const duration = formatLessonDuration(lesson.durationSeconds);

                          return (
                            <div
                              key={lesson.id}
                              className="flex items-center justify-between gap-4 border-b border-navy/6 py-3 last:border-0"
                            >
                              <span className="flex min-w-0 items-center gap-3 text-sm text-navy/65">
                                <LessonIcon className="h-3.5 w-3.5 shrink-0 fill-btnBg text-btnBg" />
                                <span className="truncate">{lesson.title}</span>
                              </span>
                              <span className="shrink-0 text-xs text-navy/40">
                                {duration ? `${duration} · ` : ""}
                                {lessonTypeLabel(lesson.type)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </details>
                  ))}
                </div>
              ) : (
                <div className="mt-7 rounded-2xl border border-dashed border-navy/12 bg-[#fafcfe] px-6 py-10 text-center">
                  <BookOpen className="mx-auto h-8 w-8 text-navy/20" />
                  <p className="mt-3 text-sm font-semibold text-navy">
                    Curriculum is being prepared
                  </p>
                  <p className="mt-1 text-sm text-navy/50">
                    Chapters and lessons will appear here once published in Admin → Content.
                  </p>
                </div>
              )}
            </AnimatedSection>

            <AnimatedSection reduceMotion={reduceMotion} className="p-6 sm:p-8">
              <Eyebrow>Meet your instructor</Eyebrow>
              <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-center">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-navy to-btnBg text-2xl font-bold text-white shadow-lg shadow-navy/15">
                  {initials(course.instructorName)}
                </div>
                <div>
                  <h2 className="text-2xl font-semibold tracking-[-0.03em] text-navy">
                    {course.instructorName}
                  </h2>
                  <p className="mt-1 text-sm font-semibold text-accent">
                    {course.subject} Instructor
                  </p>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-navy/60">
                    Learn through clear explanations, guided examples, and focused
                    practice designed around the needs of Bangladeshi students.
                  </p>
                </div>
              </div>
            </AnimatedSection>

            <div className="grid gap-7 md:grid-cols-2">
              <AnimatedSection reduceMotion={reduceMotion} className="p-6">
                <Eyebrow>Requirements</Eyebrow>
                <ul className="mt-5 space-y-4">
                  {data.requirements.map((item) => (
                    <li key={item} className="flex gap-3 text-sm leading-6 text-navy/65">
                      <Check className="mt-1 h-4 w-4 shrink-0 text-accent" />
                      {item}
                    </li>
                  ))}
                </ul>
              </AnimatedSection>
              <AnimatedSection reduceMotion={reduceMotion} className="p-6">
                <Eyebrow>Need help deciding?</Eyebrow>
                <h2 className="mt-3 text-xl font-semibold text-navy">
                  Talk to an academic counsellor
                </h2>
                <p className="mt-3 text-sm leading-7 text-navy/60">
                  Get honest guidance on course fit, learning level, and your study plan.
                </p>
                <Link
                  href={inquiryHref}
                  className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-btnBg"
                >
                  Ask about this course <ArrowRight className="h-4 w-4" />
                </Link>
              </AnimatedSection>
            </div>
          </div>

          <motion.aside
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.12 }}
            className="hidden overflow-hidden rounded-[1.8rem] border border-navy/10 bg-white shadow-[0_24px_70px_rgba(22,51,81,.16)] lg:sticky lg:top-24 lg:block"
          >
            <div className="relative aspect-video overflow-hidden bg-navy">
              <Image
                src={course.thumbnailUrl}
                alt={course.title}
                fill
                priority
                sizes="370px"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-navy/22" />
              <span className="absolute inset-0 m-auto flex h-14 w-14 items-center justify-center rounded-full bg-white text-btnBg shadow-xl">
                <Play className="ml-0.5 h-5 w-5 fill-current" />
              </span>
            </div>
            <div className="p-6">
              {discount ? (
                <span className="rounded-full bg-accent/10 px-3 py-1.5 text-xs font-bold text-accent">
                  Save {discount}%
                </span>
              ) : null}
              <div className="mt-4 flex items-baseline gap-3">
                <span className="text-3xl font-bold tracking-[-0.05em] text-navy">
                  ৳{course.price.toLocaleString("en-US")}
                </span>
                {course.originalPrice ? (
                  <span className="text-base text-navy/35 line-through">
                    ৳{course.originalPrice.toLocaleString("en-US")}
                  </span>
                ) : null}
              </div>
              <EnrollmentCTA
                courseId={course.id}
                courseSlug={course.slug}
                courseTitle={course.title}
                coursePrice={course.price}
              />
              <p className="mt-3 text-center text-xs text-navy/45">
                Course access begins after payment verification
              </p>
              <div className="my-6 h-px bg-navy/8" />
              <p className="text-sm font-bold text-navy">This course includes</p>
              <div className="mt-4 space-y-3">
                {data.includes.map((item, index) => {
                  const Icon = [Play, FileText, BookOpen, MessageCircleMore, Laptop, Award][index] ?? Check;
                  return (
                    <div key={item} className="flex items-center gap-3 text-sm text-navy/60">
                      <Icon className="h-4 w-4 shrink-0 text-accent" />
                      {item}
                    </div>
                  );
                })}
              </div>
              <EnrollmentGuideButton video={data.enrollmentGuideVideo} />
            </div>
          </motion.aside>
        </div>

        {data.related.length ? (
          <section className="mt-16 sm:mt-20">
            <Eyebrow>Keep exploring</Eyebrow>
            <div className="mt-2 flex items-end justify-between gap-4">
              <h2 className="text-2xl font-semibold tracking-[-0.035em] text-navy sm:text-3xl">
                You may also like
              </h2>
              <Link href="/courses" className="hidden text-sm font-bold text-btnBg sm:block">
                View all courses
              </Link>
            </div>
            <div className="mt-7 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {data.related.map((item, index) => (
                <CourseCard key={item.id} course={item} index={index} />
              ))}
            </div>
          </section>
        ) : null}
      </Container>

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-navy/10 bg-white/95 p-3 shadow-[0_-10px_35px_rgba(22,51,81,.12)] backdrop-blur lg:hidden">
        <Container className="flex items-center justify-between gap-4 px-1 sm:px-4">
          <div>
            <span className="block text-xs text-navy/45">Course fee</span>
            <strong className="text-xl text-navy">৳{course.price.toLocaleString("en-US")}</strong>
          </div>
          <EnrollmentCTA
            courseId={course.id}
            courseSlug={course.slug}
            courseTitle={course.title}
            coursePrice={course.price}
            compact
          />
        </Container>
      </div>
    </main>
  );
}

function AnimatedSection({
  children,
  reduceMotion,
  className = "",
}: {
  children: React.ReactNode;
  reduceMotion: boolean | null;
  className?: string;
}) {
  return (
    <motion.section
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`rounded-[1.8rem] border border-navy/10 bg-white shadow-[0_14px_45px_rgba(22,51,81,.06)] ${className}`}
    >
      {children}
    </motion.section>
  );
}

function Pill({
  children,
  accent = false,
}: {
  children: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <span
      className={`rounded-full border px-3.5 py-1.5 text-xs font-bold ${
        accent
          ? "border-[#8cf0d0]/30 bg-[#8cf0d0]/12 text-[#8cf0d0]"
          : "border-white/15 bg-white/8 text-white/78"
      }`}
    >
      {children}
    </span>
  );
}

function Metric({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof BookOpen;
  value: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3 p-4 sm:block sm:p-5">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-heroBg text-accent">
        <Icon className="h-5 w-5" />
      </span>
      <div className="sm:mt-4">
        <strong className="block text-sm font-bold text-navy">{value}</strong>
        <span className="mt-0.5 block text-xs text-navy/42">{label}</span>
      </div>
    </div>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">
      {children}
    </p>
  );
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}
