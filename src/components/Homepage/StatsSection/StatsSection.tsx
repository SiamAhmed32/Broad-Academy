"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useMotionValue, useSpring } from "framer-motion";
import {
  BookOpen,
  GraduationCap,
  HeartHandshake,
  UsersRound,
} from "lucide-react";

import { Container } from "@/components/reusables";

const stats = [
  {
    id: 1,
    label: "Students",
    value: 130000,
    suffix: "+",
    description: "Empowering students to achieve their academic goals.",
    icon: BookOpen,
  },
  {
    id: 2,
    label: "Team Members",
    value: 27,
    suffix: "+",
    description: "Together, we foster student growth and success.",
    icon: UsersRound,
  },
  {
    id: 3,
    label: "Mentorships",
    value: 10000,
    suffix: "+",
    description: "Supporting students with personalized academic guidance.",
    icon: GraduationCap,
  },
  {
    id: 4,
    label: "Parent Counseling Sessions",
    value: 2000,
    suffix: "+",
    description: "Guiding parents to support their child's learning journey.",
    icon: HeartHandshake,
  },
];

type AnimatedNumberProps = {
  value: number;
  suffix: string;
  decimals?: number;
};

const AnimatedNumber = ({ value, suffix, decimals = 0 }: AnimatedNumberProps) => {
  const ref = useRef<HTMLSpanElement | null>(null);
  const isInView = useInView(ref, { amount: 0.6 });
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, {
    stiffness: 90,
    damping: 20,
    mass: 0.8,
  });
  const [displayValue, setDisplayValue] = useState("0");

  useEffect(() => {
    motionValue.set(isInView ? value : 0);
  }, [isInView, motionValue, value]);

  useEffect(() => {
    return springValue.on("change", (latest) => {
      setDisplayValue(
        latest.toLocaleString("en-US", {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        }),
      );
    });
  }, [decimals, springValue]);

  return (
    <span ref={ref}>
      {displayValue}
      {suffix}
    </span>
  );
};

const StatsSection = () => {
  return (
    <section className="relative overflow-hidden bg-soft py-16 sm:py-20">
      <div className="absolute left-[-8rem] top-8 h-72 w-72 rounded-full bg-accent/10 blur-3xl" />
      <div className="absolute bottom-[-10rem] right-[-6rem] h-80 w-80 rounded-full bg-btnBg/10 blur-3xl" />

      <Container className="relative">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.35 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="mx-auto max-w-4xl text-center"
        >
          <h2 className="text-3xl font-semibold tracking-[-0.03em] text-navy sm:text-4xl lg:text-5xl">
            Our Community
          </h2>
          <p className="mt-4 text-base leading-7 text-navy/65 sm:text-lg">
            We empower students through high-quality education and guide
            parents to support their child&apos;s learning journey, with a
            dedicated team of teachers and mentors providing personalized
            mentorship and a dynamic learning community committed to academic
            excellence and lifelong success.
          </p>
        </motion.div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            const decimals = stat.value % 1 === 0 ? 0 : 1;

            return (
              <motion.article
                key={stat.id}
                initial={{ opacity: 0, y: 34, scale: 0.94 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: false, amount: 0.35 }}
                transition={{
                  duration: 0.55,
                  delay: index * 0.08,
                  ease: "easeOut",
                }}
                whileHover={{
                  y: -8,
                  transition: { type: "spring", stiffness: 320, damping: 20 },
                }}
                className="group relative overflow-hidden rounded-3xl border border-navy/10 bg-white p-6 shadow-xl shadow-navy/5"
              >
                <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-accent/70 to-transparent" />
                <motion.div
                  initial={{ rotate: -8, scale: 0.9 }}
                  whileInView={{ rotate: 0, scale: 1 }}
                  viewport={{ once: false, amount: 0.5 }}
                  transition={{
                    type: "spring",
                    stiffness: 260,
                    damping: 16,
                    delay: index * 0.08 + 0.12,
                  }}
                  className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-navy text-soft shadow-lg shadow-navy/20 group-hover:bg-accent"
                >
                  <Icon className="h-7 w-7" />
                </motion.div>

                <h3 className="text-4xl font-semibold tracking-[-0.04em] text-navy sm:text-5xl">
                  <AnimatedNumber
                    value={stat.value}
                    suffix={stat.suffix}
                    decimals={decimals}
                  />
                </h3>
                <p className="mt-3 min-h-12 text-sm font-semibold uppercase leading-6 tracking-[0.14em] text-accent">
                  {stat.label}
                </p>
                <p className="mt-4 leading-7 text-navy/62">{stat.description}</p>
              </motion.article>
            );
          })}
        </div>
      </Container>
    </section>
  );
};

export default StatsSection;
