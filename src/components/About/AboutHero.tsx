"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";

import { Container } from "@/components/reusables";

const AboutHero = () => {
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
      transition: { staggerChildren: shouldReduceMotion ? 0 : 0.1 },
    },
  };

  return (
    <section className="relative isolate overflow-hidden bg-navy pb-28 pt-8 text-soft sm:pb-32 sm:pt-10">
      <motion.div
        aria-hidden
        animate={
          shouldReduceMotion
            ? undefined
            : { y: [0, -16, 0], x: [0, 10, 0] }
        }
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className="absolute left-[-5rem] top-8 h-72 w-72 rounded-full bg-accent/25 blur-3xl"
      />
      <motion.div
        aria-hidden
        animate={
          shouldReduceMotion
            ? undefined
            : { y: [0, 14, 0], x: [0, -8, 0] }
        }
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-[-3rem] right-[-4rem] h-80 w-80 rounded-full bg-btnBg/20 blur-3xl"
      />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.1),transparent_40%),linear-gradient(160deg,rgba(255,255,255,0.06),transparent_50%)]" />

      <Container>
        <motion.div variants={stagger} initial="initial" animate="animate">
          <motion.div variants={fadeUp}>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm transition hover:bg-white/15"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
          </motion.div>

          <motion.div
            variants={fadeUp}
            className="mx-auto mt-10 max-w-4xl text-center sm:mt-12"
          >
            <span className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
              About Broad Academy
            </span>

            <h1 className="mt-6 text-4xl font-semibold leading-[1.1] tracking-[-0.04em] sm:text-5xl lg:text-6xl">
              Learn Today,
              <span className="mt-2 block text-accent">Lead Tomorrow</span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-soft/78 sm:text-lg">
              We are a learning community dedicated to helping Bangladeshi students
              excel academically — with expert mentors, structured programs, and
              the kind of support families can rely on.
            </p>

            <motion.div
              variants={fadeUp}
              className="mt-8 flex flex-wrap items-center justify-center gap-4"
            >
              <Link
                href="/courses"
                className="inline-flex h-12 items-center gap-2 rounded-full bg-accent px-7 text-sm font-semibold text-white transition hover:bg-accent/90"
              >
                Explore Courses
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex h-12 items-center rounded-full border border-white/20 bg-white/10 px-7 text-sm font-semibold transition hover:bg-white/15"
              >
                Contact Us
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>
      </Container>
    </section>
  );
};

export default AboutHero;
