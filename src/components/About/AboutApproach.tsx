"use client";

import { motion, useReducedMotion } from "framer-motion";

import { aboutApproach } from "@/components/data/aboutData";
import { Container } from "@/components/reusables";

const AboutApproach = () => {
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
            {aboutApproach.eyebrow}
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-navy sm:text-4xl">
            {aboutApproach.title}
          </h2>
        </motion.div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {aboutApproach.steps.map((step, index) => (
            <motion.article
              key={step.step}
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{
                duration: 0.5,
                delay: index * 0.08,
                ease: "easeOut",
              }}
              className="group relative overflow-hidden rounded-3xl border border-navy/10 bg-white p-6 shadow-lg shadow-navy/5 sm:p-7"
            >
              <div className="absolute right-4 top-4 text-5xl font-bold text-navy/[0.04] transition-colors group-hover:text-accent/10">
                {step.step}
              </div>
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-navy text-sm font-semibold text-soft">
                {step.step}
              </span>
              <h3 className="mt-5 text-xl font-semibold text-navy">{step.title}</h3>
              <p className="mt-3 leading-7 text-navy/65">{step.description}</p>
            </motion.article>
          ))}
        </div>
      </Container>
    </section>
  );
};

export default AboutApproach;
