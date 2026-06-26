"use client";

import { motion, useReducedMotion } from "framer-motion";

import { aboutTimeline } from "@/components/data/aboutData";
import { Container } from "@/components/reusables";

const AboutTimeline = () => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="relative overflow-hidden bg-navy py-16 text-soft sm:py-20">
      <div className="absolute left-[-4rem] top-0 h-64 w-64 rounded-full bg-accent/15 blur-3xl" />
      <div className="absolute bottom-0 right-[-3rem] h-72 w-72 rounded-full bg-btnBg/15 blur-3xl" />

      <Container className="relative">
        <motion.div
          initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="mx-auto max-w-3xl text-center"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">
            Our Journey
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
            Growing With Our Students
          </h2>
          <p className="mt-4 text-base leading-7 text-soft/75 sm:text-lg">
            From a small tutoring initiative to a nationwide learning community
            — every milestone shaped by the students we serve.
          </p>
        </motion.div>

        <div className="relative mt-12">
          <div
            aria-hidden
            className="absolute bottom-0 left-4 top-0 w-px bg-gradient-to-b from-accent/60 via-white/20 to-transparent sm:left-1/2 sm:-translate-x-px"
          />

          <div className="space-y-8 sm:space-y-12">
            {aboutTimeline.map((item, index) => {
              const isEven = index % 2 === 0;
              return (
                <motion.div
                  key={item.year}
                  initial={
                    shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 24 }
                  }
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{
                    duration: 0.5,
                    delay: index * 0.06,
                    ease: "easeOut",
                  }}
                  className={`relative flex flex-col gap-4 sm:flex-row sm:items-center ${
                    isEven ? "sm:flex-row" : "sm:flex-row-reverse"
                  }`}
                >
                  <div className="hidden flex-1 sm:block" />

                  <div className="absolute left-4 top-6 z-10 flex h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full bg-accent text-xs font-bold text-white shadow-lg sm:left-1/2">
                    {index + 1}
                  </div>

                  <article
                    className={`relative ml-10 max-w-lg rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm sm:ml-0 sm:flex-1 ${
                      isEven ? "sm:mr-auto sm:pr-12" : "sm:ml-auto sm:pl-12"
                    }`}
                  >
                    <span className="inline-flex rounded-full bg-accent/20 px-3 py-1 text-xs font-semibold text-accent">
                      {item.year}
                    </span>
                    <h3 className="mt-3 text-xl font-semibold">{item.title}</h3>
                    <p className="mt-2 leading-7 text-soft/75">{item.description}</p>
                  </article>

                  <div className="hidden flex-1 sm:block" />
                </motion.div>
              );
            })}
          </div>
        </div>
      </Container>
    </section>
  );
};

export default AboutTimeline;
