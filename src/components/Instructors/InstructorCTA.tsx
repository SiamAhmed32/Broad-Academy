"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";

import { Container } from "@/components/reusables";

const InstructorCTA = () => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="relative overflow-hidden bg-navy py-16 text-soft sm:py-20">
      <div className="absolute left-[-4rem] top-0 h-64 w-64 rounded-full bg-accent/20 blur-3xl" />
      <div className="absolute bottom-0 right-[-3rem] h-72 w-72 rounded-full bg-btnBg/15 blur-3xl" />

      <Container>
        <motion.div
          initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.35 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 p-8 text-center backdrop-blur sm:p-12"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),transparent_55%)]" />
          <div className="relative">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-accent">
              Join Our Team
            </p>
            <h2 className="mx-auto mt-4 max-w-2xl text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
              Passionate About Teaching? We&apos;d Love to Hear From You.
            </h2>
            <p className="mx-auto mt-4 max-w-xl leading-7 text-soft/75">
              Broad Academy is always looking for dedicated educators who inspire
              confidence, clarity, and lifelong learning.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/contact"
                className="inline-flex h-12 items-center justify-center rounded-full bg-accent px-7 text-sm font-semibold text-white transition hover:bg-accent/90"
              >
                Apply to Teach
              </Link>
              <Link
                href="/courses"
                className="inline-flex h-12 items-center justify-center rounded-full border border-white/20 bg-white/10 px-7 text-sm font-semibold transition hover:bg-white/15"
              >
                Browse Courses
              </Link>
            </div>
          </div>
        </motion.div>
      </Container>
    </section>
  );
};

export default InstructorCTA;
