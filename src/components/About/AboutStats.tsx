"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useMotionValue, useSpring } from "framer-motion";

import { aboutStats } from "@/components/data/aboutData";
import { Container } from "@/components/reusables";

type AnimatedNumberProps = {
  value: number;
  suffix: string;
};

const AnimatedNumber = ({ value, suffix }: AnimatedNumberProps) => {
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
          maximumFractionDigits: 0,
        }),
      );
    });
  }, [springValue]);

  return (
    <span ref={ref}>
      {displayValue}
      {suffix}
    </span>
  );
};

const AboutStats = () => {
  return (
    <section className="relative -mt-16 sm:-mt-20">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="relative z-10 grid gap-4 rounded-3xl border border-navy/10 bg-white p-4 shadow-2xl shadow-navy/10 sm:grid-cols-2 lg:grid-cols-4"
        >
          {aboutStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.5, delay: index * 0.07 }}
                whileHover={{ y: -4 }}
                className="rounded-2xl border border-navy/8 bg-heroBg p-5"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-navy text-soft">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="text-3xl font-semibold tracking-[-0.03em] text-navy">
                  <AnimatedNumber value={stat.value} suffix={stat.suffix} />
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

export default AboutStats;
