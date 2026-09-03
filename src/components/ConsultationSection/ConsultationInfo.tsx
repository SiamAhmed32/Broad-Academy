"use client";

import { useState } from "react";
import PrimaryButton from "../reusables/PrimaryButton";
import { CalendarCheck, Info } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import BookingModal from "./BookingModal";
import { FamilyIcon } from "@/components/icons/BrandIcons";

const ConsultationInfo = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="flex max-w-xl flex-col items-start text-left">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.6 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="flex items-center gap-3"
        >
          <FamilyIcon className="h-7 w-11 shrink-0 text-btnBg" />
          <span className="inline-flex items-center rounded-full border border-btnBg/15 bg-white px-4 py-2 text-sm font-semibold text-btnBg shadow-sm">
            অভিভাবকদের জন্য
          </span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.5 }}
          transition={{ duration: 0.55, delay: 0.1, ease: "easeOut" }}
          lang="bn"
          className="mt-6 text-3xl font-extrabold leading-[1.2] tracking-[-0.02em] text-navy sm:text-4xl"
        >
          সন্তানের লক্ষ্য অনুযায়ী তৈরি করুন সঠিক শিক্ষার পরিকল্পনা
        </motion.h2>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: false, amount: 0.6 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mt-5 h-1 w-16 rounded-full bg-gradient-to-r from-navy to-btnBg"
        />

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.6 }}
          transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
          lang="bn"
          className="mt-6 max-w-xl text-base leading-8 text-body"
        >
          সন্তানের পড়াশোনা, শেখার অগ্রগতি এবং ভবিষ্যৎ লক্ষ্য নিয়ে সঠিক
          সিদ্ধান্ত নিতে আমাদের একাডেমিক কাউন্সেলর আপনার পাশে আছেন। ব্যক্তিগত
          পরামর্শের মাধ্যমে সন্তানের জন্য সেরা শেখার পরিকল্পনা নির্ধারণ করুন।
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.6 }}
          transition={{ duration: 0.45, delay: 0.25, ease: "easeOut" }}
          className="mt-8 flex flex-wrap items-center gap-4"
        >
          <PrimaryButton
            className="gap-2 bg-btnBg px-6 py-3.5 text-sm font-semibold text-soft shadow-lg shadow-btnBg/20 transition hover:bg-btnBg/90 hover:text-soft"
            type="button"
            onClick={() => setIsModalOpen(true)}
          >
            <CalendarCheck className="h-4 w-4" />
            কাউন্সেলিং বুক করুন
          </PrimaryButton>

          <Link
            href="/counselling"
            className="flex cursor-pointer items-center gap-2 rounded-lg border border-navy/15 bg-white px-6 py-3.5 text-sm font-semibold text-btnBg transition hover:bg-navy/5"
          >
            <Info className="h-4 w-4" />
            বিস্তারিত জানুন
          </Link>
        </motion.div>
      </div>

      <BookingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};

export default ConsultationInfo;
