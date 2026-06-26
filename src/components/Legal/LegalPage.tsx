"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import { ArrowLeft, CheckCircle2, Clock3 } from "lucide-react";
import Link from "next/link";

import {
  legalPagesData,
  type LegalPageSlug,
} from "@/components/data/legalPagesData";
import { Container } from "@/components/reusables";

type LegalPageProps = {
  slug: LegalPageSlug;
};

const LegalPage = ({ slug }: LegalPageProps) => {
  const shouldReduceMotion = useReducedMotion();
  const page = legalPagesData[slug];
  const PageIcon = page.icon;

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
    <main className="overflow-hidden bg-soft">
      <section className="relative isolate bg-navy py-20 text-soft sm:py-24 lg:py-28">
        <div className="absolute left-0 top-0 -z-10 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 -z-10 h-80 w-80 rounded-full bg-btnBg/20 blur-3xl" />
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
              <PageIcon className="h-8 w-8 text-accent" />
            </motion.div>

            <motion.p
              variants={fadeUp}
              className="text-sm font-semibold uppercase tracking-[0.35em] text-accent"
            >
              {page.eyebrow}
            </motion.p>

            <motion.h1
              variants={fadeUp}
              className="mt-5 text-4xl font-semibold leading-tight tracking-[-0.04em] sm:text-5xl lg:text-6xl"
            >
              {page.title}
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="mx-auto mt-6 max-w-2xl text-base leading-8 text-soft/78 sm:text-lg"
            >
              {page.description}
            </motion.p>

            <motion.div
              variants={fadeUp}
              className="mt-8 flex flex-wrap items-center justify-center gap-4 text-sm text-soft/75"
            >
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 transition hover:bg-white/15"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Link>

              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2">
                <Clock3 className="h-4 w-4" />
                Last updated: {page.lastUpdated}
              </span>
            </motion.div>
          </motion.div>
        </Container>
      </section>

      <Container className="-mt-10 pb-20">
        <motion.div
          initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.2 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative z-10 grid gap-4 rounded-3xl border border-navy/10 bg-white p-4 shadow-2xl shadow-navy/10 md:grid-cols-3"
        >
          {page.highlights.map((highlight) => {
            const HighlightIcon = highlight.icon;

            return (
              <div
                key={highlight.label}
                className="rounded-2xl border border-navy/10 bg-heroBg p-5"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent">
                  <HighlightIcon className="h-5 w-5" />
                </div>
                <p className="text-sm font-medium text-navy/60">
                  {highlight.label}
                </p>
                <h2 className="mt-1 text-lg font-semibold text-navy">
                  {highlight.value}
                </h2>
              </div>
            );
          })}
        </motion.div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[0.35fr_0.65fr]">
          <motion.aside
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: false, amount: 0.25 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="h-fit rounded-3xl border border-navy/10 bg-white p-6 shadow-lg shadow-navy/5 lg:sticky lg:top-8"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">
              On This Page
            </p>
            <div className="mt-5 space-y-3">
              {page.sections.map((section, index) => (
                <a
                  key={section.title}
                  href={`#section-${index + 1}`}
                  className="flex items-start gap-3 rounded-2xl px-3 py-2 text-sm font-medium text-navy/70 transition hover:bg-heroBg hover:text-navy"
                >
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-navy text-xs text-soft">
                    {index + 1}
                  </span>
                  {section.title}
                </a>
              ))}
            </div>
          </motion.aside>

          <div className="space-y-6">
            {page.sections.map((section, index) => (
              <motion.article
                id={`section-${index + 1}`}
                key={section.title}
                initial={
                  shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 26 }
                }
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, amount: 0.2 }}
                transition={{
                  duration: 0.55,
                  delay: shouldReduceMotion ? 0 : index * 0.04,
                  ease: "easeOut",
                }}
                className="rounded-3xl border border-navy/10 bg-white p-6 shadow-lg shadow-navy/5 sm:p-8"
              >
                <div className="mb-6 flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-navy text-soft">
                    {String(index + 1).padStart(2, "0")}
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold tracking-[-0.02em] text-navy">
                      {section.title}
                    </h2>
                    <p className="mt-3 leading-7 text-navy/68">
                      {section.description}
                    </p>
                  </div>
                </div>

                <ul className="space-y-3">
                  {section.points.map((point) => (
                    <li
                      key={point}
                      className="flex gap-3 rounded-2xl bg-soft px-4 py-3 leading-7 text-navy/75"
                    >
                      <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-accent" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </motion.article>
            ))}
          </div>
        </div>
      </Container>
    </main>
  );
};

export default LegalPage;
