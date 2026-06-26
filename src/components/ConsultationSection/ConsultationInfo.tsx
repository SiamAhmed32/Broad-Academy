"use client";

import { useState } from "react";
import PrimaryButton from "../reusables/PrimaryButton";
import { CalendarCheck } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import BookingModal from "./BookingModal";

const ConsultationInfo = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="flex flex-col items-start text-left">
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.5 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="text-[32px] font-semibold leading-tight text-soft"
        >
          Parents, Need Help Choosing the Right Course?
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.6 }}
          transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
          className="mt-3 max-w-xl text-base leading-7 text-soft/80"
        >
          Talk to our academic advisor about your child&apos;s class, weak areas,
          goals, and the right course path before enrolling.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.6 }}
          transition={{ duration: 0.45, delay: 0.25, ease: "easeOut" }}
          className="mt-6 flex flex-wrap items-center gap-4 sm:gap-6"
        >
          <motion.div
            whileHover={{
              y: -4,
              transition: { type: "spring", stiffness: 420, damping: 28 },
            }}
            whileTap={{ scale: 0.96 }}
          >
            <PrimaryButton
              className="gap-3"
              type="button"
              onClick={() => setIsModalOpen(true)}
            >
              <CalendarCheck className="h-5 w-5" />
              Parent Counselling
            </PrimaryButton>
          </motion.div>

          <Link
            href="/counselling"
            className="group flex items-center gap-1.5 text-sm font-medium text-soft/70 transition-colors hover:text-accent"
          >
            <span>Learn More</span>
            <motion.span
              animate={{ x: [0, 4, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            >
              →
            </motion.span>
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
