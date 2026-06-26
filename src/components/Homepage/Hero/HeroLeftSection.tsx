"use client";

import PrimaryButton from "@/components/reusables/PrimaryButton";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { MessageCircle } from "lucide-react";
import React from "react";

const WHATSAPP_COMMUNITY_INVITE_URL =
  "https://chat.whatsapp.com/EXAMPLE_BROAD_ACADEMY_COMMUNITY";

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
      <motion.p
        variants={itemVariants}
        className="inline-flex items-center gap-2 rounded-full border border-white/22 bg-white/10 px-4 py-2 text-xs font-medium tracking-wide text-[#e4ecf6]"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-btnBg" />
        100% QUALITY COURSES
      </motion.p>

      <motion.h1
        variants={itemVariants}
        className="mt-5 max-w-2xl text-4xl font-semibold leading-[1.12] tracking-[-0.025em] text-[#fff8ef] sm:text-5xl lg:text-6xl"
      >
        Broad Academy
        <span className="mt-2 block text-[0.62em] leading-[1.3] tracking-[-0.015em] text-[#e4ecf6]">
          Learn Today, Lead Tomorrow, Grow to Infinity
        </span>
      </motion.h1>

      <motion.p
        variants={itemVariants}
        lang="bn"
        className="mt-6 max-w-xl text-base leading-8 text-[#cfdbe8] sm:text-lg"
      >
        স্বপ্ন শুধু দেখার জন্য নয়, পূরণ করার জন্য। ভয় না পেয়ে শুরু করো,
        প্রতিদিন একটু একটু করে এগিয়ে যাও—তোমার সফলতার গল্প শুরু হোক এখান
        থেকেই।
      </motion.p>

      <motion.div
        variants={itemVariants}
        className="mt-8 flex flex-wrap items-center gap-4"
      >
        <PrimaryButton
          href="/courses"
          className="bg-[#007bff] px-7 py-3.5 text-sm font-semibold text-soft transition hover:bg-btnBg/80"
        >
          Browse Courses
        </PrimaryButton>

        <a
          href={WHATSAPP_COMMUNITY_INVITE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex cursor-pointer items-center gap-2 rounded-lg border border-[#25D366]/30 bg-[#25D366] px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#25D366]/15 transition hover:-translate-y-0.5 hover:bg-[#20bd5a]"
          aria-label="Join the Broad Academy WhatsApp community"
        >
          <MessageCircle className="h-4 w-4 fill-current" />
          Join WhatsApp Community
        </a>
      </motion.div>
    </motion.div>
  );
};

export default HeroLeftSection;
