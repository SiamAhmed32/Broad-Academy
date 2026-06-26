"use client";

import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";

import { aboutStory } from "@/components/data/aboutData";
import { Container } from "@/components/reusables";

const AboutStory = () => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="relative overflow-hidden bg-soft py-16 sm:py-20">
      <div className="absolute left-[-6rem] top-10 h-64 w-64 rounded-full bg-accent/10 blur-3xl" />
      <div className="absolute bottom-0 right-[-4rem] h-72 w-72 rounded-full bg-btnBg/10 blur-3xl" />

      <Container className="relative">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <motion.div
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: -28 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="relative"
          >
            <div className="relative overflow-hidden rounded-[1.75rem] shadow-2xl shadow-navy/10">
              <div className="relative aspect-[4/3] sm:aspect-[5/4]">
                <Image
                  src={aboutStory.image.src}
                  alt={aboutStory.image.alt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-navy/50 via-transparent to-transparent" />
              </div>
            </div>

            <motion.div
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="absolute -bottom-6 -right-2 grid gap-2 rounded-2xl border border-navy/10 bg-white p-4 shadow-xl shadow-navy/10 sm:-right-6 sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-navy/8"
            >
              {aboutStory.highlights.map((item) => (
                <div key={item.label} className="px-3 py-1 text-center sm:py-0">
                  <p className="text-lg font-semibold text-navy">{item.value}</p>
                  <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-navy/50">
                    {item.label}
                  </p>
                </div>
              ))}
            </motion.div>
          </motion.div>

          <motion.div
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: 28 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">
              {aboutStory.eyebrow}
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-navy sm:text-4xl">
              {aboutStory.title}
            </h2>
            <div className="mt-6 space-y-5">
              {aboutStory.paragraphs.map((paragraph) => (
                <p key={paragraph.slice(0, 40)} className="leading-8 text-navy/70">
                  {paragraph}
                </p>
              ))}
            </div>
          </motion.div>
        </div>
      </Container>
    </section>
  );
};

export default AboutStory;
