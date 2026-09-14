"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useMotionValue, useSpring } from "framer-motion";
import {
  ArrowRight,
  GraduationCap,
  User,
  Users,
  UsersRound,
} from "lucide-react";
import Link from "next/link";

import { Container } from "@/components/reusables";

const stats = [
  {
    id: 1,
    label: "শিক্ষার্থী",
    value: 130000,
    suffix: "+",
    description: "হাজার হাজার শিক্ষার্থী আমাদের সাথে শেখার যাত্রায় যুক্ত।",
    icon: User,
    iconBg: "#E8F0FE",
    accent: "#125BFF",
  },
  {
    id: 2,
    label: "বিশেষজ্ঞ শিক্ষক",
    value: 27,
    suffix: "+",
    description:
      "অভিজ্ঞ ও দক্ষ শিক্ষকরা শিক্ষার্থীদের সেরা শিক্ষা নিশ্চিত করছেন।",
    icon: Users,
    iconBg: "#E7F7ED",
    accent: "#16A34A",
  },
  {
    id: 3,
    label: "মেন্টরশিপ সেশন",
    value: 10000,
    suffix: "+",
    description: "ব্যক্তিগত মেন্টরশিপের মাধ্যমে লক্ষ্য অর্জনে সহায়তা করছি।",
    icon: GraduationCap,
    iconBg: "#F1EBFE",
    accent: "#7C3AED",
  },
  {
    id: 4,
    label: "অভিভাবক সেশন",
    value: 2000,
    suffix: "+",
    description:
      "অভিভাবকদের সাথে একসাথে কাজ করে শিক্ষার্থীদের উন্নয়নে সহযোগিতা করি।",
    icon: UsersRound,
    iconBg: "#FFF1E5",
    accent: "#FF7A00",
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
    <section className="relative overflow-hidden bg-[#FBFCFE] py-16 sm:py-20">
      <Container className="relative">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="max-w-2xl"
        >
          <span className="inline-flex items-center gap-2 rounded-full bg-[#EEF4FF] px-4 py-1.5 text-sm font-semibold text-[#125BFF]">
            <Users className="h-4 w-4" />
            আমাদের কমিউনিটি
          </span>

          <h2 className="mt-5 text-3xl font-bold leading-tight tracking-[-0.02em] text-[#0D1321] sm:text-4xl lg:text-[2.65rem]">
            শিক্ষার মাধ্যমে উজ্জ্বল ভবিষ্যতের পথে
          </h2>

          <p className="mt-4 text-base leading-7 text-[#64748B] sm:text-lg">
            মানসম্পন্ন শিক্ষা, ব্যক্তিগত দিকনির্দেশনা এবং একটি সহায়ক শেখার
            পরিবেশের মাধ্যমে আমরা শিক্ষার্থীদের উজ্জ্বল ভবিষ্যৎ গড়ে তুলতে কাজ
            করি।
          </p>

          <Link
            href="/about"
            className="mt-6 inline-flex items-center gap-2 rounded-xl border border-[#125BFF] bg-[#125BFF] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#125BFF]/90"
          >
            আরও জানুন
            <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>

        <div className="mt-10 grid items-stretch gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            const decimals = stat.value % 1 === 0 ? 0 : 1;

            return (
              <motion.article
                key={stat.id}
                initial={{ opacity: 0, y: 34, scale: 0.94 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, amount: 0.35 }}
                transition={{
                  duration: 0.55,
                  delay: index * 0.08,
                  ease: "easeOut",
                }}
                whileHover={{
                  y: -8,
                  transition: { type: "spring", stiffness: 320, damping: 20 },
                }}
                className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-[#EDF0F5] bg-white p-6 shadow-xl shadow-[#E5EAF3]"
              >
                <motion.div
                  initial={{ rotate: -8, scale: 0.9 }}
                  whileInView={{ rotate: 0, scale: 1 }}
                  viewport={{ once: true, amount: 0.5 }}
                  transition={{
                    type: "spring",
                    stiffness: 260,
                    damping: 16,
                    delay: index * 0.08 + 0.12,
                  }}
                  className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: stat.iconBg, color: stat.accent }}
                >
                  <Icon className="h-7 w-7" />
                </motion.div>

                <h3
                  className="text-4xl font-bold tracking-[-0.04em] sm:text-5xl"
                  style={{ color: stat.accent }}
                >
                  <AnimatedNumber
                    value={stat.value}
                    suffix={stat.suffix}
                    decimals={decimals}
                  />
                </h3>
                <p className="mt-3 text-lg font-bold text-[#0D1321]">
                  {stat.label}
                </p>
                <p className="mt-3 flex-1 leading-7 text-[#64748B]">
                  {stat.description}
                </p>
                <div
                  className="mt-5 h-1 w-10 shrink-0 rounded-full"
                  style={{ backgroundColor: stat.accent }}
                />
              </motion.article>
            );
          })}
        </div>
      </Container>
    </section>
  );
};

export default StatsSection;
