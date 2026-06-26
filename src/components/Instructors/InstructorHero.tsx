"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import { ArrowLeft, UsersRound } from "lucide-react";
import Link from "next/link";

import { Container } from "@/components/reusables";

const InstructorHero = () => {
  const shouldReduceMotion = useReducedMotion();

  const fadeUp: Variants = {
    initial: shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 28 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  const stagger: Variants = {
    initial: {},
    animate: {
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.1,
      },
    },
  };

  return (
    <section className="relative isolate overflow-hidden bg-navy py-20 text-soft sm:py-24 lg:py-28">
      <motion.div
        aria-hidden
        animate={
          shouldReduceMotion
            ? undefined
            : {
                y: [0, -18, 0],
                x: [0, 12, 0],
              }
        }
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className="absolute left-[-5rem] top-10 h-72 w-72 rounded-full bg-accent/25 blur-3xl"
      />
      <motion.div
        aria-hidden
        animate={
          shouldReduceMotion
            ? undefined
            : {
                y: [0, 16, 0],
                x: [0, -10, 0],
              }
        }
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-[-4rem] right-[-3rem] h-80 w-80 rounded-full bg-btnBg/20 blur-3xl"
      />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.12),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.08),transparent_45%)]" />

      <Container>
        <motion.div
          variants={stagger}
          initial="initial"
          animate="animate"
          className="mx-auto max-w-4xl text-center"
        >
          <motion.div
            variants={fadeUp}
            className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/15 bg-white/10 shadow-2xl shadow-black/20 backdrop-blur"
          >
            <UsersRound className="h-8 w-8 text-accent" />
          </motion.div>

          <motion.p
            variants={fadeUp}
            className="text-sm font-semibold uppercase tracking-[0.35em] text-accent"
          >
            World-Class Mentors
          </motion.p>

          <motion.h1
            variants={fadeUp}
            className="mt-5 text-4xl font-semibold leading-tight tracking-[-0.04em] sm:text-5xl lg:text-6xl"
          >
            Meet the Minds Behind
            <span className="mt-2 block text-accent">Your Success Story</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="mx-auto mt-6 max-w-2xl text-base leading-8 text-soft/78 sm:text-lg"
          >
            Learn from passionate educators who combine deep subject expertise
            with personalized mentorship — guiding students and families every
            step of the academic journey.
          </motion.p>

          <motion.div
            variants={fadeUp}
            className="mt-8 flex flex-wrap items-center justify-center gap-4"
          >
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm transition hover:bg-white/15"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-accent/90"
            >
              Start Learning Today
            </Link>
          </motion.div>
        </motion.div>
      </Container>
    </section>
  );
};

export default InstructorHero;
