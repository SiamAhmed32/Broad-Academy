"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { Container } from "@/components/reusables";

const AboutCTA = () => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="pb-20 pt-4 sm:pb-24">
      <Container>
        <motion.div
          initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative overflow-hidden rounded-[2rem] border border-navy/10 bg-navy px-6 py-12 text-center text-soft sm:px-12 sm:py-16"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(5,150,105,0.18),transparent_55%)]"
          />
          <div className="relative">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">
              Join the Community
            </p>
            <h2 className="mx-auto mt-4 max-w-2xl text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
              Ready to Start Your Learning Journey?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-8 text-soft/75">
              Whether you are a student preparing for exams or a parent looking
              for the right guidance — we are here to help you take the next step.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/register"
                className="inline-flex h-12 items-center gap-2 rounded-full bg-accent px-7 text-sm font-semibold text-white transition hover:bg-accent/90"
              >
                Get Started Free
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/instructors"
                className="inline-flex h-12 items-center rounded-full border border-white/20 bg-white/10 px-7 text-sm font-semibold transition hover:bg-white/15"
              >
                Meet Our Mentors
              </Link>
            </div>
          </div>
        </motion.div>
      </Container>
    </section>
  );
};

export default AboutCTA;
