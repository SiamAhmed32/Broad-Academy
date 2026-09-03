"use client";

import Image from "next/image";
import { motion } from "framer-motion";

const ConsultationImage = () => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94, x: -24 }}
      whileInView={{ opacity: 1, scale: 1, x: 0 }}
      viewport={{ once: false, amount: 0.4 }}
      transition={{ duration: 0.65, ease: "easeOut" }}
      className="relative mx-auto w-full max-w-[560px] shrink-0"
    >
      <div
        aria-hidden
        className="absolute -inset-6 -z-10 rounded-[3rem] bg-btnBg/6 blur-2xl"
      />
      <Image
        src="/consultation/counselling-illustration.png"
        height={408}
        width={612}
        className="h-auto w-full"
        alt="Academic counsellor guiding a parent and student through a video consultation"
      />
    </motion.div>
  );
};

export default ConsultationImage;
