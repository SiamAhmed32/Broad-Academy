"use client";

import { motion, useInView, useMotionValue, useSpring } from "framer-motion";
import { BookOpen, Star, UsersRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Container } from "@/components/reusables";

type AnimatedNumberProps = {
  value: number;
  suffix?: string;
  decimals?: number;
};

const AnimatedNumber = ({
  value,
  suffix = "",
  decimals = 0,
}: AnimatedNumberProps) => {
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

type InstructorStatsProps = {
  total: number;
};

const InstructorStats = ({ total }: InstructorStatsProps) => {
  const stats = [
    {
      label: "Expert Instructors",
      value: total || 27,
      suffix: "+",
      icon: UsersRound,
    },
    {
      label: "Active Courses",
      value: 120,
      suffix: "+",
      icon: BookOpen,
    },
    {
      label: "Average Rating",
      value: 4.8,
      suffix: "/5",
      decimals: 1,
      icon: Star,
    },
  ];

  return (
    <section className="relative -mt-10 pb-4">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.3 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="relative z-10 grid gap-4 rounded-3xl border border-navy/10 bg-white p-4 shadow-2xl shadow-navy/10 md:grid-cols-3"
        >
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, amount: 0.4 }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                whileHover={{ y: -4 }}
                className="rounded-2xl border border-navy/10 bg-heroBg p-5"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="text-3xl font-semibold tracking-[-0.03em] text-navy">
                  <AnimatedNumber
                    value={stat.value}
                    suffix={stat.suffix}
                    decimals={stat.decimals ?? 0}
                  />
                </p>
                <p className="mt-1 text-sm font-medium text-navy/60">{stat.label}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </Container>
    </section>
  );
};

export default InstructorStats;
