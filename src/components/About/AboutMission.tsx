"use client";

import { motion, useReducedMotion } from "framer-motion";

import { aboutMission } from "@/components/data/aboutData";
import { Container } from "@/components/reusables";

const cards = [
  aboutMission.mission,
  aboutMission.vision,
  aboutMission.values,
];

const AboutMission = () => {
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
            What Drives Us
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-navy sm:text-4xl">
            Mission, Vision & Values
          </h2>
          <p className="mt-4 text-base leading-7 text-navy/65 sm:text-lg">
            Everything we build starts with a commitment to learners and the
            families who support them.
          </p>
        </motion.div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {cards.map((card, index) => {
            const Icon = card.icon;
            return (
              <motion.article
                key={card.title}
                initial={
                  shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 30 }
                }
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{
                  duration: 0.55,
                  delay: index * 0.08,
                  ease: "easeOut",
                }}
                whileHover={{
                  y: -6,
                  transition: { type: "spring", stiffness: 300, damping: 22 },
                }}
                className="group relative overflow-hidden rounded-3xl border border-navy/10 bg-white p-7 shadow-lg shadow-navy/5"
              >
                <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-accent/60 to-transparent" />
                <motion.div
                  whileHover={{ rotate: 4, scale: 1.05 }}
                  className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-navy text-soft transition-colors group-hover:bg-accent"
                >
                  <Icon className="h-7 w-7" />
                </motion.div>
                <h3 className="text-xl font-semibold tracking-[-0.02em] text-navy">
                  {card.title}
                </h3>
                <p className="mt-4 leading-7 text-navy/65">{card.description}</p>
              </motion.article>
            );
          })}
        </div>
      </Container>
    </section>
  );
};

export default AboutMission;
