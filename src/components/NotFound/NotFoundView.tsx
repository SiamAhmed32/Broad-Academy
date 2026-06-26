"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  BookOpen,
  GraduationCap,
  Home,
  Mail,
  Puzzle,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { TicTacToeBoard } from "@/components/games/TicTacToeBoard";
import { Container } from "@/components/reusables";

const quickLinks = [
  { label: "Go Home", href: "/", icon: Home, variant: "primary" },
  { label: "Browse Courses", href: "/courses", icon: BookOpen, variant: "soft" },
  {
    label: "Book Counselling",
    href: "/counselling",
    icon: GraduationCap,
    variant: "outline",
  },
] as const;

const floatingItems = [
  { icon: BookOpen, className: "left-[7%] top-[18%]", delay: 0 },
  { icon: GraduationCap, className: "right-[9%] top-[20%]", delay: 0.8 },
  { icon: Sparkles, className: "left-[12%] bottom-[20%]", delay: 1.4 },
  { icon: Puzzle, className: "right-[13%] bottom-[18%]", delay: 2 },
];

export default function NotFoundView() {
  const reduceMotion = useReducedMotion();
  const router = useRouter();

  return (
    <main className="relative min-h-[calc(100vh-80px)] overflow-hidden bg-[#f3f7fb] py-12 sm:py-20 lg:py-24">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(22,51,81,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(22,51,81,0.045)_1px,transparent_1px)] bg-[size:42px_42px]" />
      <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-btnBg/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-10 h-72 w-72 rounded-full bg-accent/10 blur-3xl" />

      {!reduceMotion
        ? floatingItems.map((item) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.className}
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  y: [0, -14, 0],
                  rotate: [0, 4, -4, 0],
                }}
                transition={{
                  opacity: { duration: 0.4, delay: item.delay },
                  scale: { duration: 0.4, delay: item.delay },
                  y: {
                    duration: 6,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                    delay: item.delay,
                  },
                  rotate: {
                    duration: 7,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                    delay: item.delay,
                  },
                }}
                className={`pointer-events-none absolute hidden rounded-2xl border border-white/80 bg-white/70 p-3 text-navy shadow-lg backdrop-blur-sm lg:block ${item.className}`}
              >
                <Icon className="h-5 w-5" />
              </motion.div>
            );
          })
        : null}

      <Container className="relative">
        <motion.section
          initial={reduceMotion ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="mx-auto max-w-5xl overflow-hidden rounded-[1.75rem] border border-white/80 bg-white/90 shadow-[0_24px_90px_rgba(22,51,81,0.12)] backdrop-blur-sm sm:rounded-[2rem]"
        >
          <div className="grid items-center gap-9 px-5 py-8 sm:px-9 sm:py-12 lg:grid-cols-[1fr_1.05fr] lg:px-12 lg:py-14">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 rounded-full border border-navy/10 bg-navy/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-navy">
                <Puzzle className="h-4 w-4" />
                Error 404
              </div>

              <h1 className="mt-5 text-3xl font-semibold tracking-tight text-navy sm:mt-6 sm:text-5xl">
                Looks like this lesson is missing.
              </h1>

              <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base lg:max-w-xl">
                This page may have moved, been removed, or never existed. Your
                learning journey is still on track—choose where you would like
                to continue.
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center lg:mt-8 lg:justify-start">
                {quickLinks.map((link) => {
                  const Icon = link.icon;
                  const className =
                    link.variant === "primary"
                      ? "bg-navy text-white hover:-translate-y-0.5 hover:shadow-lg"
                      : link.variant === "soft"
                        ? "bg-[#edf3fb] text-navy hover:-translate-y-0.5 hover:shadow-md"
                        : "border border-navy/15 bg-white text-navy hover:-translate-y-0.5 hover:shadow-md";

                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition ${className}`}
                    >
                      <Icon className="h-4 w-4" />
                      {link.label}
                    </Link>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => router.back()}
                className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-navy/65 transition hover:text-navy"
              >
                <ArrowLeft className="h-4 w-4" />
                Go back
              </button>

              <div className="mt-7 rounded-2xl border border-dashed border-navy/15 bg-[#f8fbff] p-4 text-left text-sm leading-6 text-slate-600 lg:mt-8">
                <span className="font-semibold text-navy">Still stuck?</span>{" "}
                Contact our team and we will help you find the correct page.
                <Link
                  href="/contact"
                  className="mt-2 flex w-fit items-center gap-1.5 font-semibold text-accent transition hover:text-accent/80"
                >
                  <Mail className="h-4 w-4" />
                  Contact support
                </Link>
              </div>
            </div>

            <div className="relative mx-auto flex w-full max-w-[390px] items-center justify-center">
              <TicTacToeBoard className="w-full max-w-[360px]" />
            </div>
          </div>
        </motion.section>
      </Container>
    </main>
  );
}
