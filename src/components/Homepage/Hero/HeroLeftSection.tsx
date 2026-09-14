"use client";

import PrimaryButton from "@/components/reusables/PrimaryButton";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { BookOpen, Users } from "lucide-react";
import Link from "next/link";

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
      animate="animate"
    >
      <motion.h1
        variants={itemVariants}
        className="max-w-2xl text-4xl font-extrabold leading-[1.15] tracking-[-0.025em] text-navy sm:text-5xl lg:text-[3.25rem]"
      >
        Broad Academy — Learn Today, Lead Tomorrow, Grow to Infinity
      </motion.h1>

      <motion.div
        variants={itemVariants}
        className="mt-5 h-1 w-16 rounded-full bg-gradient-to-r from-navy to-btnBg"
      />

      <motion.p
        variants={itemVariants}
        lang="bn"
        className="font-bangla mt-6 max-w-xl text-[1.05rem] font-medium leading-[1.9] text-body sm:text-lg sm:leading-[1.95]"
      >
        স্বপ্ন শুধু দেখার জন্য নয়, পূরণ করার জন্য।
        <br />
        ভয় না পেয়ে শুরু করো, প্রতিদিন একটু একটু করে এগিয়ে যাও। তোমার সফলতার গল্প
        শুরু হোক এখান থেকেই।
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

        <Link
          href="/courses"
          className="inline-flex items-center gap-2 rounded-lg border border-navy/15 bg-white px-6 py-3.5 text-sm font-semibold text-btnBg transition hover:bg-navy/10 hover:text-btnBg"
        >
          <BookOpen className="h-4 w-4" />
          Explore Courses
        </Link>
      </motion.div>
    </motion.div>
  );
};

export default HeroLeftSection;
