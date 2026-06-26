"use client";

import { motion, useReducedMotion } from "framer-motion";

import { aboutPillars } from "@/components/data/aboutData";
import { Container } from "@/components/reusables";

const AboutPillars = () => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="py-16 sm:py-20">
      <Container>
        <motion.div
          initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="mx-auto max-w-3xl text-center"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">
            Why Broad Academy
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-navy sm:text-4xl">
            More Than Just Classes
          </h2>
          <p className="mt-4 text-base leading-7 text-navy/65 sm:text-lg">
            We combine academic rigor with genuine care — creating an experience
            students enjoy and parents trust.
          </p>
        </motion.div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {aboutPillars.map((pillar, index) => {
            const Icon = pillar.icon;
            return (
              <motion.article
                key={pillar.id}
                initial={
                  shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 28 }
                }
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{
                  duration: 0.5,
                  delay: index * 0.06,
                  ease: "easeOut",
                }}
                whileHover={{ y: -6 }}
                className="rounded-3xl border border-navy/10 bg-white p-6 shadow-lg shadow-navy/5"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-navy">
                  {pillar.title}
                </h3>
                <p className="mt-3 leading-7 text-navy/65">{pillar.description}</p>
              </motion.article>
            );
          })}
        </div>
      </Container>
    </section>
  );
};

export default AboutPillars;
