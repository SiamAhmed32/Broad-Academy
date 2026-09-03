"use client";

import PrimaryButton from "@/components/reusables/PrimaryButton";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { BookOpen, Sparkles, Users } from "lucide-react";

const HeroLeftSection = () => {
  const shouldReduceMotion = useReducedMotion();

  const containerVariants: Variants = {
    initial: {},
    animate: {
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.12,
      },
    },
  };

  const itemVariants: Variants = {
    initial: shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 34 },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.55,
        ease: "easeOut",
      },
    },
  };

  return (
    <motion.div
      className="max-w-2xl"
      variants={containerVariants}
      initial="initial"
      whileInView="animate"
      viewport={{ amount: 0.4 }}
    >
      <motion.span
        variants={itemVariants}
        className="inline-flex items-center gap-2 rounded-full border border-btnBg/15 bg-white px-4 py-2 text-sm font-semibold text-btnBg shadow-sm"
      >
        <Sparkles className="h-4 w-4" />
        100% Quality Courses
      </motion.span>

      <motion.h1
        variants={itemVariants}
        className="mt-6 max-w-2xl text-4xl font-extrabold leading-[1.15] tracking-[-0.025em] text-navy sm:text-5xl lg:text-[3.4rem]"
      >
        Building Brighter Futures Through Quality Education
      </motion.h1>

      <motion.div
        variants={itemVariants}
        className="mt-5 h-1 w-16 rounded-full bg-gradient-to-r from-navy to-btnBg"
      />

      <motion.p
        variants={itemVariants}
        className="mt-6 max-w-xl text-base leading-8 text-body sm:text-lg"
      >
        We empower students with expert guidance, practical learning and a
        supportive community—helping every learner build confidence, develop
        skills, and achieve lasting success.
      </motion.p>

      <motion.div
        variants={itemVariants}
        className="mt-8 flex flex-wrap items-center gap-4"
      >
        <PrimaryButton
          href="/instructors"
          className="gap-2 bg-btnBg px-6 py-3.5 text-sm font-semibold text-soft shadow-lg shadow-btnBg/20 transition hover:bg-btnBg/90 hover:text-soft"
        >
          <Users className="h-4 w-4" />
          Meet Our Team
        </PrimaryButton>

        <PrimaryButton
          href="/courses"
          className="gap-2 border border-navy/15 bg-white px-6 py-3.5 text-sm font-semibold text-btnBg transition hover:bg-navy/5"
        >
          <BookOpen className="h-4 w-4" />
          Explore Courses
        </PrimaryButton>
      </motion.div>
    </motion.div>
  );
};

export default HeroLeftSection;
