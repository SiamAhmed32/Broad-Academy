import {
  ArrowLeft,
  ArrowRight,
  Award,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  MessageCircle,
  MessagesSquare,
  MonitorSmartphone,
  PhoneCall,
  PlayCircle,
  Radio,
  TrendingUp,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { contactDetails } from "@/components/data/contactData";
import { Container } from "@/components/reusables";
import { courseLevelLabels } from "@/lib/courses/constants";
import { formatBanglaTaka, toBanglaDigits } from "@/lib/courses/content-format";
import type { CourseDetailData } from "@/lib/courses/types";
import { cn } from "@/lib/utils";

import CourseAbout from "./CourseAbout";
import CourseCard from "./CourseCard";
import CourseInstructors from "./CourseInstructors";
import EnrollmentCTA from "./EnrollmentCTA";
import EnrollmentGuideButton from "./EnrollmentGuideButton";

/**
 * Public course page. Kept deliberately simple (title, teachers, admin-written
 * details, helpline + a purchase card): classes are uploaded gradually, so
 * auto-generated lesson counts / curriculum confused students and parents.
 */
export default function CourseDetailPage({ data }: { data: CourseDetailData }) {
  const { course } = data;
  const savings =
    course.originalPrice && course.originalPrice > course.price
      ? course.originalPrice - course.price
      : 0;
  const priceLabel = course.price > 0 ? formatBanglaTaka(course.price) : "ফ্রি";
  const enrollmentProps = {
    courseId: course.id,
    courseSlug: course.slug,
    courseTitle: course.title,
    coursePrice: course.price,
  };

  return (
    <div className="overflow-x-clip bg-[#f5f8fc] pb-28 lg:pb-24">
      <Container>
        <div className="grid lg:grid-cols-[minmax(0,1fr)_360px] lg:grid-rows-[auto_1fr] lg:gap-x-10 xl:grid-cols-[minmax(0,1fr)_380px] xl:gap-x-14">
          {/* Brand header band. The box-shadow + clip-path pair stretches the
              navy background edge to edge while the text stays in the left
              column, so the purchase card can sit on top of it on desktop. */}
          <header className="relative bg-navy py-8 text-white shadow-[0_0_0_100vmax_var(--color-navy)] [clip-path:inset(0_-100vmax)] sm:py-10 lg:col-start-1 lg:row-start-1 lg:py-14">
            <Link
              href="/courses"
              className="font-bangla inline-flex items-center gap-1.5 rounded-full text-sm font-medium text-white/70 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            >
              <ArrowLeft className="h-4 w-4" />
              সব কোর্স
            </Link>

            <div className="mt-6 flex flex-wrap gap-2">
              <Pill>{courseLevelLabels[course.level]}</Pill>
              {course.category !== courseLevelLabels[course.level] ? (
                <Pill>{course.category}</Pill>
              ) : null}
              {course.badge ? <Pill highlight>{course.badge}</Pill> : null}
            </div>

            <h1 className="font-bangla mt-4 text-[1.75rem] font-bold leading-[1.35] sm:text-4xl sm:leading-[1.3] lg:text-[2.625rem]">
              {course.title}
            </h1>
            <p className="font-bangla mt-4 max-w-2xl text-base leading-[1.85] text-white/80 sm:text-lg sm:leading-[1.85]">
              {course.shortDescription}
            </p>
          </header>

          {/* Purchase card: right column on desktop (sticky, overlapping the
              header band), straight after the header on smaller screens. */}
          <aside
            aria-label="কোর্স ফি ও ভর্তি"
            className="mt-6 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:mt-0 lg:pt-10"
          >
            <div className="overflow-hidden rounded-3xl border border-navy/10 bg-white shadow-[0_24px_60px_-24px_rgba(22,51,81,.38)] lg:sticky lg:top-24 lg:max-h-[calc(100dvh-7.5rem)] lg:overflow-y-auto lg:[scrollbar-width:thin]">
              <div className="md:grid md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] md:items-center lg:block">
                <div className="relative aspect-video overflow-hidden bg-heroBg md:m-5 md:mr-0 md:rounded-2xl lg:m-0 lg:rounded-none">
                  <Image
                    src={course.thumbnailUrl}
                    alt={course.title}
                    fill
                    preload
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 380px"
                    className="object-cover"
                  />
                </div>

                <div className="px-5 pt-5 sm:px-6 sm:pt-6 md:pb-5 md:pt-0 lg:pb-0 lg:pt-6">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                    <span className="sr-only font-bangla">কোর্স ফি:</span>
                    <span className="text-[2rem] font-bold leading-none tracking-tight text-navy">
                      {priceLabel}
                    </span>
                    {savings && course.originalPrice ? (
                      <>
                        <del className="text-lg font-medium text-navy/45">
                          <span className="sr-only font-bangla">আগের মূল্য </span>
                          {formatBanglaTaka(course.originalPrice)}
                        </del>
                        <span className="font-bangla rounded-full bg-[#e7f7ee] px-2.5 py-1 text-xs font-bold text-[#0d7039]">
                          {toBanglaDigits(savings.toLocaleString("en-US"))} ৳ ছাড়
                        </span>
                      </>
                    ) : null}
                  </div>
                  <EnrollmentCTA {...enrollmentProps} />
                </div>
              </div>

              <div className="px-5 pb-6 pt-6 sm:px-6 md:pt-1 lg:pt-6">
                <div className="mb-6 h-px bg-navy/8" />
                <h2 className="font-bangla text-lg font-bold text-navy">এই কোর্সে যা থাকছে</h2>
                <ul className="mt-4 grid gap-3.5 md:grid-cols-2 md:gap-x-6 lg:grid-cols-1">
                  {data.includes.map((item, index) => {
                    const Icon = includeIcon(item);
                    return (
                      <li key={`${index}-${item}`} className="flex items-start gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-heroBg text-accent">
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="font-bangla pt-1 text-[15px] leading-6 text-navy/85">
                          {item}
                        </span>
                      </li>
                    );
                  })}
                </ul>
                <div className="mt-6">
                  <EnrollmentGuideButton video={data.enrollmentGuideVideo} />
                </div>
              </div>
            </div>
          </aside>

          <div className="mt-12 min-w-0 space-y-12 lg:col-start-1 lg:row-start-2 lg:mt-0 lg:pt-12">
            {data.instructors.length ? (
              <CourseInstructors
                instructors={data.instructors}
                heading={<SectionTitle>কোর্স শিক্ষক</SectionTitle>}
              />
            ) : null}

            {course.description ? (
              <section>
                <SectionTitle>কোর্স ডিটেইলস</SectionTitle>
                <div className={cn(cardClass, "mt-5 p-5 sm:p-7")}>
                  <h3 className="font-bangla text-lg font-bold text-navy">কোর্স সম্পর্কে:</h3>
                  <div className="mt-3">
                    <CourseAbout text={course.description} />
                  </div>
                </div>
              </section>
            ) : null}

            <section>
              <SectionTitle>হেল্পলাইন</SectionTitle>
              <div
                className={cn(
                  cardClass,
                  "mt-5 flex flex-col gap-5 p-5 sm:p-7 xl:flex-row xl:items-center xl:justify-between",
                )}
              >
                <div className="flex items-start gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-heroBg text-btnBg">
                    <PhoneCall className="h-5 w-5" />
                  </span>
                  <p className="font-bangla text-[15px] leading-7 text-body sm:text-base sm:leading-8">
                    কোর্স সম্পর্কে যেকোনো তথ্যের জন্য কল করুন{" "}
                    <a
                      href={contactDetails.phoneHref}
                      className="whitespace-nowrap font-bold text-btnBg underline-offset-4 hover:text-btnBgDark hover:underline"
                    >
                      {contactDetails.phone}
                    </a>{" "}
                    <span className="whitespace-nowrap">(সকাল ১০টা থেকে রাত ১১টা)</span>
                  </p>
                </div>
                <div className="flex gap-2.5 xl:shrink-0">
                  <a
                    href={contactDetails.phoneHref}
                    className="font-bangla inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-btnBg px-5 text-sm font-semibold text-white shadow-md shadow-btnBg/20 transition hover:bg-btnBgDark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-btnBg/40 focus-visible:ring-offset-2 xl:flex-none"
                  >
                    <PhoneCall className="h-4 w-4" />
                    কল করুন
                  </a>
                  <a
                    href={contactDetails.whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-[#1f9d55]/30 bg-white px-5 text-sm font-semibold text-[#14803f] transition hover:border-[#1f9d55]/60 hover:bg-[#1f9d55]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f9d55]/40 focus-visible:ring-offset-2 xl:flex-none"
                  >
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp
                  </a>
                </div>
              </div>
            </section>
          </div>
        </div>

        {data.related.length ? (
          <section className="mt-16 border-t border-navy/8 pt-12 sm:mt-20">
            <div className="flex items-end justify-between gap-4">
              <SectionTitle>আরও কিছু কোর্স</SectionTitle>
              <Link
                href="/courses"
                className="font-bangla inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-btnBg transition hover:text-btnBgDark"
              >
                সব কোর্স দেখুন
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {data.related.map((item, index) => (
                <CourseCard key={item.id} course={item} index={index} />
              ))}
            </div>
          </section>
        ) : null}
      </Container>

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-navy/10 bg-white/95 p-3 shadow-[0_-10px_35px_rgba(22,51,81,.12)] backdrop-blur lg:hidden">
        <Container className="flex items-center justify-between gap-4 px-1 sm:px-4">
          <div className="min-w-0">
            <span className="font-bangla block text-xs text-body">কোর্স ফি</span>
            <span className="flex items-baseline gap-2">
              <strong className="text-xl text-navy">{priceLabel}</strong>
              {savings && course.originalPrice ? (
                <del className="text-sm text-navy/45">
                  {formatBanglaTaka(course.originalPrice)}
                </del>
              ) : null}
            </span>
          </div>
          <EnrollmentCTA {...enrollmentProps} compact />
        </Container>
      </div>
    </div>
  );
}

const cardClass =
  "rounded-2xl border border-navy/8 bg-white shadow-[0_12px_32px_-20px_rgba(22,51,81,.3)]";

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-bangla flex items-center gap-3 text-xl font-bold text-navy sm:text-2xl">
      <span
        aria-hidden
        className="h-6 w-1.5 shrink-0 rounded-full bg-gradient-to-b from-btnBg to-btnBgDark"
      />
      {children}
    </h2>
  );
}

function Pill({
  children,
  highlight = false,
}: {
  children: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <span
      className={cn(
        "rounded-full px-3 py-1 text-xs font-semibold",
        highlight
          ? "bg-btnBg text-white"
          : "border border-white/15 bg-white/10 text-white/85",
      )}
    >
      {children}
    </span>
  );
}

// Admin writes the "includes" lines freely, so pick an icon from keywords
// (Bangla or English); anything unrecognised gets a check mark.
// Order matters: the first matching rule wins.
const includeIconRules: Array<[RegExp, LucideIcon]> = [
  [/লাইভ|\blive\b|zoom|জুম/i, Radio],
  [/গ্রুপ|group|ফেসবুক|facebook|কমিউনিটি|community/i, UsersRound],
  [/পরীক্ষা|এক্সাম|exam|টেস্ট|\btest|কুইজ|quiz|mcq|assessment/i, ClipboardCheck],
  [/নোট|\bnote|pdf|পিডিএফ|শিট|sheet|বই|\bbook|ম্যাটেরিয়াল|material|reading|resource|ডাউনলোড|download|ব্যাংক|\bbank/i, FileText],
  [/ভিডিও|video|রেকর্ড|record|ক্লাস|class|লেকচার|lecture|lesson/i, PlayCircle],
  [/সাপোর্ট|support|সমাধান|solution|ডাউট|doubt|প্রশ্ন|question|মেন্টর|mentor/i, MessagesSquare],
  [/সার্টিফিকেট|certificate|সনদ/i, Award],
  [/মোবাইল|mobile|ডিভাইস|device|কম্পিউটার|computer|desktop|অ্যাপ|app\b|access/i, MonitorSmartphone],
  [/মাস|month|সপ্তাহ|সাপ্তাহিক|week|ঘণ্টা|ঘন্টা|hour|রুটিন|routine|schedule|শিডিউল/i, CalendarClock],
  [/প্রগ্রেস|progress|ট্র্যাক|track|রিপোর্ট|report/i, TrendingUp],
];

function includeIcon(text: string): LucideIcon {
  return includeIconRules.find(([pattern]) => pattern.test(text))?.[1] ?? CheckCircle2;
}
